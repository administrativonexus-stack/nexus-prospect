import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getQRCode } from "@/lib/evolution/client"

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const instance = searchParams.get("instance") ?? "nexus"

    const raw = await getQRCode(instance, user.id) as Record<string, unknown>

    let qrcode: string | null = null

    if (typeof raw.qrcode === "string") {
      qrcode = raw.qrcode
    } else if (raw.qrcode && typeof raw.qrcode === "object") {
      const inner = raw.qrcode as Record<string, unknown>
      if (typeof inner.base64 === "string") qrcode = inner.base64
    } else if (typeof raw.base64 === "string") {
      qrcode = raw.base64
    }

    if (!qrcode) {
      // Evolution returns { instance: { state: "open" } } when already connected
      const instanceData = raw.instance as Record<string, unknown> | undefined
      const state = instanceData?.state ?? instanceData?.connectionStatus ?? null
      if (state === "open" || state === "connected") {
        return NextResponse.json({ already_connected: true })
      }
      return NextResponse.json(
        {
          error: `QR code não encontrado. Estado da instância: ${state ?? "desconhecido"}. Verifique se o nome da instância está correto.`,
          raw,
        },
        { status: 502 }
      )
    }

    return NextResponse.json({ qrcode })
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to get QR code"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
