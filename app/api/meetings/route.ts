import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createMeetingEvent } from "@/lib/google/calendar"
import { sendTextMessage } from "@/lib/evolution/client"
import type { CreateMeetingRequest } from "@/types/api"

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body: CreateMeetingRequest = await request.json()
    const { lead_id, proposed_date } = body

    const { data: lead } = await supabase
      .from("leads")
      .select("company_name, phone")
      .eq("id", lead_id)
      .single()

    if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 })

    const startDateTime = new Date(proposed_date)
    const endDateTime = new Date(startDateTime.getTime() + 60 * 60 * 1000) // 1h

    const event = await createMeetingEvent({
      summary: `Reunião Nexus × ${lead.company_name}`,
      description: "Reunião de diagnóstico agendada pelo Nexus Prospect System",
      startDateTime: startDateTime.toISOString(),
      endDateTime: endDateTime.toISOString(),
    }, user.id)

    const { data: meeting } = await supabase
      .from("meetings")
      .insert({
        lead_id,
        meeting_date: startDateTime.toISOString(),
        meeting_link: event.meetLink ?? event.htmlLink,
        google_event_id: event.eventId,
        status: "scheduled",
      })
      .select()
      .single()

    if (lead.phone) {
      const dateStr = startDateTime.toLocaleString("pt-BR", {
        dateStyle: "full",
        timeStyle: "short",
        timeZone: "America/Sao_Paulo",
      })
      const confirmMsg =
        `Reunião confirmada!\n\n` +
        `Data: ${dateStr}\n` +
        `Link: ${event.meetLink ?? event.htmlLink}\n\n` +
        `Até logo!`

      await sendTextMessage(lead.phone, confirmMsg, user.id).catch(() => null)
    }

    await Promise.all([
      supabase.from("leads").update({ status: "meeting_scheduled" }).eq("id", lead_id),
      supabase.from("lead_history").insert({
        lead_id,
        action: "meeting_created",
        description: `Reunião agendada para ${startDateTime.toLocaleString("pt-BR")}`,
        performed_by: user.id,
      }),
    ])

    return NextResponse.json(meeting)
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to create meeting"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
