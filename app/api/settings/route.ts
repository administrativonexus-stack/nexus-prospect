import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getSetting, setSetting } from "@/lib/settings"

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const key = searchParams.get("key")
    if (!key) return NextResponse.json({ error: "key required" }, { status: 400 })

    const value = await getSetting(key, user.id)
    return NextResponse.json({ key, value })
  } catch {
    return NextResponse.json({ error: "Failed to get setting" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { key, value } = await request.json()
    if (!key) return NextResponse.json({ error: "key required" }, { status: 400 })

    await setSetting(key, value, user.id)
    return NextResponse.json({ ok: true })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error("[settings POST] error:", msg, err)
    return NextResponse.json({ error: msg || "Failed to save setting" }, { status: 500 })
  }
}
