import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { CampaignsClient } from "./campaigns-client"

export interface CampaignListItem {
  id: string
  name: string
  status: string
  template_name: string
  scheduled_at: string | null
  total_recipients: number
  created_at: string
}

export interface CampaignsOverview {
  active_campaigns: number
  sent_total: number
  delivered_total: number
  read_total: number
  replied_total: number
}

export default async function CampaignsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const [{ data: campaigns }, { data: overview }] = await Promise.all([
    supabase.from("campaigns").select("*").order("created_at", { ascending: false }),
    supabase.rpc("get_campaigns_overview_metrics"),
  ])

  return (
    <CampaignsClient
      initialCampaigns={(campaigns ?? []) as CampaignListItem[]}
      initialOverview={(overview as CampaignsOverview | null) ?? null}
    />
  )
}
