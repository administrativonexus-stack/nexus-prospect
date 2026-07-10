import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const type = searchParams.get("type")
  const status = searchParams.get("status")
  const category = searchParams.get("category")
  const from = searchParams.get("from")
  const to = searchParams.get("to")
  const search = searchParams.get("search")

  let query = supabase
    .from("financial_transactions")
    .select("*")
    .eq("user_id", user.id)
    .order("due_date", { ascending: false })

  if (type) query = query.eq("type", type)
  if (status) query = query.eq("status", status)
  if (category) query = query.eq("category", category)
  if (from) query = query.gte("due_date", from)
  if (to) query = query.lte("due_date", to)
  if (search) query = query.ilike("description", `%${search}%`)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await request.json()
  const { error, data } = await supabase
    .from("financial_transactions")
    .insert({ ...body, user_id: user.id })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
