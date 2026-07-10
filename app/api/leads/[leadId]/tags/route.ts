import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

type Params = { params: Promise<{ leadId: string }> }

export async function GET(_req: Request, { params }: Params) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { leadId } = await params
    const { data, error } = await supabase
      .from("lead_tags")
      .select("tag_id, tags(id, name, color)")
      .eq("lead_id", leadId)
    if (error) throw error

    const tags = (data ?? []).map((r) => (Array.isArray(r.tags) ? r.tags[0] : r.tags)).filter(Boolean)
    return NextResponse.json(tags)
  } catch {
    return NextResponse.json({ error: "Failed to fetch lead tags" }, { status: 500 })
  }
}

export async function POST(request: Request, { params }: Params) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { leadId } = await params
    const { tag_id } = await request.json()
    if (!tag_id) return NextResponse.json({ error: '"tag_id" is required' }, { status: 400 })

    const { error } = await supabase.from("lead_tags").upsert({ lead_id: leadId, tag_id })
    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: "Failed to assign tag" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: Params) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { leadId } = await params
    const { searchParams } = new URL(request.url)
    const tagId = searchParams.get("tag_id")
    if (!tagId) return NextResponse.json({ error: '"tag_id" query param is required' }, { status: 400 })

    const { error } = await supabase
      .from("lead_tags")
      .delete()
      .eq("lead_id", leadId)
      .eq("tag_id", tagId)
    if (error) throw error
    return new NextResponse(null, { status: 204 })
  } catch {
    return NextResponse.json({ error: "Failed to remove tag" }, { status: 500 })
  }
}
