import { getSetting } from "@/lib/settings"
import { importFromProspecting } from "@/lib/repositories/lead.repository"
import type { ScrapedCompany } from "@/lib/prospecting/types"
import type { SearchParams, ImportResult } from "@/types/prospecting"

/**
 * Searches Google Maps via the configured prospecting provider (apify or outscraper).
 * Provider is read from the settings table, defaulting to apify.
 */
export async function search(params: SearchParams): Promise<ScrapedCompany[]> {
  const { niche, city, limit } = params
  const provider = (await getSetting("prospecting_provider")) ?? "apify"

  if (provider === "outscraper") {
    const { searchGoogleMaps } = await import("@/lib/prospecting/outscraper")
    return searchGoogleMaps(niche, city, Math.min(limit, 100))
  }

  const { searchGoogleMaps } = await import("@/lib/prospecting/apify")
  return searchGoogleMaps(niche, city, Math.min(limit, 100))
}

/**
 * Imports a single scraped company as a lead, enforcing phone-based deduplication.
 */
export async function importLead(
  company: ScrapedCompany,
  userId: string
): Promise<ImportResult> {
  return importFromProspecting(company, userId)
}
