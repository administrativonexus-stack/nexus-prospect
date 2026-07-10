import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getConversationsByLead, markMessagesRead } from "@/lib/supabase/queries/conversations"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ leadId: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { leadId } = await params
    const messages = await getConversationsByLead(leadId)

    // Mark as read when fetched
    await markMessagesRead(leadId)

    return NextResponse.json(messages)
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to fetch messages"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
