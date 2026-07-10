import { NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/server"
import { parseEvolutionWebhook } from "@/lib/evolution/webhook-parser"
import { getSetting, getUserIdBySettingValue } from "@/lib/settings"
import { autoRespondSDR } from "@/lib/sdr/auto-respond"
import { timingSafeEqual } from "crypto"

function safeCompare(a: string, b: string): boolean {
  try {
    const bufA = Buffer.from(a)
    const bufB = Buffer.from(b)
    if (bufA.length !== bufB.length) return false
    return timingSafeEqual(bufA, bufB)
  } catch {
    return false
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    // Identify which user owns this webhook by matching the incoming instance name
    // to the evolution_instance setting stored per user in the DB.
    const incomingInstance = (body as Record<string, unknown>).instance as string | undefined
    const userId = incomingInstance
      ? await getUserIdBySettingValue("evolution_instance", incomingInstance)
      : null

    // Verify shared secret (global env var — applies to all users' webhooks)
    const secret = process.env.EVOLUTION_WEBHOOK_SECRET
    if (secret) {
      const incomingSecret = request.headers.get("x-webhook-secret") ?? ""
      if (!safeCompare(incomingSecret, secret)) {
        return new NextResponse(null, { status: 401 })
      }
    }

    const parsed = parseEvolutionWebhook(body)

    if (!parsed || parsed.isFromMe) {
      return new NextResponse(null, { status: 200 })
    }

    const supabase = await createServiceClient()

    // Find lead by phone number, scoped to the owning user when known
    const leadQuery = supabase
      .from("leads")
      .select("id, company_name")
      .eq("phone", parsed.phone)

    if (userId) {
      leadQuery.eq("imported_by", userId)
    }

    const { data: lead } = await leadQuery.single()

    let leadId: string
    const contactName = parsed.pushName || `Contato (${parsed.phone})`

    if (!lead) {
      // Auto-create lead, assigning it to the user who owns this instance
      const insertData: Record<string, unknown> = {
        company_name: contactName,
        phone: parsed.phone,
        status: "replied",
      }
      if (userId) insertData.imported_by = userId

      const { data: newLead, error: createError } = await supabase
        .from("leads")
        .insert(insertData)
        .select("id")
        .single()

      if (createError || !newLead) return new NextResponse(null, { status: 200 })
      leadId = newLead.id
    } else {
      leadId = lead.id
      if (
        parsed.pushName &&
        (lead.company_name.startsWith("Contato Desconhecido") ||
          lead.company_name.startsWith("Contato ("))
      ) {
        await supabase
          .from("leads")
          .update({ company_name: parsed.pushName })
          .eq("id", leadId)
      }
    }

    await supabase.from("conversations").insert({
      lead_id: leadId,
      message: parsed.text,
      sender: "lead",
      whatsapp_message_id: parsed.messageId,
      read: false,
    })

    // Only auto-respond if we know which user this instance belongs to
    if (userId) {
      void autoRespondSDR(leadId, parsed.text, userId)
    }

    return new NextResponse(null, { status: 200 })
  } catch {
    return new NextResponse(null, { status: 200 }) // Always 200 to Evolution API
  }
}
