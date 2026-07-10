import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { resolveSegmentLeads, type SegmentFilters } from "@/lib/supabase/queries/campaigns"

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { data: campaigns, error } = await supabase
      .from("campaigns")
      .select("*")
      .order("created_at", { ascending: false })
    if (error) throw error

    const ids = (campaigns ?? []).map((c) => c.id)
    let countsByCampaign: Record<string, Record<string, number>> = {}

    if (ids.length > 0) {
      const { data: recipients, error: recError } = await supabase
        .from("campaign_recipients")
        .select("campaign_id, status")
        .in("campaign_id", ids)
      if (recError) throw recError

      countsByCampaign = (recipients ?? []).reduce((acc, r) => {
        acc[r.campaign_id] ??= {}
        acc[r.campaign_id][r.status] = (acc[r.campaign_id][r.status] ?? 0) + 1
        return acc
      }, {} as Record<string, Record<string, number>>)
    }

    const result = (campaigns ?? []).map((c) => ({
      ...c,
      status_counts: countsByCampaign[c.id] ?? {},
    }))

    return NextResponse.json(result)
  } catch {
    return NextResponse.json({ error: "Failed to fetch campaigns" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await request.json()
    const {
      name,
      templateName,
      templateLanguage,
      templateComponents,
      segmentFilters,
      scheduledAt,
    } = body as {
      name: string
      templateName: string
      templateLanguage?: string
      templateComponents?: unknown
      segmentFilters: SegmentFilters
      scheduledAt?: string | null
    }

    if (!name?.trim()) return NextResponse.json({ error: '"name" is required' }, { status: 400 })
    if (!templateName?.trim()) return NextResponse.json({ error: '"templateName" is required' }, { status: 400 })

    const leads = await resolveSegmentLeads(segmentFilters ?? {})
    if (leads.length === 0) {
      return NextResponse.json({ error: "Nenhum lead corresponde aos filtros de segmentação" }, { status: 400 })
    }

    const { data: campaign, error: createError } = await supabase
      .from("campaigns")
      .insert({
        name: name.trim(),
        status: "scheduled",
        template_name: templateName.trim(),
        template_language: templateLanguage ?? "pt_BR",
        template_components: templateComponents ?? null,
        segment_filters: segmentFilters ?? {},
        scheduled_at: scheduledAt ?? new Date().toISOString(),
        total_recipients: leads.length,
        created_by: user.id,
      })
      .select()
      .single()
    if (createError || !campaign) throw createError ?? new Error("Failed to create campaign")

    const recipientRows = leads.map((lead) => ({
      campaign_id: campaign.id,
      lead_id: lead.id,
      status: "pending" as const,
    }))

    const { error: recipientsError } = await supabase
      .from("campaign_recipients")
      .insert(recipientRows)
    if (recipientsError) throw recipientsError

    return NextResponse.json(campaign)
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to create campaign"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
