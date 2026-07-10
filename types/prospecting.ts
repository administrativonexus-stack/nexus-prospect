import type { Lead } from "@/types/lead"

export interface SearchParams {
  niche: string
  city: string
  limit: number
}

export type ImportStatus = "idle" | "importing" | "imported" | "duplicate" | "error"

export interface ImportResult {
  imported: boolean
  duplicate: boolean
  lead?: Lead
  error?: string
}
