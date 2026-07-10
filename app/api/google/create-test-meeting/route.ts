import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createMeetingEvent } from "@/lib/google/calendar"

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { email, dateTime } = await request.json()
    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: '"email" is required' }, { status: 400 })
    }
    if (!dateTime || typeof dateTime !== "string") {
      return NextResponse.json({ error: '"dateTime" is required' }, { status: 400 })
    }

    const startDateTime = new Date(dateTime)
    if (Number.isNaN(startDateTime.getTime())) {
      return NextResponse.json({ error: '"dateTime" is invalid' }, { status: 400 })
    }
    const endDateTime = new Date(startDateTime.getTime() + 60 * 60 * 1000) // 1h

    // The connected Google account is the calendar owner/organizer by default —
    // only the provided email needs to be added explicitly as an attendee
    const event = await createMeetingEvent({
      summary: "Reunião de teste — Nexus Prospect System",
      description: "Evento de teste criado pela página /calendar-test. Não vinculado a nenhum lead.",
      startDateTime: startDateTime.toISOString(),
      endDateTime: endDateTime.toISOString(),
      attendeeEmail: email,
    }, user.id)

    return NextResponse.json(event)
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to create test meeting"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
