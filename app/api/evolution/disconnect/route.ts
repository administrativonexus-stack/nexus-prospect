import { NextResponse } from "next/server"
import { createClient, createServiceClient } from "@/lib/supabase/server"
import { getSetting } from "@/lib/settings"

export async function POST() {
  const authClient = await createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const [baseUrl, apiKey, instanceName] = await Promise.all([
    getSetting("evolution_api_url", user.id),
    getSetting("evolution_api_key", user.id),
    getSetting("evolution_instance", user.id),
  ])

  const instance = instanceName ?? "nexus"

  if (baseUrl && apiKey) {
    try {
      await fetch(`${baseUrl.replace(/\/$/, "")}/instance/logout/${instance}`, {
        method: "DELETE",
        headers: { apikey: apiKey },
      })
    } catch {
      // best-effort — continue to clear DB even if Evolution API fails
    }
  }

  // Only clear conversations owned by this user's leads
  const supabase = await createServiceClient()
  const { data: userLeads } = await supabase
    .from("leads")
    .select("id")
    .eq("imported_by", user.id)

  if (userLeads && userLeads.length > 0) {
    const leadIds = userLeads.map((l) => l.id)
    await (supabase as any)
      .from("conversations")
      .delete()
      .in("lead_id", leadIds)
  }

  return NextResponse.json({ ok: true })
}
