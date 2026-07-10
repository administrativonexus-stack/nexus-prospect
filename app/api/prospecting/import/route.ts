import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { importLead } from "@/lib/services/prospecting.service"
import type { ScrapedCompany } from "@/lib/prospecting/types"

export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  // Ensure a profiles row exists for this user.
  // Users created before the handle_new_user trigger was installed won't have
  // one, which causes a FK violation on leads.imported_by.
  await (supabase as any).from("profiles").upsert(
    {
      id: user.id,
      name: user.user_metadata?.name ?? user.email?.split("@")[0] ?? "Usuário",
      email: user.email!,
    },
    { onConflict: "id" }
  )

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const company = body as ScrapedCompany
  if (!company?.company_name || typeof company.company_name !== "string") {
    return NextResponse.json(
      { error: '"company_name" is required' },
      { status: 400 }
    )
  }

  // Always HTTP 200 — caller reads imported/duplicate/error fields.
  // Only auth and validation failures use non-200 codes.
  const result = await importLead(company, user.id)
  return NextResponse.json(result)
}
