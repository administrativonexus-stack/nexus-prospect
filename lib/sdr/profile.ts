import { getSetting } from "@/lib/settings"
import type { SDRProfile } from "./config"

const COMBINING_DIACRITICS = new RegExp("[\\u0300-\\u036f]", "g")

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(COMBINING_DIACRITICS, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

export async function resolveSDRProfile(leadNiche: string | null, userId: string): Promise<SDRProfile> {
  if (!leadNiche) return "default"

  const rawKeywords = await getSetting("sdr_marketplace_niches", userId)
  if (!rawKeywords) return "default"

  const normalizedNiche = normalize(leadNiche)
  const keywords = rawKeywords
    .split(",")
    .map((k) => normalize(k))
    .filter(Boolean)

  const matched = keywords.some((keyword) => normalizedNiche.includes(keyword))
  return matched ? "marketplace" : "default"
}
