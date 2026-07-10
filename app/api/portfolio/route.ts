import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const category = searchParams.get("category")
  const search = searchParams.get("search")
  const sort = searchParams.get("sort") ?? "newest"
  const favorites = searchParams.get("favorites") === "true"

  let query = supabase.from("portfolio_projects").select("*").eq("user_id", user.id)

  if (category) query = query.eq("category", category)
  if (favorites) query = query.eq("is_favorite", true)
  if (search) query = query.or(`name.ilike.%${search}%,client.ilike.%${search}%`)

  const sortMap: Record<string, { column: string; ascending: boolean }> = {
    newest: { column: "created_at", ascending: false },
    oldest: { column: "created_at", ascending: true },
    az: { column: "name", ascending: true },
    updated: { column: "updated_at", ascending: false },
  }
  const { column, ascending } = sortMap[sort] ?? sortMap.newest
  query = query.order(column, { ascending })

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await request.json()
  const { data, error } = await supabase
    .from("portfolio_projects")
    .insert({ ...body, user_id: user.id })
    .select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
