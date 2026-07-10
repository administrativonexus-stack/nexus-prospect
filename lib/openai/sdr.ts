import type OpenAI from "openai"
import { getOpenAIClient } from "./client"
import { SDR_TOOLS, executeSDRTool } from "./sdr-tools"
import type { SDRChatResponse } from "@/types/api"
import type { Conversation } from "@/types/conversation"

const MAX_TOOL_ITERATIONS = 4

export interface SDRConfig {
  agentName: string
  configMode: "guided" | "advanced"
  companyName: string
  companyDescription: string
  services: string
  valueProp: string
  additionalRules: string
  systemPromptOverride: string
  temperature: number
  model: string
  maxTokens: number
}

export const DEFAULT_SDR_CONFIG: SDRConfig = {
  agentName: "Sara",
  configMode: "guided",
  companyName: "Nexus",
  companyDescription:
    "Desenvolvemos sistemas personalizados (CRM, ERPs, plataformas, apps) para empresas de todos os tamanhos.",
  services: "Sistemas personalizados, CRM, ERPs, plataformas web, aplicativos móveis.",
  valueProp: "Processo: reunião de diagnóstico → proposta → desenvolvimento → entrega.",
  additionalRules:
    "Durante a conversa, descubra de forma natural (nunca como formulário): o nome da pessoa, o ramo de " +
    "atuação da empresa, se já tem site ou sistema (e qual), qual a maior dificuldade/dor da empresa hoje, " +
    "e quantos clientes a empresa atende atualmente. Se o lead não responder algum ponto mesmo depois de " +
    "perguntado, não insista e não bloqueie o agendamento.",
  systemPromptOverride: "",
  temperature: 0.7,
  model: "gpt-4o",
  maxTokens: 500,
}

// Seed for the "marketplace" persona — qualifies sellers on Shopee/Shein/Mercado Livre/TikTok Shop.
// Purely a content/seed value: zero special-casing anywhere else, the prompt builder and tool-calling
// loop below treat this exactly like any other SDRConfig.
export const DEFAULT_MARKETPLACE_SDR_CONFIG: SDRConfig = {
  agentName: "Sara",
  configMode: "guided",
  companyName: "Nexus",
  companyDescription:
    "Ajudamos vendedores a crescer em marketplaces (Shopee, Shein, Mercado Livre, TikTok Shop) com gestão de anúncios, " +
    "catálogo e tráfego pago dentro das próprias plataformas.",
  services: "Gestão de anúncios e ads em marketplace, otimização de catálogo, estratégia de tráfego pago dentro da plataforma.",
  valueProp: "Processo: reunião de diagnóstico → análise da operação atual → plano de ação → execução.",
  additionalRules:
    "ABERTURA — na PRIMEIRA mensagem da conversa, sempre, sem exceção, nesta ordem:\n" +
    "1. Se apresente em 1 frase curta (\"Oi! Sou a Sara, da Nexus.\").\n" +
    "2. Pergunte o nome da pessoa.\n" +
    "3. Pergunte \"Como posso te ajudar hoje?\" (ou variação natural) e espere a resposta antes de seguir pro " +
    "roteiro de qualificação — deixe o lead contextualizar o que precisa primeiro.\n" +
    "Não pule a apresentação, a pergunta do nome nem o \"como posso te ajudar\", mesmo que o lead já tenha " +
    "mandado uma mensagem dizendo o que quer — sempre passe pelos 3 passos antes do roteiro de qualificação " +
    "abaixo.\n\n" +
    "Seja DIRETO — esse lead já sabe o que é marketplace, NUNCA explique o que é, liste vantagens genéricas " +
    "(\"facilita a gestão\", \"o marketplace cuida dos pagamentos\") ou faça perguntas educativas/exploratórias " +
    "ou genéricas sobre o negócio (\"qual o segmento de vocês?\", \"você já pensou em quais produtos gostaria " +
    "de listar?\", \"já considerou estratégias de marketing?\"). Isso enrola a conversa e irrita o lead.\n\n" +
    "Depois da abertura, siga este roteiro, na ordem, perguntando só o necessário:\n" +
    "1. Se já vende em algum marketplace hoje (Shopee, Shein, Mercado Livre, TikTok Shop) ou está começando agora " +
    "— pergunta direta, uma frase.\n" +
    "2. Se já investe ou já investiu em ads dentro da plataforma — pergunta direta, uma frase.\n" +
    "3. Assim que tiver essas respostas, PARE de fazer perguntas de qualificação e diga objetivamente que a " +
    "Nexus pode ajudar (cite o que for relevante pro caso dele: ads, catálogo, performance) e proponha a reunião " +
    "imediatamente — não fique sondando mais detalhes antes de propor.\n\n" +
    "No máximo 3 perguntas de qualificação antes de propor a reunião. Se o lead já respondeu tudo isso em uma " +
    "única mensagem, vá direto pra proposta de reunião sem repetir perguntas.",
  systemPromptOverride: "",
  temperature: 0.7,
  model: "gpt-4o",
  maxTokens: 500,
}

// Appended regardless of config mode — the tools are always registered in the
// OpenAI call, so the model always needs to know when/how to use them, even
// when the user writes their own custom prompt in advanced mode.
const TOOL_INSTRUCTIONS = [
  "",
  "ESTILO:",
  "Nunca use emojis nas mensagens.",
  "",
  "AGENDAMENTO — REGRAS OBRIGATÓRIAS:",
  "Você tem acesso a duas ferramentas (tools) para agendar reuniões reais no Google Calendar:",
  "- getAvailableMeetingSlots: retorna os próximos horários livres. Use para sugerir opções ao lead.",
  "- createMeetingEvent: cria a reunião de fato (gera link do Google Meet e envia convite).",
  "",
  "PROIBIDO:",
  "- PROIBIDO dizer \"vou agendar\", \"reunião confirmada\", \"aqui está o link\" ou qualquer frase que implique " +
    "que uma reunião foi criada SEM ter chamado a ferramenta createMeetingEvent NESTA MESMA mensagem.",
  "- PROIBIDO inventar, reutilizar ou repetir um link do Google Meet de uma mensagem anterior. Cada reunião " +
    "tem um link novo, gerado apenas pela ferramenta.",
  "- PROIBIDO inventar horários disponíveis sem ter chamado getAvailableMeetingSlots antes.",
  "",
  "FLUXO CORRETO:",
  "1. Quando o lead quiser agendar, chame getAvailableMeetingSlots e apresente as opções.",
  "2. Quando o lead escolher um horário, pergunte o e-mail dele (se ainda não tiver).",
  "3. Assim que tiver horário confirmado E e-mail, chame createMeetingEvent imediatamente — não apenas diga " +
    "que vai agendar, EXECUTE a ferramenta nesse mesmo turno.",
  "4. Só confirme a reunião e mencione o link depois que a ferramenta retornar o resultado com sucesso.",
  "5. Se a ferramenta retornar erro de horário indisponível, chame getAvailableMeetingSlots de novo e " +
    "ofereça outras opções — nunca insista no mesmo horário nem diga que já agendou.",
  "",
  "QUALIFICAÇÃO:",
  "Colete o nome da pessoa e as informações de qualificação relevantes definidas nas suas instruções acima, " +
    "de forma natural durante a conversa (nunca como formulário). Se o lead não responder algum ponto mesmo " +
    'depois de perguntado, NÃO insista e NÃO bloqueie o agendamento — prossiga normalmente.',
  "Ao chamar createMeetingEvent, preencha contactName e qualificationSummary (bullet points) com exatamente " +
    "o que você perguntou e aprendeu nesta conversa — nunca invente dados nem copie de outra conversa. " +
    "qualificationSummary é interno (vai para o CRM) e NUNCA aparece pro lead — pode incluir qualquer " +
    "informação sensível de qualificação com segurança.",
].join("\n")

export function buildSDRSystemPrompt(
  config: SDRConfig,
  leadCompanyName: string,
  leadCity: string
): string {
  if (config.configMode === "advanced" && config.systemPromptOverride.trim()) {
    return (
      config.systemPromptOverride
        .replace(/\{\{EMPRESA\}\}/g, leadCompanyName)
        .replace(/\{\{CIDADE\}\}/g, leadCity) + TOOL_INSTRUCTIONS
    )
  }

  const lines: string[] = []

  lines.push(
    `Você é ${config.agentName}, assistente de agendamento comercial${config.companyName ? ` da ${config.companyName}` : ""}.`
  )
  lines.push(`Seu nome é ${config.agentName}.`)
  lines.push("")

  if (config.companyDescription.trim()) {
    lines.push("SOBRE A EMPRESA:")
    lines.push(config.companyDescription)
    lines.push("")
  }

  if (config.services.trim()) {
    lines.push("SERVIÇOS OFERECIDOS:")
    lines.push(config.services)
    lines.push("")
  }

  if (config.valueProp.trim()) {
    lines.push("PROPOSTA DE VALOR:")
    lines.push(config.valueProp)
    lines.push("")
  }

  lines.push("SUAS RESPONSABILIDADES:")
  lines.push("- Responder dúvidas básicas sobre a empresa")
  lines.push("- Qualificar o lead (entender se tem interesse e necessidade)")
  lines.push("- Entender a necessidade do lead")
  lines.push("- Propor e confirmar uma reunião de apresentação")
  lines.push("")
  lines.push("REGRAS ABSOLUTAS (nunca viole):")
  lines.push("- NUNCA discuta preços, valores ou orçamentos")
  lines.push("- NUNCA envie propostas comerciais")
  lines.push("- NUNCA negocie condições")
  lines.push(
    '- Se perguntado sobre preço, responda: "Os valores serão apresentados durante a reunião. Posso agendar para você?"'
  )
  lines.push("")
  lines.push("ESTILO DE COMUNICAÇÃO:")
  lines.push("- Tom profissional mas descontraído")
  lines.push("- Mensagens curtas (máx. 3 parágrafos)")
  lines.push("- Use o nome da empresa do lead quando souber")
  lines.push("- Em português do Brasil")
  lines.push("")

  if (config.additionalRules.trim()) {
    lines.push("INSTRUÇÕES ADICIONAIS:")
    lines.push(config.additionalRules)
    lines.push("")
  }

  lines.push(TOOL_INSTRUCTIONS)

  return lines.join("\n")
}

export async function runSDRTurn(
  config: SDRConfig,
  history: Conversation[],
  userMessage: string,
  leadCompanyName: string,
  leadCity: string,
  userId: string
): Promise<SDRChatResponse> {
  const openai = await getOpenAIClient(userId)

  const systemPrompt = buildSDRSystemPrompt(config, leadCompanyName, leadCity)

  const nowStr = new Date().toLocaleString("pt-BR", {
    dateStyle: "full",
    timeStyle: "short",
    timeZone: "America/Sao_Paulo",
  })
  const contextMessage =
    `[Contexto: Você está conversando com a empresa "${leadCompanyName}" de ${leadCity}. ` +
    `Data e hora atual: ${nowStr} (America/Sao_Paulo). Use esta data como referência ao calcular ` +
    `"hoje", "amanhã", "segunda-feira", etc. — nunca assuma outro ano.]`

  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    { role: "system", content: systemPrompt },
    { role: "system", content: contextMessage },
    ...history.map((msg) => ({
      role: (msg.sender === "lead" ? "user" : "assistant") as "user" | "assistant",
      content: msg.message,
    })),
    { role: "user", content: userMessage },
  ]

  let meeting: SDRChatResponse["meeting"]

  // Autonomous tool-calling loop — the model decides when to check availability
  // and when to actually book the meeting; we just execute whatever it asks for.
  for (let i = 0; i < MAX_TOOL_ITERATIONS; i++) {
    const response = await openai.chat.completions.create({
      model: config.model,
      messages,
      temperature: config.temperature,
      max_tokens: config.maxTokens,
      tools: SDR_TOOLS,
      tool_choice: "auto",
    })

    const message = response.choices[0].message
    messages.push(message)

    console.log(`[sdr tools] iteration ${i}: tool_calls=${message.tool_calls?.length ?? 0} content="${message.content ?? ""}"`)

    if (!message.tool_calls || message.tool_calls.length === 0) {
      return { reply: message.content ?? "", meeting }
    }

    for (const toolCall of message.tool_calls) {
      if (toolCall.type !== "function") continue

      let args: Record<string, unknown> = {}
      try {
        args = JSON.parse(toolCall.function.arguments)
      } catch {
        // Leave args empty — executeSDRTool handles missing/invalid params
      }

      console.log(`[sdr tools] calling ${toolCall.function.name} with args=${JSON.stringify(args)}`)

      const { output, meeting: toolMeeting } = await executeSDRTool(toolCall.function.name, args, {
        leadCompanyName,
        userId,
      })
      console.log(`[sdr tools] ${toolCall.function.name} output=${JSON.stringify(output)}`)
      if (toolMeeting) meeting = toolMeeting

      messages.push({
        role: "tool",
        tool_call_id: toolCall.id,
        content: JSON.stringify(output),
      })
    }
  }

  return {
    reply: "Desculpe, tive um problema ao processar sua solicitação. Pode tentar de novo?",
    meeting,
  }
}
