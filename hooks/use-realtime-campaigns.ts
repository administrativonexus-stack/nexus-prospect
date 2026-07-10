"use client"

import { useEffect, useState } from "react"
import type { CampaignListItem } from "@/app/(app)/campaigns/page"

export function useRealtimeCampaigns(initial: CampaignListItem[]) {
  const [campaigns, setCampaigns] = useState<CampaignListItem[]>(initial)

  useEffect(() => {
    let cancelled = false

    const poll = async () => {
      try {
        const res = await fetch("/api/campaigns")
        if (!res.ok || cancelled) return
        const data = await res.json()
        if (!cancelled && Array.isArray(data)) setCampaigns(data)
      } catch {
        // ignore
      }
    }

    const id = setInterval(poll, 5000)
    return () => {
      cancelled = true
      clearInterval(id)
    }
  }, [])

  return campaigns
}
