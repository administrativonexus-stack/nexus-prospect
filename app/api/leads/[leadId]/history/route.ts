import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getLeadHistory } from "@/lib/supabase/queries/leads"

type Params = { params: Promise<{ leadId: string }> }

export async function GET(_req: Request, { params }: Params) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { leadId } = await params
    const history = await getLeadHistory(leadId)
    return NextResponse.json(history)
  } catch {
    return NextResponse.json({ error: "Failed to fetch history" }, { status: 500 })
  }
}
