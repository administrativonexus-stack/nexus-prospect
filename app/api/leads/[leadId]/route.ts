import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getLeadById, updateLead, deleteLead } from "@/lib/supabase/queries/leads"

type Params = { params: Promise<{ leadId: string }> }

export async function GET(_req: Request, { params }: Params) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { leadId } = await params
    const lead = await getLeadById(leadId)
    return NextResponse.json(lead)
  } catch {
    return NextResponse.json({ error: "Lead not found" }, { status: 404 })
  }
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { leadId } = await params
    const body = await request.json()
    const lead = await updateLead(leadId, body)
    return NextResponse.json(lead)
  } catch {
    return NextResponse.json({ error: "Failed to update lead" }, { status: 500 })
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { leadId } = await params
    await deleteLead(leadId)
    return new NextResponse(null, { status: 204 })
  } catch {
    return NextResponse.json({ error: "Failed to delete lead" }, { status: 500 })
  }
}
