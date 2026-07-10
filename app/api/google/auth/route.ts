import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getAuthorizationUrl } from "@/lib/google/oauth"
import { cookies } from "next/headers"
import crypto from "crypto"

export async function GET(request: Request) {
  const forwardedHost = request.headers.get("x-forwarded-host")
  const forwardedProto = request.headers.get("x-forwarded-proto") ?? "https"
  const origin = forwardedHost ? `${forwardedProto}://${forwardedHost}` : new URL(request.url).origin

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.redirect(new URL("/login", origin))

  const state = crypto.randomBytes(16).toString("hex")
  const cookieStore = await cookies()
  cookieStore.set("google_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 600,
    path: "/",
  })

  return NextResponse.redirect(getAuthorizationUrl(state, origin))
}
