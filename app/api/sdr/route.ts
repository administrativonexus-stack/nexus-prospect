import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { runSDRTurn } from "@/lib/openai/sdr"
import { loadSDRConfig } from "@/lib/sdr/config"
import { resolveSDRProfile } from "@/lib/sdr/profile"
import { getConversationsByLead, createMessage } from "@/lib/supabase/queries/conversations"
import type { SDRChatRequest } from "@/types/api"

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body: SDRChatRequest = await request.json()
    const { lead_id, user_message } = body

    const { data: lead } = await supabase
      .from("leads")
      .select("company_name, city, phone, niche")
      .eq("id", lead_id)
      .single()

    if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 })

    const profile = await resolveSDRProfile(lead.niche, user.id)
    const [history, config] = await Promise.all([
      getConversationsByLead(lead_id),
      loadSDRConfig(profile, user.id),
    ])

    const result = await runSDRTurn(
      config,
      history,
      user_message,
      lead.company_name,
      lead.city ?? "",
      user.id
    )

    await createMessage({
      lead_id,
      message: result.reply,
      sender: "ai",
    })

    if (result.meeting) {
      await supabase.from("meetings").insert({
        lead_id,
        meeting_date: result.meeting.startTime,
        meeting_link: result.meeting.meetLink ?? result.meeting.htmlLink,
        google_event_id: result.meeting.eventId,
        status: "scheduled",
        notes: result.meeting.notes,
      })
      await supabase
        .from("leads")
        .update({ status: "meeting_scheduled" })
        .eq("id", lead_id)
    }

    return NextResponse.json(result)
  } catch (error) {
    const msg = error instanceof Error ? error.message : "SDR error"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
