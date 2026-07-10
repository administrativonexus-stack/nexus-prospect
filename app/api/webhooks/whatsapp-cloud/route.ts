import { NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/server"
import { getSetting } from "@/lib/settings"
import { autoRespondSDR } from "@/lib/sdr/auto-respond"
import {
  verifyHandshake,
  verifySignature,
  parseStatusEvents,
  parseInboundMessages,
} from "@/lib/whatsapp-cloud/webhook-parser"

// GET — one-time handshake when registering the webhook URL in the Meta App Dashboard
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const mode = searchParams.get("hub.mode")
  const token = searchParams.get("hub.verify_token")
  const challenge = searchParams.get("hub.challenge")

  const expectedToken = await getSetting("whatsapp_cloud_verify_token")

  console.log(
    `[whatsapp-cloud webhook] handshake params: mode=${mode} token=${token} challenge=${challenge} expectedToken=${expectedToken}`
  )

  if (!expectedToken) return new NextResponse(null, { status: 403 })

  const result = verifyHandshake(mode, token, challenge, expectedToken)
  console.log("[whatsapp-cloud webhook] verifyHandshake returned null:", result === null)
  if (result === null) return new NextResponse(null, { status: 403 })

  return new NextResponse(result, { status: 200, headers: { "Content-Type": "text/plain" } })
}

// Status lifecycle rank — used to avoid out-of-order webhook deliveries downgrading a recipient's status
const STATUS_RANK: Record<string, number> = {
  pending: 0,
  sending: 1,
  sent: 2,
  delivered: 3,
  read: 4,
  replied: 5,
  failed: 5,
  skipped: 5,
}

export async function POST(request: Request) {
  const rawBody = await request.text()

  const appSecret = await getSetting("whatsapp_cloud_app_secret")
  if (appSecret) {
    const signature = request.headers.get("x-hub-signature-256")
    if (!verifySignature(rawBody, signature, appSecret)) {
      return new NextResponse(null, { status: 401 })
    }
  }

  try {
    const body = JSON.parse(rawBody)
    const supabase = await createServiceClient()

    // Status callbacks: sent / delivered / read / failed
    const statusEvents = parseStatusEvents(body)
    for (const event of statusEvents) {
      const { data: recipient } = await supabase
        .from("campaign_recipients")
        .select("id, campaign_id, status")
        .eq("whatsapp_message_id", event.whatsappMessageId)
        .maybeSingle()
      if (!recipient) continue

      if (STATUS_RANK[event.status] <= STATUS_RANK[recipient.status]) continue

      const timestampField =
        event.status === "sent" ? "sent_at"
        : event.status === "delivered" ? "delivered_at"
        : event.status === "read" ? "read_at"
        : null

      await supabase
        .from("campaign_recipients")
        .update({
          status: event.status,
          ...(timestampField ? { [timestampField]: new Date(event.timestamp * 1000).toISOString() } : {}),
          ...(event.status === "failed" ? { error_message: event.errorMessage ?? "Delivery failed" } : {}),
        })
        .eq("id", recipient.id)

      await supabase.from("campaign_events").insert({
        campaign_id: recipient.campaign_id,
        recipient_id: recipient.id,
        event_type: event.status,
        raw_payload: event as unknown as Record<string, unknown>,
      })
    }

    // Inbound replies — dual-write into the regular conversations inbox
    const inboundMessages = parseInboundMessages(body)
    for (const msg of inboundMessages) {
      const { data: lead } = await supabase
        .from("leads")
        .select("id")
        .eq("phone", msg.phone)
        .maybeSingle()

      let leadId: string
      if (!lead) {
        const { data: newLead, error: createError } = await supabase
          .from("leads")
          .insert({
            company_name: msg.contactName || `Contato (${msg.phone})`,
            phone: msg.phone,
            status: "replied",
          })
          .select("id")
          .single()
        if (createError || !newLead) continue
        leadId = newLead.id
      } else {
        leadId = lead.id
      }

      await supabase.from("conversations").insert({
        lead_id: leadId,
        message: msg.text,
        sender: "lead",
        whatsapp_message_id: msg.messageId,
        read: false,
      })

      // Mark the most recent non-replied campaign recipient row for this lead as replied
      const { data: recipient } = await supabase
        .from("campaign_recipients")
        .select("id, campaign_id, status")
        .eq("lead_id", leadId)
        .in("status", ["sent", "delivered", "read"])
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()

      if (recipient) {
        await supabase
          .from("campaign_recipients")
          .update({ status: "replied", replied_at: new Date().toISOString() })
          .eq("id", recipient.id)

        await supabase.from("campaign_events").insert({
          campaign_id: recipient.campaign_id,
          recipient_id: recipient.id,
          event_type: "replied",
        })
      }

      // Reuses the existing SDR auto-respond toggle — campaign replies are treated like any other inbound message
      void autoRespondSDR(leadId, msg.text)
    }

    return new NextResponse(null, { status: 200 })
  } catch {
    return new NextResponse(null, { status: 200 }) // Always 200 to Meta to avoid retry storms
  }
}
