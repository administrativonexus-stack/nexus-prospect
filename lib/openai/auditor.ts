import { getOpenAIClient } from "./client"
import type { AuditResult } from "@/types/audit"

const AUDIT_SCHEMA = {
  type: "object",
  properties: {
    score: { type: "integer", minimum: 0, maximum: 100 },
    has_website: { type: "boolean" },
    is_responsive: { type: "boolean" },
    has_form: { type: "boolean" },
    has_cta: { type: "boolean" },
    has_chatbot: { type: "boolean" },
    has_lead_capture: { type: "boolean" },
    problems: { type: "array", items: { type: "string" } },
    opportunities: { type: "array", items: { type: "string" } },
    sales_arguments: { type: "array", items: { type: "string" } },
  },
  required: [
    "score", "has_website", "is_responsive", "has_form", "has_cta",
    "has_chatbot", "has_lead_capture", "problems", "opportunities", "sales_arguments",
  ],
  additionalProperties: false,
}

export async function runAudit(
  companyName: string,
  websiteUrl: string,
  userId = ""
): Promise<AuditResult> {
  // Check website reachability
  let siteReachable = false
  try {
    const controller = new AbortController()
    setTimeout(() => controller.abort(), 8000)
    const r = await fetch(websiteUrl, { method: "HEAD", signal: controller.signal })
    siteReachable = r.ok || r.status < 500
  } catch {}

  const openai = await getOpenAIClient(userId)

  const systemPrompt = `Você é um especialista em marketing digital e desenvolvimento web.
Analise o site de uma empresa e retorne uma avaliação estruturada em JSON.

Instruções:
- score: 0 a 100 indicando oportunidade de venda (alto score = muitas melhorias possíveis = boa oportunidade)
- has_website: se o site existe e está acessível
- is_responsive: se o site é responsivo (mobile-friendly)
- has_form: se possui formulário de contato
- has_cta: se possui botão/chamada para ação clara
- has_chatbot: se possui chatbot ou widget de chat
- has_lead_capture: se possui captura de leads (formulário, pop-up, newsletter)
- problems: lista de problemas encontrados (max 5 itens)
- opportunities: sugestões de automação e desenvolvimento (max 5 itens)
- sales_arguments: argumentos para abordar esta empresa comercialmente (max 5 itens)`

  const userPrompt = `Empresa: ${companyName}
URL: ${websiteUrl}
Site acessível: ${siteReachable ? "Sim" : "Não (pode estar fora do ar ou com restrição de acesso)"}

Analise e retorne o JSON de auditoria.`

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "audit_result",
        strict: true,
        schema: AUDIT_SCHEMA,
      },
    },
    temperature: 0.3,
  })

  const content = response.choices[0].message.content
  if (!content) throw new Error("Empty response from OpenAI")

  return JSON.parse(content) as AuditResult
}
