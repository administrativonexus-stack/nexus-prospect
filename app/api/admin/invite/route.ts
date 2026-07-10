import { NextResponse } from "next/server"
import { createClient, createServiceClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  try {
    // Only authenticated users can invite others
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { email } = await request.json()
    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json({ error: "E-mail inválido" }, { status: 400 })
    }

    const db = await createServiceClient()
    const forwardedHost = request.headers.get("x-forwarded-host")
    const origin = forwardedHost
      ? `https://${forwardedHost}`
      : (request.headers.get("origin") ?? new URL(request.url).origin)

    const { error } = await db.auth.admin.inviteUserByEmail(email, {
      redirectTo: `${origin}/callback?type=invite`,
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao enviar convite" },
      { status: 500 }
    )
  }
}
