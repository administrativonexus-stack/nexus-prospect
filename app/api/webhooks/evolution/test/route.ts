import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { parseEvolutionWebhook } from "@/lib/evolution/webhook-parser"
import { createServiceClient } from "@/lib/supabase/server"

// Simulates a real inbound Evolution API webhook payload to test the full pipeline
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { phone } = await request.json().catch(() => ({}))
    const testPhone = phone || "5500000000001"

    // Build a fake Evolution API v2 webhook payload
    const fakePayload = {
      event: "messages.upsert",
      instance: "test",
      data: {
        key: {
          remoteJid: `${testPhone}@s.whatsapp.net`,
          fromMe: false,
          id: `TEST_${Date.now()}`,
        },
        message: {
          conversation: "[TESTE] Mensagem de teste do webhook",
        },
        messageTimestamp: Math.floor(Date.now() / 1000),
      },
    }

    // Step 1: test the parser
    const parsed = parseEvolutionWebhook(fakePayload)
    if (!parsed) {
      return NextResponse.json({ ok: false, step: "parser", error: "Parser retornou null" })
    }

    // Step 2: test the DB write
    const db = await createServiceClient()

    let leadId: string
    const { data: existingLead } = await db
      .from("leads")
      .select("id")
      .eq("phone", parsed.phone)
      .single()

    if (!existingLead) {
      const { data: newLead, error: createError } = await db
        .from("leads")
        .insert({
          company_name: `Teste Webhook (${parsed.phone})`,
          phone: parsed.phone,
          status: "replied" as const,
        })
        .select("id")
        .single()

      if (createError || !newLead) {
        return NextResponse.json({ ok: false, step: "lead_create", error: createError?.message })
      }
      leadId = newLead.id
    } else {
      leadId = existingLead.id
    }

    const { error: insertError } = await db.from("conversations").insert({
      lead_id: leadId,
      message: parsed.text,
      sender: "lead" as const,
      whatsapp_message_id: parsed.messageId,
      read: false,
    })

    if (insertError) {
      return NextResponse.json({ ok: false, step: "conversation_insert", error: insertError.message })
    }

    return NextResponse.json({
      ok: true,
      parsed,
      leadId,
      message: "Mensagem de teste salva com sucesso — verifique a aba Conversas",
    })
  } catch (error) {
    return NextResponse.json({
      ok: false,
      step: "unexpected",
      error: error instanceof Error ? error.message : String(error),
    })
  }
}
