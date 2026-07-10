import { createServiceClient } from "@/lib/supabase/server"

// Env vars act as global defaults — a per-user DB value overrides them when set.
// evolution_api_url and evolution_api_key are intentionally NOT in ENV_MAP:
// each user must configure their own Evolution instance in the app settings.
const ENV_MAP: Record<string, string | undefined> = {
  openai_api_key: process.env.OPENAI_API_KEY,
  prospecting_provider: "apify",
  whatsapp_cloud_access_token: process.env.WHATSAPP_CLOUD_ACCESS_TOKEN,
  whatsapp_cloud_phone_number_id: process.env.WHATSAPP_CLOUD_PHONE_NUMBER_ID,
  whatsapp_cloud_business_account_id: process.env.WHATSAPP_CLOUD_BUSINESS_ACCOUNT_ID,
  whatsapp_cloud_app_secret: process.env.WHATSAPP_CLOUD_APP_SECRET,
  whatsapp_cloud_verify_token: process.env.WHATSAPP_CLOUD_VERIFY_TOKEN,
  campaign_dispatch_secret: process.env.CAMPAIGN_DISPATCH_SECRET,
}

export async function getSetting(key: string, userId?: string): Promise<string | null> {
  // Per-user DB value takes priority over env var
  if (userId) {
    try {
      const supabase = await createServiceClient()
      const { data } = await supabase
        .from("settings")
        .select("value")
        .eq("key", key)
        .eq("user_id", userId)
        .single()
      const userValue = (data as { value: string | null } | null)?.value ?? null
      if (userValue !== null) return userValue
    } catch {
      // not found — fall through to env var
    }
  }

  // Global env var fallback
  if (ENV_MAP[key] !== undefined && ENV_MAP[key] !== "") return ENV_MAP[key] ?? null

  return null
}

export async function setSetting(key: string, value: string, userId: string): Promise<void> {
  const supabase = await createServiceClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from("settings")
    .upsert({ user_id: userId, key, value, updated_at: new Date().toISOString() }, { onConflict: "user_id,key" })
  if (error) throw error
}

export async function getSettings(keys: string[], userId?: string): Promise<Record<string, string>> {
  const results = await Promise.all(
    keys.map(async (key) => [key, await getSetting(key, userId)] as const)
  )
  return Object.fromEntries(
    results.filter(([, v]) => v !== null).map(([k, v]) => [k, v as string])
  )
}

// Used by the Evolution webhook to identify which user owns an incoming message
// based on their configured instance name. Service-role client bypasses RLS.
export async function getUserIdBySettingValue(key: string, value: string): Promise<string | null> {
  try {
    const supabase = await createServiceClient()
    const { data } = await supabase
      .from("settings")
      .select("user_id")
      .eq("key", key)
      .eq("value", value)
      .single()
    return (data as { user_id: string } | null)?.user_id ?? null
  } catch {
    return null
  }
}
