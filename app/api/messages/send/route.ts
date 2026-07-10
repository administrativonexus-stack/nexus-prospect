import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { sendMessage } from "@/lib/services/message.service"
import type { SendMessageRequest } from "@/types/api"

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body: SendMessageRequest = await request.json()
  const { lead_id, message } = body

  try {
    const saved = await sendMessage(lead_id, message, "agent", user.id)
    return NextResponse.json(saved, { status: 201 })
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to send message"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
