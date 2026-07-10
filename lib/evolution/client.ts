import { getSetting } from "@/lib/settings"

async function getEvolutionConfig(userId: string) {
  const [baseUrl, apiKey] = await Promise.all([
    getSetting("evolution_api_url", userId),
    getSetting("evolution_api_key", userId),
  ])
  if (!baseUrl || !apiKey) {
    throw new Error("Evolution API not configured. Set it in Settings > WhatsApp.")
  }
  return { baseUrl: baseUrl.replace(/\/$/, ""), apiKey }
}

export async function sendTextMessage(phone: string, text: string, userId: string): Promise<void> {
  const { baseUrl, apiKey } = await getEvolutionConfig(userId)
  const instanceName = (await getSetting("evolution_instance", userId)) ?? "nexus"

  const res = await fetch(`${baseUrl}/message/sendText/${instanceName}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: apiKey,
    },
    body: JSON.stringify({
      number: phone.includes("@") ? phone : `${phone.replace(/\D/g, "")}@s.whatsapp.net`,
      text,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Evolution API error: ${err}`)
  }
}

export async function sendPresence(
  phone: string,
  presence: "composing" | "paused" | "available",
  userId: string,
  delayMs = 1200
): Promise<void> {
  const { baseUrl, apiKey } = await getEvolutionConfig(userId)
  const instanceName = (await getSetting("evolution_instance", userId)) ?? "nexus"

  const res = await fetch(`${baseUrl}/chat/sendPresence/${instanceName}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: apiKey,
    },
    body: JSON.stringify({
      number: phone.includes("@") ? phone : `${phone.replace(/\D/g, "")}@s.whatsapp.net`,
      delay: delayMs,
      presence,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Evolution API error: ${err}`)
  }
}

export async function getQRCode(instanceName: string, userId: string): Promise<{ qrcode: string; status: string }> {
  const { baseUrl, apiKey } = await getEvolutionConfig(userId)
  const res = await fetch(`${baseUrl}/instance/connect/${instanceName}`, {
    headers: { apikey: apiKey },
  })
  if (!res.ok) {
    const body = await res.text().catch(() => "")
    throw new Error(`Evolution API ${res.status}: ${body || "Failed to get QR code"}`)
  }
  return res.json()
}

export async function getConnectionStatus(instanceName: string, userId: string): Promise<{ state: string }> {
  const { baseUrl, apiKey } = await getEvolutionConfig(userId)
  const res = await fetch(`${baseUrl}/instance/connectionState/${instanceName}`, {
    headers: { apikey: apiKey },
  })
  if (!res.ok) throw new Error("Failed to get connection status")
  return res.json()
}

interface ChatItem {
  id: string
  remoteJid: string
  name?: string
}

interface ChatMessage {
  key: { id: string; remoteJid: string; fromMe: boolean }
  message?: {
    conversation?: string
    extendedTextMessage?: { text: string }
  }
  messageTimestamp: number
}

export async function getChats(instanceName: string, userId: string): Promise<(ChatItem & Record<string, unknown>)[]> {
  const { baseUrl, apiKey } = await getEvolutionConfig(userId)
  const res = await fetch(`${baseUrl}/chat/findChats/${instanceName}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: apiKey },
    body: JSON.stringify({}),
  })
  if (!res.ok) throw new Error(`Failed to fetch chats (${res.status}): ${await res.text()}`)
  const data = await res.json()
  const arr = Array.isArray(data) ? data : (data.chats ?? data.data ?? [])
  return arr.map((c: Record<string, unknown>) => ({
    ...c,
    remoteJid: (c.remoteJid ?? c.id ?? "") as string,
    name: c.name as string | undefined,
    id: c.id as string,
  }))
}

export async function setWebhook(
  instanceName: string,
  webhookUrl: string,
  userId: string
): Promise<void> {
  const { baseUrl, apiKey } = await getEvolutionConfig(userId)
  const res = await fetch(`${baseUrl}/webhook/set/${instanceName}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: apiKey },
    body: JSON.stringify({
      webhook: {
        enabled: true,
        url: webhookUrl,
        webhookByEvents: false,
        webhookBase64: false,
        events: ["MESSAGES_UPSERT"],
      },
    }),
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Failed to set webhook: ${err}`)
  }
}

export async function getProfilePicture(instanceName: string, phone: string, userId: string): Promise<string | null> {
  try {
    const { baseUrl, apiKey } = await getEvolutionConfig(userId)
    const cleanPhone = phone.replace("@s.whatsapp.net", "").replace(/\D/g, "")
    const number = `${cleanPhone}@s.whatsapp.net`

    const postRes = await fetch(`${baseUrl}/chat/fetchProfilePictureUrl/${instanceName}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: apiKey },
      body: JSON.stringify({ number }),
    })
    if (postRes.ok) {
      const data = await postRes.json()
      const url = data?.profilePictureUrl ?? data?.picture ?? data?.url ?? null
      if (url) return url
    }

    const getRes = await fetch(`${baseUrl}/chat/fetchProfilePictureUrl/${instanceName}?number=${cleanPhone}`, {
      headers: { apikey: apiKey },
    })
    if (!getRes.ok) return null
    const data = await getRes.json()
    return data?.profilePictureUrl ?? data?.picture ?? data?.url ?? null
  } catch {
    return null
  }
}

export async function getChatMessages(
  instanceName: string,
  remoteJid: string,
  userId: string,
  limit = 50
): Promise<ChatMessage[]> {
  const { baseUrl, apiKey } = await getEvolutionConfig(userId)
  const res = await fetch(`${baseUrl}/chat/findMessages/${instanceName}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: apiKey },
    body: JSON.stringify({ where: { key: { remoteJid } }, limit }),
  })
  if (!res.ok) return []
  const data = await res.json()
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.messages)) return data.messages
  if (Array.isArray(data?.data)) return data.data
  if (Array.isArray(data?.records)) return data.records
  if (Array.isArray(data?.messages?.records)) return data.messages.records
  return []
}
