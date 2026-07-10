import { sendTextMessage } from "@/lib/evolution/client"
import { createMessage } from "@/lib/supabase/queries/conversations"
import { createClient } from "@/lib/supabase/server"
import type { MessageSender } from "@/types/conversation"

export async function sendMessage(leadId: string, text: string, sender: MessageSender = "agent", userId?: string) {
  const supabase = await createClient()

  const [leadRes, userRes] = await Promise.all([
    supabase.from("leads").select("phone").eq("id", leadId).single(),
    userId ? Promise.resolve({ data: { user: { id: userId } } }) : supabase.auth.getUser(),
  ])

  const lead = leadRes.data
  const resolvedUserId = userId ?? (userRes as Awaited<ReturnType<typeof supabase.auth.getUser>>).data.user?.id

  if (!lead?.phone) throw new Error("Lead sem número de telefone")
  if (!resolvedUserId) throw new Error("Usuário não autenticado")

  await sendTextMessage(lead.phone, text, resolvedUserId)

  return createMessage({ lead_id: leadId, message: text, sender })
}
