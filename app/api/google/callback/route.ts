import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { exchangeCodeForTokens } from "@/lib/google/oauth"
import { storeTokens } from "@/lib/google/token-store"
import { cookies } from "next/headers"

export async function GET(request: Request) {
  const forwardedHost = request.headers.get("x-forwarded-host")
  const forwardedProto = request.headers.get("x-forwarded-proto") ?? "https"
  const origin = forwardedHost ? `${forwardedProto}://${forwardedHost}` : new URL(request.url).origin

  const { searchParams } = new URL(request.url)
  const code = searchParams.get("code")
  const state = searchParams.get("state")

  const cookieStore = await cookies()
  const savedState = cookieStore.get("google_oauth_state")?.value

  if (!code || !state || state !== savedState) {
    return NextResponse.redirect(new URL("/settings/calendar?error=invalid_state", origin))
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.redirect(new URL("/login", origin))

  try {
    const tokens = await exchangeCodeForTokens(code, origin)
    await storeTokens(tokens.access_token, tokens.refresh_token, tokens.expires_in, user.id)
    cookieStore.delete("google_oauth_state")
    return NextResponse.redirect(new URL("/settings/calendar?connected=true", origin))
  } catch {
    return NextResponse.redirect(new URL("/settings/calendar?error=token_exchange_failed", origin))
  }
}
