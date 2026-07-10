import { createClient } from "@/lib/supabase/server"
import type { AuditInsert } from "@/types/audit"

export async function getAuditByLead(leadId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from("audits")
    .select("*")
    .eq("lead_id", leadId)
    .order("created_at", { ascending: false })
    .limit(1)
    .single()
  return data
}

export async function createAudit(audit: AuditInsert) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("audits")
    .insert(audit)
    .select()
    .single()
  if (error) throw error
  return data
}
