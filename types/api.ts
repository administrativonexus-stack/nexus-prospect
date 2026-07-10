import type { LeadStatus } from "./lead"
export type { ScrapedCompany } from "@/lib/prospecting/types"
import type { ScrapedCompany } from "@/lib/prospecting/types"
import type { ImportResult } from "@/types/prospecting"

export interface SearchProspectingRequest {
  niche: string
  city: string
  limit: number
}

export interface ImportLeadRequest {
  company: ScrapedCompany
}

export type { ImportResult as ImportLeadResponse }

export interface SendMessageRequest {
  lead_id: string
  message: string
  use_ai?: boolean
}

export interface SDRChatRequest {
  lead_id: string
  user_message: string
}

export interface SDRChatResponse {
  reply: string
  meeting?: {
    eventId: string
    meetLink: string | null
    htmlLink: string
    startTime: string
    email: string
    notes: string
  }
}

export interface CreateMeetingRequest {
  lead_id: string
  proposed_date: string
}

export interface UpdateLeadStatusRequest {
  status: LeadStatus
}

export interface DashboardMetrics {
  leads_today: number
  leads_month: number
  messages_sent: number
  replies_received: number
  meetings_scheduled: number
  deals_closed: number
  funnel: {
    leads: number
    messages: number
    replies: number
    meetings: number
    sales: number
  }
}

export interface ApiError {
  error: string
  details?: string
}
