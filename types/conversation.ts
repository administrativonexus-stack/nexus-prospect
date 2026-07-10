import type { Database, MessageSender } from "./database"

export type Conversation = Database["public"]["Tables"]["conversations"]["Row"]
export type ConversationInsert = Database["public"]["Tables"]["conversations"]["Insert"]
export type { MessageSender }

export interface ConversationListItem {
  lead_id: string
  company_name: string
  phone: string | null
  latest_message: string
  latest_at: string
  unread_count: number
}
