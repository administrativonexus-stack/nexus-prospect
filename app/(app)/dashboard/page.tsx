import { PageHeader } from "@/components/layout/page-header"
import { getDashboardMetrics } from "@/lib/supabase/queries/dashboard"
import { createClient } from "@/lib/supabase/server"
import { DashboardClient } from "./dashboard-client"

export default async function DashboardPage() {
  let metrics = null
  try {
    metrics = await getDashboardMetrics()
  } catch {
    // No Supabase credentials yet — render with null
  }

  let activeCampaigns: number | null = null
  try {
    const supabase = await createClient()
    const { data } = await supabase.rpc("get_campaigns_overview_metrics")
    activeCampaigns = data?.active_campaigns ?? null
  } catch {
    // Campaigns module not migrated yet
  }

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Visão geral da prospecção comercial"
      />
      <DashboardClient initialMetrics={metrics} activeCampaigns={activeCampaigns} />
    </div>
  )
}
