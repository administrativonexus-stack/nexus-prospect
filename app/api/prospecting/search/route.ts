import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { search } from "@/lib/services/prospecting.service"

// Match the Apify waitForFinish=300 timeout
export const maxDuration = 300

export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const { niche, city, limit } = body as Record<string, unknown>

  if (!niche || typeof niche !== "string" || niche.trim().length === 0) {
    return NextResponse.json(
      { error: '"niche" is required and must be a non-empty string' },
      { status: 400 }
    )
  }
  if (!city || typeof city !== "string" || city.trim().length === 0) {
    return NextResponse.json(
      { error: '"city" is required and must be a non-empty string' },
      { status: 400 }
    )
  }
  if (limit === undefined || limit === null) {
    return NextResponse.json({ error: '"limit" is required' }, { status: 400 })
  }
  const numLimit = Number(limit)
  if (!Number.isInteger(numLimit) || numLimit < 1 || numLimit > 100) {
    return NextResponse.json(
      { error: '"limit" must be an integer between 1 and 100' },
      { status: 400 }
    )
  }

  try {
    const results = await search({
      niche: niche.trim(),
      city: city.trim(),
      limit: numLimit,
    })
    return NextResponse.json(results)
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Search failed"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
