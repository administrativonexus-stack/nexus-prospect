import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getConversationList, getConversationsByLead, markMessagesRead } from "@/lib/supabase/queries/conversations"
import { getLeadById } from "@/lib/supabase/queries/leads"
import { ConversationListPanel } from "@/components/conversations/conversation-list-panel"
import { ChatWindow } from "@/components/conversations/chat-window"
import { LeadInfoPanel } from "@/components/conversations/lead-info-panel"

interface Props {
  params: Promise<{ leadId: string }>
}

export default async function ConversationPage({ params }: Props) {
  const { leadId } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const [lead, messages, list] = await Promise.all([
    getLeadById(leadId).catch(() => null),
    getConversationsByLead(leadId).catch(() => []),
    getConversationList().catch(() => []),
  ])

  if (!lead) notFound()

  // Mark as read server-side
  await markMessagesRead(leadId).catch(() => {})

  return (
    <div className="flex h-[calc(100vh-4rem)] -mx-6 -mt-6 overflow-hidden">
      <ConversationListPanel leads={list} selectedLeadId={leadId} />
      <ChatWindow lead={lead} initialMessages={messages as any} />
      <LeadInfoPanel lead={lead} />
    </div>
  )
}
