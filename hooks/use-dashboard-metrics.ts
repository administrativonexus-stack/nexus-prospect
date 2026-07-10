"use client"

import { useEffect, useState, useCallback } from "react"
import type { DashboardMetrics } from "@/types/api"

export function useDashboardMetrics(initialData?: DashboardMetrics) {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(initialData ?? null)
  const [loading, setLoading] = useState(!initialData)

  const fetchMetrics = useCallback(async () => {
    try {
      const res = await fetch("/api/dashboard/metrics")
      if (res.ok) setMetrics(await res.json())
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!initialData) fetchMetrics()

    // Refresh every 30s
    const interval = setInterval(fetchMetrics, 30_000)
    return () => clearInterval(interval)
  }, [fetchMetrics, initialData])

  return { metrics, loading }
}
