import { NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/server"
import { getSetting } from "@/lib/settings"
import { sendTemplateMessage } from "@/lib/whatsapp-cloud/client"
import { safeCompare } from "@/lib/whatsapp-cloud/webhook-parser"
import type { TemplateComponent } from "@/lib/whatsapp-cloud/types"

export const maxDuration = 300

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function POST(request: Request) {
  try {
    const dispatchSecret = await getSetting("campaign_dispatch_secret")
    if (dispatchSecret) {
      const incoming = request.headers.get("x-dispatch-secret") ?? ""
      if (!safeCompare(incoming, dispatchSecret)) {
        return new NextResponse(null, { status: 401 })
      }
    }

    const supabase = await createServiceClient()

    // 1. Find the due campaign — prefer one already sending (resume), else the earliest due scheduled one
    const { data: sendingCampaign } = await supabase
      .from("campaigns")
      .select("*")
      .eq("status", "sending")
      .order("started_at", { ascending: true })
      .limit(1)
      .maybeSingle()

    let campaign = sendingCampaign

    if (!campaign) {
      const { data: dueCampaign } = await supabase
        .from("campaigns")
        .select("*")
        .eq("status", "scheduled")
        .lte("scheduled_at", new Date().toISOString())
        .order("scheduled_at", { ascending: true })
        .limit(1)
        .maybeSingle()
      campaign = dueCampaign
    }

    if (!campaign) {
      return NextResponse.json({ ok: true, message: "No due campaigns" })
    }

    if (campaign.status !== "sending") {
      await supabase
        .from("campaigns")
        .update({ status: "sending", started_at: campaign.started_at ?? new Date().toISOString() })
        .eq("id", campaign.id)
    }

    const [rateLimitRaw, batchSizeRaw, dailyTierLimitRaw] = await Promise.all([
      getSetting("campaign_rate_limit_per_second"),
      getSetting("campaign_batch_size"),
      getSetting("campaign_daily_tier_limit"),
    ])
    const rateLimitPerSecond = parseInt(rateLimitRaw ?? "8") || 8
    const batchSize = parseInt(batchSizeRaw ?? "200") || 200
    const dailyTierLimit = dailyTierLimitRaw ? parseInt(dailyTierLimitRaw) : null

    // 2. 24h tier guard — separate concern from the per-second throttle below
    let effectiveBatch = batchSize
    if (dailyTierLimit) {
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      const { data: sentLast24h } = await supabase
        .from("campaign_recipients")
        .select("lead_id")
        .gte("sent_at", since)
      const distinctSent = new Set((sentLast24h ?? []).map((r) => r.lead_id)).size
      effectiveBatch = Math.max(0, Math.min(batchSize, dailyTierLimit - distinctSent))
    }

    if (effectiveBatch === 0) {
      return NextResponse.json({ ok: true, message: "Daily tier limit reached, will retry later" })
    }

    // 3. Fetch the next batch of pending recipients
    const { data: recipients, error: recipientsError } = await supabase
      .from("campaign_recipients")
      .select("id, lead_id, leads(phone, company_name)")
      .eq("campaign_id", campaign.id)
      .eq("status", "pending")
      .limit(effectiveBatch)
    if (recipientsError) throw recipientsError

    let sentCount = 0
    let failedCount = 0
    const delayMs = Math.ceil(1000 / rateLimitPerSecond)

    // 4. Sequential loop — intentional, not Promise.all, so the rate limit is enforced by construction
    for (let i = 0; i < (recipients ?? []).length; i++) {
      const recipient = recipients![i]
      const lead = Array.isArray(recipient.leads) ? recipient.leads[0] : recipient.leads

      if (!lead?.phone) {
        await supabase
          .from("campaign_recipients")
          .update({ status: "failed", error_message: "Lead has no phone number" })
          .eq("id", recipient.id)
        failedCount++
        continue
      }

      try {
        const result = await sendTemplateMessage({
          to: lead.phone,
          templateName: campaign.template_name,
          languageCode: campaign.template_language,
          components: (campaign.template_components as TemplateComponent[] | null) ?? undefined,
        })

        await supabase
          .from("campaign_recipients")
          .update({
            status: "sent",
            whatsapp_message_id: result.whatsappMessageId,
            sent_at: new Date().toISOString(),
          })
          .eq("id", recipient.id)

        await supabase.from("campaign_events").insert({
          campaign_id: campaign.id,
          recipient_id: recipient.id,
          event_type: "sent",
        })

        sentCount++
      } catch (err) {
        await supabase
          .from("campaign_recipients")
          .update({
            status: "failed",
            error_message: err instanceof Error ? err.message : "Unknown error",
          })
          .eq("id", recipient.id)

        await supabase.from("campaign_events").insert({
          campaign_id: campaign.id,
          recipient_id: recipient.id,
          event_type: "failed",
        })

        failedCount++
      }

      if (i < (recipients ?? []).length - 1) await sleep(delayMs)
    }

    // 5. Completion check
    const { count: remainingPending } = await supabase
      .from("campaign_recipients")
      .select("id", { count: "exact", head: true })
      .eq("campaign_id", campaign.id)
      .eq("status", "pending")

    if ((remainingPending ?? 0) === 0) {
      await supabase
        .from("campaigns")
        .update({ status: "completed", completed_at: new Date().toISOString() })
        .eq("id", campaign.id)
    }

    return NextResponse.json({
      ok: true,
      campaign_id: campaign.id,
      sent: sentCount,
      failed: failedCount,
      remaining: remainingPending ?? 0,
    })
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Dispatch failed"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
