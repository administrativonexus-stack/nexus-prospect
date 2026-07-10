import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getAvailableMeetingSlots } from "@/lib/google/calendar"

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const slots = await getAvailableMeetingSlots(3, user.id)
    return NextResponse.json(slots)
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to fetch available slots"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
