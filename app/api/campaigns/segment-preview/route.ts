import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { resolveSegmentLeads, type SegmentFilters } from "@/lib/supabase/queries/campaigns"

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const filters = (await request.json()) as SegmentFilters
    const leads = await resolveSegmentLeads(filters ?? {})

    return NextResponse.json({
      count: leads.length,
      sample: leads.slice(0, 10),
    })
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to preview segment"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
