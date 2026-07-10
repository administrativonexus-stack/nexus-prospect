import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getConnectionStatus } from "@/lib/evolution/client"

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const instance = searchParams.get("instance") ?? "nexus"

  try {
    const data = await getConnectionStatus(instance, user.id)
    const state: string =
      (data as Record<string, unknown> & { instance?: { state?: string } })?.instance?.state ??
      (data as { state?: string })?.state ??
      "unknown"
    return NextResponse.json({ state })
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to get status"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
