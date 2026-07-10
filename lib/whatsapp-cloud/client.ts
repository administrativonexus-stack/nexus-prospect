import { getSetting } from "@/lib/settings"
import type { CloudConfig, SendTemplateMessageParams, SendMessageResult } from "./types"

async function getCloudConfig(): Promise<CloudConfig> {
  const [accessToken, phoneNumberId, businessAccountId, apiVersion] = await Promise.all([
    getSetting("whatsapp_cloud_access_token"),
    getSetting("whatsapp_cloud_phone_number_id"),
    getSetting("whatsapp_cloud_business_account_id"),
    getSetting("whatsapp_cloud_api_version"),
  ])
  if (!accessToken || !phoneNumberId) {
    throw new Error("WhatsApp Cloud API not configured. Set it in Settings > WhatsApp Cloud.")
  }
  return {
    accessToken,
    phoneNumberId,
    businessAccountId,
    apiVersion: apiVersion ?? "v21.0",
  }
}

export async function sendTemplateMessage(
  params: SendTemplateMessageParams
): Promise<SendMessageResult> {
  const { accessToken, phoneNumberId, apiVersion } = await getCloudConfig()

  const res = await fetch(
    `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: params.to.replace(/\D/g, ""),
        type: "template",
        template: {
          name: params.templateName,
          language: { code: params.languageCode },
          ...(params.components ? { components: params.components } : {}),
        },
      }),
    }
  )

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`WhatsApp Cloud API error: ${err}`)
  }

  const data = await res.json()
  const whatsappMessageId = data?.messages?.[0]?.id
  if (!whatsappMessageId) {
    throw new Error("WhatsApp Cloud API did not return a message id")
  }
  return { whatsappMessageId }
}

export { getCloudConfig }
