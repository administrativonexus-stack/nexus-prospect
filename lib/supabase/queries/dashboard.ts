import { createClient } from "@/lib/supabase/server"
import type { DashboardMetrics } from "@/types/api"

export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc("get_dashboard_metrics")
  if (error) throw error
  return data as DashboardMetrics
}
