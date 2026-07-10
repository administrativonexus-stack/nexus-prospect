import type OpenAI from "openai"
import { getAvailableMeetingSlots, createMeetingEvent, isSlotAvailable } from "@/lib/google/calendar"

export const SDR_TOOLS: OpenAI.Chat.Completions.ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "getAvailableMeetingSlots",
      description: "Returns the next available meeting slots from the connected Google Calendar.",
      parameters: {
        type: "object",
        properties: {},
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "createMeetingEvent",
      description:
        "Creates a Google Calendar event, generates a Google Meet link and sends invitations. " +
        "Only call this after the lead has confirmed a specific date/time and provided their email. " +
        "qualificationSummary is for INTERNAL use only (saved to the CRM, never shown to the lead) — fill it " +
        "with whatever you actually asked and learned in this conversation, as short bullet points.",
      parameters: {
        type: "object",
        properties: {
          email: {
            type: "string",
            description: "Email address of the lead to invite to the meeting",
          },
          startTime: {
            type: "string",
            description: "ISO 8601 datetime for the meeting start time (e.g. 2026-06-22T14:00:00-03:00)",
          },
          contactName: {
            type: "string",
            description: 'Name of the person you are talking to. Use "Não informado" if unknown.',
          },
          qualificationSummary: {
            type: "string",
            description:
              "Internal notes for the human who will run the meeting — short bullet points (one per line, " +
              'starting with "- ") summarizing whatever you actually asked and learned about this lead during ' +
              "the conversation (varies by persona/script — don't force-fit fields you never asked about).",
          },
        },
        required: ["email", "startTime"],
        additionalProperties: false,
      },
    },
  },
]

export interface SDRMeetingResult {
  eventId: string
  meetLink: string | null
  htmlLink: string
  startTime: string
  email: string
  notes: string
}

interface SDRToolExecutionResult {
  output: unknown
  meeting?: SDRMeetingResult
}

interface SDRToolContext {
  leadCompanyName: string
  userId: string
}

function fallback(value: unknown): string {
  return typeof value === "string" && value.trim() ? value.trim() : "Não informado"
}

export async function executeSDRTool(
  name: string,
  args: Record<string, unknown>,
  context: SDRToolContext
): Promise<SDRToolExecutionResult> {
  if (name === "getAvailableMeetingSlots") {
    try {
      const slots = await getAvailableMeetingSlots(3, context.userId)
      return { output: { slots } }
    } catch (err) {
      return { output: { error: err instanceof Error ? err.message : "Failed to fetch available slots" } }
    }
  }

  if (name === "createMeetingEvent") {
    const email = typeof args.email === "string" ? args.email : ""
    const startTime = typeof args.startTime === "string" ? args.startTime : ""

    if (!email || !startTime) {
      return { output: { error: '"email" and "startTime" are required' } }
    }

    const start = new Date(startTime)
    if (Number.isNaN(start.getTime())) {
      return { output: { error: '"startTime" is not a valid date' } }
    }
    const end = new Date(start.getTime() + 60 * 60 * 1000)

    try {
      const available = await isSlotAvailable(start.toISOString(), end.toISOString(), context.userId)
      if (!available) {
        return {
          output: {
            error: "Esse horário não está mais disponível. Chame getAvailableMeetingSlots para ver outras opções.",
          },
        }
      }

      const contactName = fallback(args.contactName)
      const qualificationSummary = fallback(args.qualificationSummary)

      const summary =
        contactName !== "Não informado"
          ? `Reunião comercial — ${contactName} (${context.leadCompanyName})`
          : `Reunião comercial — ${context.leadCompanyName}`

      const publicDescription =
        "Reunião comercial agendada com a Nexus. Qualquer dúvida, é só responder este convite."

      const notes = [
        `Cliente: ${contactName}`,
        `Empresa: ${context.leadCompanyName}`,
        "",
        qualificationSummary,
        "",
        "Reunião agendada automaticamente pelo SDR de IA.",
      ].join("\n")

      const event = await createMeetingEvent({
        summary,
        description: publicDescription,
        startDateTime: start.toISOString(),
        endDateTime: end.toISOString(),
        attendeeEmail: email,
      }, context.userId)

      const meeting: SDRMeetingResult = {
        eventId: event.eventId,
        meetLink: event.meetLink,
        htmlLink: event.htmlLink,
        startTime: start.toISOString(),
        email,
        notes,
      }

      return {
        output: { eventId: event.eventId, meetLink: event.meetLink, htmlLink: event.htmlLink },
        meeting,
      }
    } catch (err) {
      return { output: { error: err instanceof Error ? err.message : "Failed to create meeting" } }
    }
  }

  return { output: { error: `Unknown tool: ${name}` } }
}
