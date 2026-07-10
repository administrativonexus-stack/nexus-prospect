import { getSetting, setSetting } from "@/lib/settings"
import { refreshAccessToken } from "./oauth"

export async function getValidToken(userId: string): Promise<string> {
  const [accessToken, refreshToken, expiryStr] = await Promise.all([
    getSetting("google_access_token", userId),
    getSetting("google_refresh_token", userId),
    getSetting("google_token_expiry", userId),
  ])

  if (!refreshToken) {
    throw new Error("Google Calendar not connected. Connect it in Settings > Google Calendar.")
  }

  const expiry = expiryStr ? parseInt(expiryStr, 10) : 0
  const isExpired = Date.now() >= expiry - 60_000 // refresh 1 min early

  if (!accessToken || isExpired) {
    const tokens = await refreshAccessToken(refreshToken)
    const newExpiry = Date.now() + tokens.expires_in * 1000

    await Promise.all([
      setSetting("google_access_token", tokens.access_token, userId),
      setSetting("google_token_expiry", newExpiry.toString(), userId),
    ])

    return tokens.access_token
  }

  return accessToken
}

export async function storeTokens(
  accessToken: string,
  refreshToken: string,
  expiresIn: number,
  userId: string
) {
  const expiry = Date.now() + expiresIn * 1000
  await Promise.all([
    setSetting("google_access_token", accessToken, userId),
    setSetting("google_refresh_token", refreshToken, userId),
    setSetting("google_token_expiry", expiry.toString(), userId),
  ])
}
