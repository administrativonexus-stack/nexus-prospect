import { getValidToken } from "./token-store"

const CALENDAR_API = "https://www.googleapis.com/calendar/v3"

export interface CreateEventParams {
  summary: string
  description?: string
  startDateTime: string
  endDateTime: string
  attendeeEmail?: string
}

export interface CreatedEvent {
  eventId: string
  meetLink: string | null
  htmlLink: string
}

export async function createMeetingEvent(params: CreateEventParams, userId: string): Promise<CreatedEvent> {
  const token = await getValidToken(userId)
  const { summary, description, startDateTime, endDateTime, attendeeEmail } = params

  const body: Record<string, unknown> = {
    summary,
    description,
    start: { dateTime: startDateTime, timeZone: "America/Sao_Paulo" },
    end: { dateTime: endDateTime, timeZone: "America/Sao_Paulo" },
    conferenceData: {
      createRequest: {
        requestId: `nexus-${Date.now()}`,
        conferenceSolutionKey: { type: "hangoutsMeet" },
      },
    },
  }

  if (attendeeEmail) {
    body.attendees = [{ email: attendeeEmail }]
  }

  const res = await fetch(
    `${CALENDAR_API}/calendars/primary/events?conferenceDataVersion=1&sendUpdates=all`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    }
  )

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Google Calendar API error: ${err}`)
  }

  const event = await res.json()

  return {
    eventId: event.id,
    meetLink: event.hangoutLink ?? null,
    htmlLink: event.htmlLink,
  }
}

export interface AvailableSlot {
  start: string
  end: string
}

const BUSINESS_START_HOUR = 9
const BUSINESS_END_HOUR = 18
const SLOT_DURATION_MINUTES = 60
const LOOKAHEAD_DAYS = 14

interface BusyPeriod {
  start: string
  end: string
}

function overlapsAny(start: Date, end: Date, busy: BusyPeriod[]): boolean {
  return busy.some((b) => {
    const busyStart = new Date(b.start)
    const busyEnd = new Date(b.end)
    return start < busyEnd && end > busyStart
  })
}

async function queryFreeBusy(timeMin: string, timeMax: string, userId: string): Promise<BusyPeriod[]> {
  const token = await getValidToken(userId)

  const res = await fetch(`${CALENDAR_API}/freeBusy`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      timeMin,
      timeMax,
      items: [{ id: "primary" }],
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Google Calendar API error: ${err}`)
  }

  const data = await res.json()
  return data.calendars?.primary?.busy ?? []
}

export async function getAvailableMeetingSlots(count = 3, userId: string): Promise<AvailableSlot[]> {
  const now = new Date()
  const timeMax = new Date(now.getTime() + LOOKAHEAD_DAYS * 24 * 60 * 60 * 1000).toISOString()
  const busy = await queryFreeBusy(now.toISOString(), timeMax, userId)

  const slots: AvailableSlot[] = []

  for (let dayOffset = 0; dayOffset < LOOKAHEAD_DAYS && slots.length < count; dayOffset++) {
    const day = new Date(now)
    day.setDate(day.getDate() + dayOffset)
    const dayOfWeek = day.getDay()
    if (dayOfWeek === 0 || dayOfWeek === 6) continue // skip weekends

    for (let hour = BUSINESS_START_HOUR; hour < BUSINESS_END_HOUR && slots.length < count; hour++) {
      const slotStart = new Date(day)
      slotStart.setHours(hour, 0, 0, 0)
      const slotEnd = new Date(slotStart.getTime() + SLOT_DURATION_MINUTES * 60 * 1000)

      if (slotStart < now) continue

      if (!overlapsAny(slotStart, slotEnd, busy)) {
        slots.push({ start: slotStart.toISOString(), end: slotEnd.toISOString() })
      }
    }
  }

  return slots
}

export async function isSlotAvailable(startDateTime: string, endDateTime: string, userId: string): Promise<boolean> {
  const busy = await queryFreeBusy(startDateTime, endDateTime, userId)
  return !overlapsAny(new Date(startDateTime), new Date(endDateTime), busy)
}
