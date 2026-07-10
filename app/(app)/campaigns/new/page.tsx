import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { listApprovedTemplates } from "@/lib/whatsapp-cloud/templates"
import { CampaignWizard } from "./campaign-wizard"

export default async function NewCampaignPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const [templatesResult, citiesResult, nichesResult, tagsResult] = await Promise.allSettled([
    listApprovedTemplates(),
    supabase.from("leads").select("city").not("city", "is", null),
    supabase.from("leads").select("niche").not("niche", "is", null),
    supabase.from("tags").select("*").order("name"),
  ])

  const templates = templatesResult.status === "fulfilled" ? templatesResult.value : []
  const templatesError = templatesResult.status === "rejected"
    ? (templatesResult.reason instanceof Error ? templatesResult.reason.message : "Falha ao carregar templates")
    : null

  const cities = citiesResult.status === "fulfilled"
    ? [...new Set((citiesResult.value.data ?? []).map((r) => r.city as string))].sort()
    : []
  const niches = nichesResult.status === "fulfilled"
    ? [...new Set((nichesResult.value.data ?? []).map((r) => r.niche as string))].sort()
    : []
  const tags = tagsResult.status === "fulfilled" ? (tagsResult.value.data ?? []) : []

  return (
    <CampaignWizard
      templates={templates}
      templatesError={templatesError}
      cities={cities}
      niches={niches}
      tags={tags}
    />
  )
}
