import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { buildSDRSystemPrompt } from "@/lib/openai/sdr"
import { getOpenAIClient } from "@/lib/openai/client"
import { loadSDRConfig, type SDRProfile } from "@/lib/sdr/config"

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { message, history, profile } = await request.json()
    if (!message) return NextResponse.json({ error: "message required" }, { status: 400 })

    const config = await loadSDRConfig((profile as SDRProfile) ?? "default", user.id)
    const systemPrompt = buildSDRSystemPrompt(config, "Empresa Teste", "São Paulo")

    const openai = await getOpenAIClient(user.id)
    const response = await openai.chat.completions.create({
      model: config.model,
      temperature: config.temperature,
      max_tokens: config.maxTokens,
      messages: [
        { role: "system", content: systemPrompt },
        ...(Array.isArray(history) ? history : []),
        { role: "user", content: message },
      ],
    })

    const reply = response.choices[0].message.content ?? ""
    return NextResponse.json({ reply })
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Simulation error"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
