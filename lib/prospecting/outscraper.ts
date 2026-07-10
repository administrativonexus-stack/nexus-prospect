import type { ScrapedCompany } from "./types"

export async function searchGoogleMaps(
  niche: string,
  city: string,
  limit: number
): Promise<ScrapedCompany[]> {
  const apiKey = process.env.OUTSCRAPER_API_KEY
  if (!apiKey) throw new Error("OUTSCRAPER_API_KEY not configured")

  const query = encodeURIComponent(`${niche}, ${city}, Brazil`)
  const res = await fetch(
    `https://api.app.outscraper.com/maps/search-v3?query=${query}&limit=${limit}&language=pt&region=br`,
    { headers: { "X-API-KEY": apiKey } }
  )

  if (!res.ok) throw new Error("Outscraper API error")
  const { data } = await res.json()
  const items: Record<string, unknown>[] = data?.[0] ?? []

  return items.map((item) => ({
    company_name: item.name as string,
    phone: (item.phone as string) || null,
    website: (item.site as string) || null,
    address: (item.full_address as string) || null,
    rating: typeof item.rating === "number" ? item.rating : null,
    review_count: typeof item.reviews === "number" ? item.reviews : 0,
    niche,
    city,
  }))
}
