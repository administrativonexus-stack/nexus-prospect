import { getSettings } from "@/lib/settings"
import { DEFAULT_SDR_CONFIG, DEFAULT_MARKETPLACE_SDR_CONFIG, type SDRConfig } from "@/lib/openai/sdr"

export const SDR_PROFILES = ["default", "marketplace"] as const
export type SDRProfile = (typeof SDR_PROFILES)[number]

const PROFILE_PREFIXES: Record<SDRProfile, string> = {
  default: "sdr_",
  marketplace: "sdr_marketplace_",
}

const PROFILE_KEY_SUFFIXES = [
  "agent_name",
  "config_mode",
  "company_name",
  "company_description",
  "services",
  "value_proposition",
  "additional_rules",
  "system_prompt",
  "temperature",
  "model",
  "max_tokens",
] as const

export const SDR_GLOBAL_SETTINGS_KEYS = [
  "sdr_agent_active",
  "sdr_auto_respond",
  "sdr_pause_minutes",
] as const

export const SDR_SETTINGS_KEYS = [
  ...PROFILE_KEY_SUFFIXES.map((suffix) => `sdr_${suffix}` as const),
  ...SDR_GLOBAL_SETTINGS_KEYS,
] as const

export function buildProfileSettingsKeys(profile: SDRProfile): string[] {
  const prefix = PROFILE_PREFIXES[profile]
  return PROFILE_KEY_SUFFIXES.map((suffix) => `${prefix}${suffix}`)
}

const DEFAULTS_BY_PROFILE: Record<SDRProfile, SDRConfig> = {
  default: DEFAULT_SDR_CONFIG,
  marketplace: DEFAULT_MARKETPLACE_SDR_CONFIG,
}

function stripProfilePrefix(settings: Record<string, string>, profile: SDRProfile): Record<string, string> {
  const prefix = PROFILE_PREFIXES[profile]
  const stripped: Record<string, string> = {}
  for (const [key, value] of Object.entries(settings)) {
    if (key.startsWith(prefix)) stripped[key.slice(prefix.length)] = value
  }
  return stripped
}

export function settingsToSDRConfig(
  settings: Record<string, string>,
  profile: SDRProfile = "default"
): SDRConfig {
  const fallback = DEFAULTS_BY_PROFILE[profile]
  return {
    agentName: settings.agent_name ?? fallback.agentName,
    configMode: (settings.config_mode as "guided" | "advanced") ?? fallback.configMode,
    companyName: settings.company_name ?? fallback.companyName,
    companyDescription: settings.company_description ?? fallback.companyDescription,
    services: settings.services ?? fallback.services,
    valueProp: settings.value_proposition ?? fallback.valueProp,
    additionalRules: settings.additional_rules ?? fallback.additionalRules,
    systemPromptOverride: settings.system_prompt ?? fallback.systemPromptOverride,
    temperature: settings.temperature ? parseFloat(settings.temperature) : fallback.temperature,
    model: settings.model ?? fallback.model,
    maxTokens: settings.max_tokens ? parseInt(settings.max_tokens) : fallback.maxTokens,
  }
}

export async function loadSDRConfig(profile: SDRProfile = "default", userId: string): Promise<SDRConfig> {
  const keys = buildProfileSettingsKeys(profile)
  const settings = await getSettings(keys, userId)
  return settingsToSDRConfig(stripProfilePrefix(settings, profile), profile)
}
