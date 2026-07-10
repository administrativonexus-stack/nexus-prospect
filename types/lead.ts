import type { Database, LeadStatus } from "./database"

export type Lead = Database["public"]["Tables"]["leads"]["Row"]
export type LeadInsert = Database["public"]["Tables"]["leads"]["Insert"]
export type LeadUpdate = Database["public"]["Tables"]["leads"]["Update"]
export type { LeadStatus }

export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  lead_found: "Lead Encontrado",
  message_sent: "Mensagem Enviada",
  replied: "Respondeu",
  meeting_scheduled: "Reunião Marcada",
  proposal: "Proposta",
  closed: "Fechado",
  lost: "Perdido",
}

export const LEAD_STATUS_ORDER: LeadStatus[] = [
  "lead_found",
  "message_sent",
  "replied",
  "meeting_scheduled",
  "proposal",
  "closed",
  "lost",
]

export interface LeadFilters {
  status?: LeadStatus
  city?: string
  niche?: string
  search?: string
  page?: number
  limit?: number
}

export interface LeadWithDetails extends Lead {
  latest_conversation?: {
    message: string
    created_at: string
    sender: string
  } | null
  unread_count?: number
  audit?: {
    score: number
    created_at: string
  } | null
}
