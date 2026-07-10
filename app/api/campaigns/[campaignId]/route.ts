import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getCampaignDetail } from "@/lib/supabase/queries/campaigns"

type Params = { params: Promise<{ campaignId: string }> }

const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  draft: ["scheduled", "cancelled"],
  scheduled: ["paused", "cancelled"],
  sending: ["paused", "cancelled"],
  paused: ["scheduled", "cancelled"],
  completed: [],
  cancelled: [],
}

export async function GET(_req: Request, { params }: Params) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { campaignId } = await params
    const detail = await getCampaignDetail(campaignId)
    if (!detail) return NextResponse.json({ error: "Campaign not found" }, { status: 404 })

    return NextResponse.json(detail)
  } catch {
    return NextResponse.json({ error: "Failed to fetch campaign" }, { status: 500 })
  }
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { campaignId } = await params
    const { status: nextStatus } = await request.json()

    const { data: current, error: fetchError } = await supabase
      .from("campaigns")
      .select("status")
      .eq("id", campaignId)
      .single()
    if (fetchError || !current) return NextResponse.json({ error: "Campaign not found" }, { status: 404 })

    const allowed = ALLOWED_TRANSITIONS[current.status] ?? []
    if (!allowed.includes(nextStatus)) {
      return NextResponse.json(
        { error: `Cannot transition from "${current.status}" to "${nextStatus}"` },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from("campaigns")
      .update({ status: nextStatus })
      .eq("id", campaignId)
      .select()
      .single()
    if (error) throw error

    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: "Failed to update campaign" }, { status: 500 })
  }
}
