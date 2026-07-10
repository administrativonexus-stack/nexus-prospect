import { createClient } from "@/lib/supabase/server"
import type { ConversationInsert } from "@/types/conversation"

export async function getConversationsByLead(leadId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("conversations")
    .select("*")
    .eq("lead_id", leadId)
    .order("created_at", { ascending: true })
  if (error) throw error
  return data
}

export async function createMessage(message: ConversationInsert) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("conversations")
    .insert(message)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function markMessagesRead(leadId: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from("conversations")
    .update({ read: true })
    .eq("lead_id", leadId)
    .eq("read", false)
  if (error) throw error
}

export async function getConversationList() {
  const supabase = await createClient()

  // Get all leads that have conversations, with latest message and unread count
  const { data, error } = await supabase
    .from("leads")
    .select(`
      id,
      company_name,
      phone,
      conversations (
        message,
        sender,
        read,
        created_at
      )
    `)
    .order("created_at", { ascending: false })

  if (error) throw error
  return data
}
