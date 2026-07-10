import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getLeads, createLead } from "@/lib/supabase/queries/leads"
import type { LeadFilters } from "@/types/lead"

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const filters: LeadFilters = {
      status: searchParams.get("status") as LeadFilters["status"] || undefined,
      city: searchParams.get("city") || undefined,
      niche: searchParams.get("niche") || undefined,
      search: searchParams.get("search") || undefined,
      page: Number(searchParams.get("page") || 1),
      limit: Number(searchParams.get("limit") || 50),
    }

    const leads = await getLeads(filters)
    return NextResponse.json(leads)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch leads" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await request.json()
    const lead = await createLead({ ...body, imported_by: user.id })
    return NextResponse.json(lead, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: "Failed to create lead" }, { status: 500 })
  }
}
