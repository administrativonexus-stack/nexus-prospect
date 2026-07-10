import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getDashboardMetrics } from "@/lib/supabase/queries/dashboard"

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const metrics = await getDashboardMetrics()
    return NextResponse.json(metrics)
  } catch {
    return NextResponse.json({ error: "Failed to fetch metrics" }, { status: 500 })
  }
}
