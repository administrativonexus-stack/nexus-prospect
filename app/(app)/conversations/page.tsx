import { createClient } from "@/lib/supabase/server"
import { getConversationList } from "@/lib/supabase/queries/conversations"
import { ConversationListPanel } from "@/components/conversations/conversation-list-panel"
import { MessageSquare } from "lucide-react"

export default async function ConversationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  let list: Awaited<ReturnType<typeof getConversationList>> = []
  try {
    list = await getConversationList()
  } catch {
    list = []
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] -mx-6 -mt-6 overflow-hidden">
      <ConversationListPanel leads={list} selectedLeadId={null} />

      {/* Empty state */}
      <div className="flex flex-1 items-center justify-center text-center bg-[#0B141A]">
        <div className="space-y-3">
          <div className="mx-auto w-16 h-16 rounded-full bg-[#202C33] flex items-center justify-center">
            <MessageSquare className="h-7 w-7 text-[#8696A0]" />
          </div>
          <div>
            <p className="text-sm font-medium text-[#E9EDEF]">Suas mensagens</p>
            <p className="text-xs text-[#8696A0] mt-1">Selecione uma conversa para abrir</p>
          </div>
        </div>
      </div>
    </div>
  )
}
