import { createHmac, timingSafeEqual } from "crypto"
import type { ParsedStatusEvent, ParsedInboundMessage } from "./types"

export function safeCompare(a: string, b: string): boolean {
  try {
    const bufA = Buffer.from(a)
    const bufB = Buffer.from(b)
    if (bufA.length !== bufB.length) return false
    return timingSafeEqual(bufA, bufB)
  } catch {
    return false
  }
}

// GET handshake — Meta calls this once when the webhook URL is registered in the App Dashboard
export function verifyHandshake(
  mode: string | null,
  token: string | null,
  challenge: string | null,
  expectedToken: string
): string | null {
  if (mode === "subscribe" && token && safeCompare(token, expectedToken)) {
    return challenge
  }
  return null
}

// POST signature — Meta signs every webhook delivery with HMAC-SHA256 of the raw body
export function verifySignature(rawBody: string, signatureHeader: string | null, appSecret: string): boolean {
  if (!signatureHeader) return false
  const expected = "sha256=" + createHmac("sha256", appSecret).update(rawBody).digest("hex")
  return safeCompare(signatureHeader, expected)
}

interface MetaStatus {
  id?: string
  status?: string
  timestamp?: string
  errors?: Array<{ message?: string }>
}

interface MetaMessage {
  id?: string
  from?: string
  timestamp?: string
  type?: string
  text?: { body?: string }
}

interface MetaContact {
  wa_id?: string
  profile?: { name?: string }
}

interface MetaChangeValue {
  statuses?: MetaStatus[]
  messages?: MetaMessage[]
  contacts?: MetaContact[]
}

function walkChangeValues(body: unknown): MetaChangeValue[] {
  try {
    const payload = body as Record<string, unknown>
    const entries = (payload.entry as Array<Record<string, unknown>>) ?? []
    const values: MetaChangeValue[] = []
    for (const entry of entries) {
      const changes = (entry.changes as Array<Record<string, unknown>>) ?? []
      for (const change of changes) {
        if (change.value) values.push(change.value as MetaChangeValue)
      }
    }
    return values
  } catch {
    return []
  }
}

// Meta batches multiple status updates per POST — returns an array, not a nullable single object
export function parseStatusEvents(body: unknown): ParsedStatusEvent[] {
  const events: ParsedStatusEvent[] = []
  for (const value of walkChangeValues(body)) {
    for (const s of value.statuses ?? []) {
      if (!s.id || !s.status) continue
      const status = s.status as ParsedStatusEvent["status"]
      if (!["sent", "delivered", "read", "failed"].includes(status)) continue
      events.push({
        whatsappMessageId: s.id,
        status,
        timestamp: s.timestamp ? parseInt(s.timestamp, 10) : Date.now() / 1000,
        errorMessage: s.errors?.[0]?.message,
      })
    }
  }
  return events
}

export function parseInboundMessages(body: unknown): ParsedInboundMessage[] {
  const messages: ParsedInboundMessage[] = []
  for (const value of walkChangeValues(body)) {
    for (let i = 0; i < (value.messages ?? []).length; i++) {
      const m = value.messages![i]
      if (!m.id || !m.from || m.type !== "text" || !m.text?.body) continue
      messages.push({
        phone: m.from,
        text: m.text.body,
        messageId: m.id,
        timestamp: m.timestamp ? parseInt(m.timestamp, 10) : Date.now() / 1000,
        contactName: value.contacts?.[i]?.profile?.name,
      })
    }
  }
  return messages
}
