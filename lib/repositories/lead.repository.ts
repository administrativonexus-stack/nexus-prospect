import { createClient } from "@/lib/supabase/server"
import { createLead } from "@/lib/supabase/queries/leads"
import { normalizePhone, normalizeUrl } from "@/lib/prospecting/normalizer"
import type { ScrapedCompany } from "@/lib/prospecting/types"
import type { Lead } from "@/types/lead"
import type { ImportResult } from "@/types/prospecting"

/**
 * Returns an existing lead matching the given normalized phone number, or null.
 * Uses maybeSingle() so an empty result is null rather than a thrown error.
 */
export async function findLeadByPhone(phone: string): Promise<Lead | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("leads")
    .select("*")
    .eq("phone", phone)
    .maybeSingle()
  if (error) throw error
  return data as Lead | null
}

/**
 * Imports a scraped company as a lead.
 *
 * Flow:
 *  1. Normalize phone and URL
 *  2. Pre-flight duplicate check by phone (fast path — avoids wasted INSERT)
 *  3. Insert via createLead
 *  4. On pg error 23505 (unique_violation), handle the race-condition case
 *     where another request inserted the same phone between check and insert
 */
export async function importFromProspecting(
  company: ScrapedCompany,
  userId: string
): Promise<ImportResult> {
  const normalizedPhone = normalizePhone(company.phone)
  const normalizedUrl = normalizeUrl(company.website)

  // Pre-flight dupe check
  if (normalizedPhone) {
    const existing = await findLeadByPhone(normalizedPhone)
    if (existing) {
      return { imported: false, duplicate: true, lead: existing }
    }
  }

  try {
    const lead = await createLead({
      company_name: company.company_name,
      phone: normalizedPhone,
      website: normalizedUrl,
      address: company.address,
      city: company.city,
      niche: company.niche,
      rating: company.rating,
      review_count: company.review_count ?? 0,
      imported_by: userId,
      status: "lead_found",
    })
    return { imported: true, duplicate: false, lead }
  } catch (err) {
    // PostgREST surfaces Postgres error codes directly on the thrown object
    const pgErr = err as { code?: string; message?: string }
    if (pgErr?.code === "23505") {
      // Race condition: another concurrent request beat us to the INSERT.
      // Fetch the winner so the caller can reference the existing record.
      const existing = normalizedPhone
        ? await findLeadByPhone(normalizedPhone).catch(() => null)
        : null
      return {
        imported: false,
        duplicate: true,
        lead: existing ?? undefined,
      }
    }
    return {
      imported: false,
      duplicate: false,
      error: pgErr?.message ?? "Unexpected error during import",
    }
  }
}
