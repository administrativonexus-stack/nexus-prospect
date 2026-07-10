import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { data, error } = await supabase.from("tags").select("*").order("name")
    if (error) throw error
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: "Failed to fetch tags" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { name, color } = await request.json()
    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: '"name" is required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from("tags")
      .insert({ name: name.trim(), color: color ?? null })
      .select()
      .single()
    if (error) throw error
    return NextResponse.json(data)
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to create tag"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
