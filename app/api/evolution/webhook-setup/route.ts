import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { setWebhook } from "@/lib/evolution/client"
import { getSetting } from "@/lib/settings"

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const instanceName = (await getSetting("evolution_instance", user.id)) ?? "nexus"

    const forwardedHost = request.headers.get("x-forwarded-host")
    const forwardedProto = request.headers.get("x-forwarded-proto") ?? "https"
    const origin = forwardedHost
      ? `${forwardedProto}://${forwardedHost}`
      : new URL(request.url).origin
    const webhookUrl = `${origin}/api/webhooks/evolution`

    await setWebhook(instanceName, webhookUrl, user.id)

    return NextResponse.json({ ok: true, webhookUrl })
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to configure webhook"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
