import { getSetting } from "@/lib/settings"
import type { ScrapedCompany } from "./types"

// Apify actor IDs use ~ as separator in API URLs (not /)
const ACTOR_ID = "compass~crawler-google-places"

export async function searchGoogleMaps(
  niche: string,
  city: string,
  limit: number
): Promise<ScrapedCompany[]> {
  const apiToken =
    process.env.APIFY_API_TOKEN ?? (await getSetting("apify_api_token"))
  if (!apiToken) throw new Error("APIFY_API_TOKEN not configured")

  // waitForFinish=300 holds the HTTP connection open until the run reaches a
  // terminal state — no polling loop needed.
  const runRes = await fetch(
    `https://api.apify.com/v2/acts/${ACTOR_ID}/runs?token=${apiToken}&waitForFinish=300`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        searchStringsArray: [`${niche} em ${city}`],
        maxCrawledPlacesPerSearch: limit,
        language: "pt-BR",
        countryCode: "br",
      }),
    }
  )

  if (!runRes.ok) {
    const text = await runRes.text().catch(() => "")
    throw new Error(`Apify: falha ao iniciar run (${runRes.status}) ${text}`)
  }

  const { data: run } = await runRes.json() as {
    data: { id: string; status: string; defaultDatasetId: string }
  }

  if (run.status !== "SUCCEEDED") {
    throw new Error(`Apify run finalizou com status: ${run.status}`)
  }

  // Use actor-runs/{runId}/dataset/items — more reliable than the actor-slug path
  const datasetRes = await fetch(
    `https://api.apify.com/v2/actor-runs/${run.id}/dataset/items?token=${apiToken}&limit=${limit}`
  )
  if (!datasetRes.ok) {
    const text = await datasetRes.text().catch(() => "")
    throw new Error(`Apify: falha ao buscar dataset (${datasetRes.status}) ${text}`)
  }

  const items = await datasetRes.json() as Record<string, unknown>[]

  return items
    .filter((item) => typeof item.title === "string" && item.title.length > 0)
    .map((item) => ({
      company_name: item.title as string,
      // phoneUnformatted has raw digits from Google Maps; fall back to phone
      phone: ((item.phoneUnformatted ?? item.phone) as string | undefined) || null,
      website: (item.website as string | undefined) || null,
      address: (item.address as string | undefined) || null,
      rating: typeof item.totalScore === "number" ? item.totalScore : null,
      review_count: typeof item.reviewsCount === "number" ? item.reviewsCount : 0,
      niche,
      city,
    }))
}
