export interface ParsedMessage {
  phone: string
  text: string
  messageId: string
  timestamp: number
  isFromMe: boolean
  pushName?: string
}

export function parseEvolutionWebhook(body: unknown): ParsedMessage | null {
  try {
    const payload = body as Record<string, unknown>

    if (payload.event !== "messages.upsert") return null

    const data = payload.data as Record<string, unknown>
    if (!data) return null

    // Evolution API v2: key fields are at data level directly
    // { data: { key: { remoteJid, fromMe, id }, message: { conversation }, messageTimestamp } }
    // Older/alternate format: key fields nested under data.message
    // { data: { message: { key: { ... }, message: { ... }, messageTimestamp } } }
    let key: Record<string, unknown>
    let msgContent: Record<string, unknown> | undefined
    let timestamp: number

    if (data.key && typeof data.key === "object") {
      // v2 format
      key = data.key as Record<string, unknown>
      msgContent = data.message as Record<string, unknown> | undefined
      timestamp = (data.messageTimestamp as number) ?? Date.now() / 1000
    } else {
      // v1 nested format
      const nested = data.message as Record<string, unknown> | undefined
      if (!nested) return null
      key = nested.key as Record<string, unknown>
      msgContent = nested.message as Record<string, unknown> | undefined
      timestamp = (nested.messageTimestamp as number) ?? Date.now() / 1000
    }

    if (!key) return null

    const isFromMe = key.fromMe as boolean

    const extMsg = msgContent?.extendedTextMessage as Record<string, unknown> | undefined
    const text =
      (msgContent?.conversation as string) ||
      (extMsg?.text as string) ||
      (msgContent?.text as string)

    if (!text) return null

    const remoteJid = (key.remoteJid as string) ?? ""
    // Ignore group messages
    if (remoteJid.includes("@g.us")) return null

    return {
      phone: remoteJid.replace("@s.whatsapp.net", ""),
      text,
      messageId: (key.id as string) ?? "",
      timestamp,
      isFromMe,
      pushName: (data.pushName as string) || undefined,
    }
  } catch {
    return null
  }
}
