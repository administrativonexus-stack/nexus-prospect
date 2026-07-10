import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { updateLeadStatus } from "@/lib/supabase/queries/leads"
import type { UpdateLeadStatusRequest } from "@/types/api"

type Params = { params: Promise<{ leadId: string }> }

export async function PATCH(request: Request, { params }: Params) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { leadId } = await params
    const { status }: UpdateLeadStatusRequest = await request.json()

    const lead = await updateLeadStatus(leadId, status, user.id)
    return NextResponse.json(lead)
  } catch {
    return NextResponse.json({ error: "Failed to update status" }, { status: 500 })
  }
}
