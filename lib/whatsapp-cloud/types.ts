export interface CloudConfig {
  accessToken: string
  phoneNumberId: string
  businessAccountId: string | null
  apiVersion: string
}

export interface TemplateComponentParam {
  type: "text" | "currency" | "date_time" | "image" | "document"
  text?: string
}

export interface TemplateComponent {
  type: "header" | "body" | "footer" | "button"
  parameters?: TemplateComponentParam[]
}

export interface WhatsAppTemplate {
  name: string
  language: string
  status: string
  category: string
  components: Array<{ type: string; text?: string; format?: string }>
}

export interface SendTemplateMessageParams {
  to: string
  templateName: string
  languageCode: string
  components?: TemplateComponent[]
}

export interface SendMessageResult {
  whatsappMessageId: string
}

export interface ParsedStatusEvent {
  whatsappMessageId: string
  status: "sent" | "delivered" | "read" | "failed"
  timestamp: number
  errorMessage?: string
}

export interface ParsedInboundMessage {
  phone: string
  text: string
  messageId: string
  timestamp: number
  contactName?: string
}
