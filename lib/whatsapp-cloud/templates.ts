import { getCloudConfig } from "./client"
import type { WhatsAppTemplate } from "./types"

export async function listApprovedTemplates(): Promise<WhatsAppTemplate[]> {
  const { accessToken, businessAccountId, apiVersion } = await getCloudConfig()
  if (!businessAccountId) {
    throw new Error("WhatsApp Business Account ID not configured. Set it in Settings > WhatsApp Cloud.")
  }

  const res = await fetch(
    `https://graph.facebook.com/${apiVersion}/${businessAccountId}/message_templates?fields=name,language,status,category,components&limit=200`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  )

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Failed to fetch WhatsApp templates: ${err}`)
  }

  const data = await res.json()
  const all = (data?.data ?? []) as WhatsAppTemplate[]
  return all.filter((t) => t.status === "APPROVED")
}
