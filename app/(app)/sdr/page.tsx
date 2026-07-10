import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getSettings } from "@/lib/settings"
import { SDR_PROFILES, SDR_GLOBAL_SETTINGS_KEYS, buildProfileSettingsKeys } from "@/lib/sdr/config"
import { SDRClient } from "./sdr-client"

export default async function SDRPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const allKeys = [
    ...SDR_PROFILES.flatMap((profile) => buildProfileSettingsKeys(profile)),
    ...SDR_GLOBAL_SETTINGS_KEYS,
    "sdr_marketplace_niches",
  ]

  const [settings, rawLogsRes, nichesRes] = await Promise.all([
    getSettings(allKeys, user.id),
    supabase
      .from("conversations")
      .select("id, message, created_at, lead_id, leads(company_name)")
      .eq("sender", "ai")
      .order("created_at", { ascending: false })
      .limit(50),
    supabase.from("leads").select("niche").not("niche", "is", null),
  ])

  // Normalize the leads relation — Supabase may return array or single object
  const logs = (rawLogsRes.data ?? []).map((l) => ({
    id: l.id,
    message: l.message,
    created_at: l.created_at,
    lead_id: l.lead_id,
    leads: Array.isArray(l.leads) ? (l.leads[0] ?? null) : l.leads,
  }))

  const availableNiches = [...new Set((nichesRes.data ?? []).map((r) => r.niche as string))].sort()

  return <SDRClient initialSettings={settings} initialLogs={logs} availableNiches={availableNiches} />
}
