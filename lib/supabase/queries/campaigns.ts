import { createClient } from "@/lib/supabase/server"
import type { LeadStatus } from "@/types/database"

export interface SegmentFilters {
  cities?: string[]
  niches?: string[]
  statuses?: LeadStatus[]
  tagIds?: string[]
}

export interface SegmentLead {
  id: string
  company_name: string
  phone: string | null
}

export async function resolveSegmentLeads(filters: SegmentFilters): Promise<SegmentLead[]> {
  const supabase = await createClient()

  let allowedLeadIds: string[] | null = null
  if (filters.tagIds && filters.tagIds.length > 0) {
    const { data: tagRows, error: tagError } = await supabase
      .from("lead_tags")
      .select("lead_id")
      .in("tag_id", filters.tagIds)
    if (tagError) throw tagError
    allowedLeadIds = [...new Set((tagRows ?? []).map((r) => r.lead_id))]
    if (allowedLeadIds.length === 0) return []
  }

  let query = supabase
    .from("leads")
    .select("id, company_name, phone")
    .not("phone", "is", null)

  if (filters.cities && filters.cities.length > 0) query = query.in("city", filters.cities)
  if (filters.niches && filters.niches.length > 0) query = query.in("niche", filters.niches)
  if (filters.statuses && filters.statuses.length > 0) query = query.in("status", filters.statuses)
  if (allowedLeadIds) query = query.in("id", allowedLeadIds)

  const { data, error } = await query
  if (error) throw error
  return (data ?? []) as SegmentLead[]
}

export interface CampaignDetail {
  campaign: {
    id: string
    name: string
    status: string
    template_name: string
    template_language: string
    segment_filters: unknown
    scheduled_at: string | null
    started_at: string | null
    completed_at: string | null
    total_recipients: number
    created_at: string
  }
  metrics: {
    sent: number
    delivered: number
    read: number
    replied: number
    failed: number
    meetings_booked: number
  }
  recipients: Array<{
    id: string
    status: string
    error_message: string | null
    sent_at: string | null
    delivered_at: string | null
    read_at: string | null
    replied_at: string | null
    leads: { company_name: string; phone: string | null } | null
  }>
}

export async function getCampaignDetail(campaignId: string): Promise<CampaignDetail | null> {
  const supabase = await createClient()

  const { data: campaign, error: campaignError } = await supabase
    .from("campaigns")
    .select("*")
    .eq("id", campaignId)
    .single()
  if (campaignError || !campaign) return null

  const { data: metrics, error: metricsError } = await supabase.rpc("get_campaign_metrics", {
    p_campaign_id: campaignId,
  })
  if (metricsError) throw metricsError

  const { data: rawRecipients, error: recipientsError } = await supabase
    .from("campaign_recipients")
    .select("id, status, error_message, sent_at, delivered_at, read_at, replied_at, leads(company_name, phone)")
    .eq("campaign_id", campaignId)
    .order("created_at", { ascending: false })
  if (recipientsError) throw recipientsError

  const recipients = (rawRecipients ?? []).map((r) => ({
    ...r,
    leads: Array.isArray(r.leads) ? (r.leads[0] ?? null) : r.leads,
  }))

  return {
    campaign,
    metrics: metrics as CampaignDetail["metrics"],
    recipients,
  }
}
