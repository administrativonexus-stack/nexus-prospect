import { createServiceClient } from "@/lib/supabase/server"
import { getSetting } from "@/lib/settings"
import { runSDRTurn } from "@/lib/openai/sdr"
import { sendTextMessage, sendPresence } from "@/lib/evolution/client"
import { loadSDRConfig } from "./config"
import { resolveSDRProfile } from "./profile"

export async function autoRespondSDR(leadId: string, inboundMessage: string, userId: string): Promise<void> {
  const [autoRespond, agentActive] = await Promise.all([
    getSetting("sdr_auto_respond", userId),
    getSetting("sdr_agent_active", userId),
  ])

  if (autoRespond !== "true" || agentActive === "false") return

  const supabase = await createServiceClient()

  const pauseRaw = await getSetting("sdr_pause_minutes", userId)
  const pauseMinutes = pauseRaw === "never" ? -1 : parseInt(pauseRaw ?? "30")

  if (pauseMinutes === -1) {
    const { count } = await supabase
      .from("conversations")
      .select("id", { count: "exact", head: true })
      .eq("lead_id", leadId)
      .eq("sender", "agent")
    if ((count ?? 0) > 0) return
  } else if (pauseMinutes > 0) {
    const { data: lastAgentMsg } = await supabase
      .from("conversations")
      .select("created_at")
      .eq("lead_id", leadId)
      .eq("sender", "agent")
      .order("created_at", { ascending: false })
      .limit(1)
      .single()

    if (lastAgentMsg) {
      const pausedUntil =
        new Date(lastAgentMsg.created_at).getTime() + pauseMinutes * 60_000
      if (Date.now() < pausedUntil) return
    }
  }

  const { data: lead } = await supabase
    .from("leads")
    .select("id, company_name, city, phone, niche")
    .eq("id", leadId)
    .single()

  if (!lead?.phone) return

  const { data: history } = await supabase
    .from("conversations")
    .select("*")
    .eq("lead_id", leadId)
    .order("created_at", { ascending: true })

  const profile = await resolveSDRProfile(lead.niche, userId)
  const config = await loadSDRConfig(profile, userId)

  void sendPresence(lead.phone, "composing", userId).catch(() => null)

  const result = await runSDRTurn(
    config,
    history ?? [],
    inboundMessage,
    lead.company_name,
    lead.city ?? "",
    userId
  )

  await supabase.from("conversations").insert({
    lead_id: leadId,
    message: result.reply,
    sender: "ai",
    read: true,
  })

  await sendTextMessage(lead.phone, result.reply, userId)

  if (result.meeting) {
    await supabase.from("meetings").insert({
      lead_id: leadId,
      meeting_date: result.meeting.startTime,
      meeting_link: result.meeting.meetLink ?? result.meeting.htmlLink,
      google_event_id: result.meeting.eventId,
      status: "scheduled",
      notes: result.meeting.notes,
    })
    await supabase
      .from("leads")
      .update({ status: "meeting_scheduled" })
      .eq("id", leadId)
  }
}
