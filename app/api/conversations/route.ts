import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getConversationList } from "@/lib/supabase/queries/conversations"

export async function DELETE() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { error } = await supabase
      .from("conversations")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000")

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return new NextResponse(null, { status: 204 })
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to clear conversations"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const list = await getConversationList()
    return NextResponse.json(list)
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to fetch conversations"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
