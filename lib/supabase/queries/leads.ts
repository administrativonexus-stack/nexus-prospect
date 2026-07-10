import { createClient } from "@/lib/supabase/server"
import type { LeadFilters, LeadInsert, LeadUpdate, Lead } from "@/types/lead"
import type { LeadStatus } from "@/types/database"

export async function getLeads(filters: LeadFilters = {}): Promise<Lead[]> {
  const supabase = await createClient()
  const { search, status, city, niche, page = 1, limit = 50 } = filters

  let query = supabase.from("leads").select("*").order("created_at", { ascending: false })

  if (status) query = query.eq("status", status)
  if (city) query = query.ilike("city", `%${city}%`)
  if (niche) query = query.ilike("niche", `%${niche}%`)
  if (search) query = query.ilike("company_name", `%${search}%`)

  const from = (page - 1) * limit
  query = query.range(from, from + limit - 1)

  const { data, error } = await query
  if (error) throw error
  return data as unknown as Lead[]
}

export async function getLeadById(id: string): Promise<Lead> {
  const supabase = await createClient()
  const { data, error } = await supabase.from("leads").select("*").eq("id", id).single()
  if (error) throw error
  return data as unknown as Lead
}

export async function createLead(lead: LeadInsert): Promise<Lead> {
  const supabase = await createClient()
  const { data, error } = await supabase.from("leads").insert(lead as never).select().single()
  if (error) throw error
  return data as unknown as Lead
}

export async function updateLead(id: string, updates: LeadUpdate): Promise<Lead> {
  const supabase = await createClient()
  const { data, error } = await supabase.from("leads").update(updates as never).eq("id", id).select().single()
  if (error) throw error
  return data as unknown as Lead
}

export async function updateLeadStatus(id: string, status: LeadStatus, performedBy?: string) {
  const supabase = await createClient()

  const { data: lead, error: leadError } = await supabase
    .from("leads")
    .update({ status } as never)
    .eq("id", id)
    .select("status, company_name")
    .single()
  if (leadError) throw leadError

  await supabase.from("lead_history").insert({
    lead_id: id,
    action: "status_changed",
    description: `Status atualizado para "${status}"`,
    metadata: { status },
    performed_by: performedBy ?? null,
  } as never)

  return lead
}

export async function deleteLead(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from("leads").delete().eq("id", id)
  if (error) throw error
}

export async function getLeadHistory(leadId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("lead_history")
    .select("*")
    .eq("lead_id", leadId)
    .order("created_at", { ascending: false })
  if (error) throw error
  return data as unknown as { id: string; action: string; description: string; created_at: string }[]
}
