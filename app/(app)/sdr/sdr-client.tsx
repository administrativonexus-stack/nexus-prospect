"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import { SimulatorChat } from "./simulator-chat"
import { cn } from "@/lib/utils"
import {
  Bot,
  Save,
  Zap,
  Settings2,
  MessageSquare,
  Activity,
  Building2,
  Layers,
  Star,
  ShieldAlert,
  Thermometer,
  Clock,
  CheckCheck,
  ShoppingBag,
  Tag,
  Cpu,
} from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

interface LogEntry {
  id: string
  message: string
  created_at: string
  lead_id: string
  leads: { company_name: string } | null
}

interface SDRClientProps {
  initialSettings: Record<string, string>
  initialLogs: LogEntry[]
  availableNiches: string[]
}

type SDRProfile = "default" | "marketplace"

const PROFILE_PREFIXES: Record<SDRProfile, string> = {
  default: "sdr_",
  marketplace: "sdr_marketplace_",
}

const PROFILE_LABELS: Record<SDRProfile, string> = {
  default: "Nexus (padrão)",
  marketplace: "Marketplace Sellers",
}

interface ProfileState {
  agentName: string
  configMode: "guided" | "advanced"
  companyName: string
  companyDescription: string
  services: string
  valueProp: string
  additionalRules: string
  systemPrompt: string
  temperature: number
  model: string
  maxTokens: number
}

function buildProfileState(s: Record<string, string>, prefix: string): ProfileState {
  return {
    agentName: s[`${prefix}agent_name`] ?? "Sara",
    configMode: (s[`${prefix}config_mode`] as "guided" | "advanced") ?? "guided",
    companyName: s[`${prefix}company_name`] ?? "",
    companyDescription: s[`${prefix}company_description`] ?? "",
    services: s[`${prefix}services`] ?? "",
    valueProp: s[`${prefix}value_proposition`] ?? "",
    additionalRules: s[`${prefix}additional_rules`] ?? "",
    systemPrompt: s[`${prefix}system_prompt`] ?? "",
    temperature: parseFloat(s[`${prefix}temperature`] ?? "0.7"),
    model: s[`${prefix}model`] ?? "gpt-4o",
    maxTokens: parseInt(s[`${prefix}max_tokens`] ?? "500"),
  }
}

const PAUSE_OPTIONS = [
  { value: "0", label: "Não pausar" },
  { value: "15", label: "15 min" },
  { value: "30", label: "30 min" },
  { value: "60", label: "1 hora" },
  { value: "120", label: "2 horas" },
  { value: "never", label: "Nunca voltar" },
]

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "px-2.5 py-1 rounded-full text-xs font-medium border transition-colors",
        active
          ? "border-violet-500/60 bg-violet-500/10 text-violet-400"
          : "border-border/50 text-muted-foreground hover:border-border hover:text-foreground"
      )}
    >
      {children}
    </button>
  )
}

export function SDRClient({ initialSettings, initialLogs, availableNiches }: SDRClientProps) {
  const s = initialSettings

  const [activeProfile, setActiveProfile] = useState<SDRProfile>("default")
  const [profiles, setProfiles] = useState<Record<SDRProfile, ProfileState>>({
    default: buildProfileState(s, PROFILE_PREFIXES.default),
    marketplace: buildProfileState(s, PROFILE_PREFIXES.marketplace),
  })
  const [marketplaceNiches, setMarketplaceNiches] = useState(s.sdr_marketplace_niches ?? "")

  // Global toggles — shared by both profiles, since they describe the conversation/system
  // state ("is AI replying at all", "is a human currently handling this"), not the persona.
  const [agentActive, setAgentActive] = useState(s.sdr_agent_active !== "false")
  const [autoRespond, setAutoRespond] = useState(s.sdr_auto_respond === "true")
  const [pauseMinutes, setPauseMinutes] = useState(s.sdr_pause_minutes ?? "30")

  const [saving, setSaving] = useState(false)

  const profile = profiles[activeProfile]

  function updateProfile(patch: Partial<ProfileState>) {
    setProfiles((prev) => ({ ...prev, [activeProfile]: { ...prev[activeProfile], ...patch } }))
  }

  function toggleNicheKeyword(niche: string) {
    const current = marketplaceNiches
      .split(",")
      .map((n) => n.trim())
      .filter(Boolean)
    const exists = current.some((n) => n.toLowerCase() === niche.toLowerCase())
    const next = exists ? current.filter((n) => n.toLowerCase() !== niche.toLowerCase()) : [...current, niche]
    setMarketplaceNiches(next.join(", "))
  }

  async function handleSave() {
    setSaving(true)
    try {
      const prefix = PROFILE_PREFIXES[activeProfile]
      const pairs: [string, string][] = [
        [`${prefix}agent_name`, profile.agentName],
        [`${prefix}config_mode`, profile.configMode],
        [`${prefix}company_name`, profile.companyName],
        [`${prefix}company_description`, profile.companyDescription],
        [`${prefix}services`, profile.services],
        [`${prefix}value_proposition`, profile.valueProp],
        [`${prefix}additional_rules`, profile.additionalRules],
        [`${prefix}system_prompt`, profile.systemPrompt],
        [`${prefix}temperature`, profile.temperature.toString()],
        [`${prefix}model`, profile.model],
        [`${prefix}max_tokens`, profile.maxTokens.toString()],
        ["sdr_agent_active", agentActive ? "true" : "false"],
        ["sdr_auto_respond", autoRespond ? "true" : "false"],
        ["sdr_pause_minutes", pauseMinutes],
      ]

      if (activeProfile === "marketplace") {
        pairs.push(["sdr_marketplace_niches", marketplaceNiches])
      }

      const results = await Promise.all(
        pairs.map(([key, value]) =>
          fetch("/api/settings", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ key, value }),
          })
        )
      )

      if (results.some((r) => !r.ok)) throw new Error("Falha em uma ou mais configurações")
      toast.success(`Configurações de "${PROFILE_LABELS[activeProfile]}" salvas`)
    } catch {
      toast.error("Falha ao salvar configurações")
    } finally {
      setSaving(false)
    }
  }

  const tempLabel =
    profile.temperature <= 0.3
      ? "Muito preciso"
      : profile.temperature <= 0.5
        ? "Preciso"
        : profile.temperature <= 0.7
          ? "Balanceado"
          : profile.temperature <= 0.9
            ? "Criativo"
            : "Muito criativo"

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-sm shadow-violet-500/25">
            <Bot className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold tracking-tight">SDR de IA</h1>
              <Badge
                className={cn(
                  "text-[11px] border",
                  agentActive
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                    : "bg-muted text-muted-foreground border-border"
                )}
              >
                {agentActive ? "Ativo" : "Inativo"}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Configure os agentes que atendem leads automaticamente no WhatsApp
            </p>
          </div>
        </div>
        <Button onClick={handleSave} disabled={saving} className="gap-2">
          <Save className="h-4 w-4" />
          {saving ? "Salvando..." : `Salvar "${PROFILE_LABELS[activeProfile]}"`}
        </Button>
      </div>

      {/* Profile switcher — decides which persona's settings the tabs below show/edit */}
      <div className="flex items-center gap-2 rounded-lg border border-border/50 bg-muted/20 p-1.5 w-fit">
        <button
          onClick={() => setActiveProfile("default")}
          className={cn(
            "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
            activeProfile === "default"
              ? "bg-violet-500/15 text-violet-400"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Bot className="h-3.5 w-3.5" />
          Nexus (padrão)
        </button>
        <button
          onClick={() => setActiveProfile("marketplace")}
          className={cn(
            "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
            activeProfile === "marketplace"
              ? "bg-violet-500/15 text-violet-400"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <ShoppingBag className="h-3.5 w-3.5" />
          Marketplace Sellers
        </button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="agent">
        <TabsList className="mb-6">
          <TabsTrigger value="agent" className="gap-1.5">
            <Bot className="h-3.5 w-3.5" />
            Agente
          </TabsTrigger>
          <TabsTrigger value="instructions" className="gap-1.5">
            <Layers className="h-3.5 w-3.5" />
            Instruções
          </TabsTrigger>
          <TabsTrigger value="model" className="gap-1.5">
            <Thermometer className="h-3.5 w-3.5" />
            Modelo
          </TabsTrigger>
          <TabsTrigger value="simulator" className="gap-1.5">
            <MessageSquare className="h-3.5 w-3.5" />
            Simulador
          </TabsTrigger>
          <TabsTrigger value="logs" className="gap-1.5">
            <Activity className="h-3.5 w-3.5" />
            Logs
          </TabsTrigger>
        </TabsList>

        {/* ── TAB: AGENTE ────────────────────────────────── */}
        <TabsContent value="agent" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Perfil do agente — {PROFILE_LABELS[activeProfile]}</CardTitle>
              <CardDescription>Identidade deste agente</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="agent-name">Nome do agente</Label>
                <Input
                  id="agent-name"
                  value={profile.agentName}
                  onChange={(e) => updateProfile({ agentName: e.target.value })}
                  placeholder="Ex: Sara, Carlos, Ana..."
                  className="max-w-xs"
                />
                <p className="text-xs text-muted-foreground">
                  O agente vai se apresentar com este nome nas conversas
                </p>
              </div>

              <div className="flex items-center justify-between rounded-lg border border-border/50 p-4">
                <div className="space-y-0.5">
                  <p className="text-sm font-medium">Agente ativo</p>
                  <p className="text-xs text-muted-foreground">
                    Interruptor global — quando inativo, NENHUM dos dois perfis responde, mesmo com a
                    resposta automática ligada
                  </p>
                </div>
                <button
                  role="switch"
                  aria-checked={agentActive}
                  onClick={() => setAgentActive((v) => !v)}
                  className={cn(
                    "relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 border-transparent transition-colors cursor-pointer",
                    agentActive ? "bg-emerald-500" : "bg-muted"
                  )}
                >
                  <span
                    className={cn(
                      "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition-transform",
                      agentActive ? "translate-x-5" : "translate-x-0"
                    )}
                  />
                </button>
              </div>
            </CardContent>
          </Card>

          {activeProfile === "marketplace" && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Tag className="h-4 w-4 text-muted-foreground" />
                  Roteamento por nicho
                </CardTitle>
                <CardDescription>
                  Leads cujo campo &quot;nicho&quot; combinar com uma destas palavras-chave são atendidos
                  por este perfil. Os demais leads continuam com o perfil padrão.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <textarea
                  value={marketplaceNiches}
                  onChange={(e) => setMarketplaceNiches(e.target.value)}
                  placeholder="Ex: marketplace, ecommerce, shopee, shein, mercado livre, tiktok shop"
                  rows={2}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                />
                {availableNiches.length > 0 && (
                  <div className="space-y-1.5">
                    <p className="text-xs text-muted-foreground">Nichos já usados em leads existentes:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {availableNiches.map((n) => (
                        <Chip
                          key={n}
                          active={marketplaceNiches.toLowerCase().includes(n.toLowerCase())}
                          onClick={() => toggleNicheKeyword(n)}
                        >
                          {n}
                        </Chip>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ── TAB: INSTRUÇÕES ────────────────────────────── */}
        <TabsContent value="instructions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Modo de configuração</CardTitle>
              <CardDescription>
                Escolha entre configuração guiada por campos ou prompt completo
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3 max-w-md">
                <button
                  onClick={() => updateProfile({ configMode: "guided" })}
                  className={cn(
                    "flex flex-col items-center gap-2 rounded-lg border p-4 text-center transition-colors",
                    profile.configMode === "guided"
                      ? "border-violet-500/60 bg-violet-500/5"
                      : "border-border/50 hover:border-border"
                  )}
                >
                  <Zap
                    className={cn(
                      "h-5 w-5",
                      profile.configMode === "guided" ? "text-violet-400" : "text-muted-foreground"
                    )}
                  />
                  <div>
                    <p className="text-sm font-medium">Guiado</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Preencha campos estruturados
                    </p>
                  </div>
                </button>
                <button
                  onClick={() => updateProfile({ configMode: "advanced" })}
                  className={cn(
                    "flex flex-col items-center gap-2 rounded-lg border p-4 text-center transition-colors",
                    profile.configMode === "advanced"
                      ? "border-violet-500/60 bg-violet-500/5"
                      : "border-border/50 hover:border-border"
                  )}
                >
                  <Settings2
                    className={cn(
                      "h-5 w-5",
                      profile.configMode === "advanced" ? "text-violet-400" : "text-muted-foreground"
                    )}
                  />
                  <div>
                    <p className="text-sm font-medium">Avançado</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Escreva o prompt completo
                    </p>
                  </div>
                </button>
              </div>
            </CardContent>
          </Card>

          {profile.configMode === "guided" ? (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    Contexto da empresa
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="company-name">Nome da empresa</Label>
                    <Input
                      id="company-name"
                      value={profile.companyName}
                      onChange={(e) => updateProfile({ companyName: e.target.value })}
                      placeholder="Ex: Nexus Sistemas"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="company-desc">Descrição da empresa</Label>
                    <textarea
                      id="company-desc"
                      value={profile.companyDescription}
                      onChange={(e) => updateProfile({ companyDescription: e.target.value })}
                      placeholder="O que sua empresa faz? Quem são seus clientes?"
                      rows={3}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Star className="h-4 w-4 text-muted-foreground" />
                    Oferta e diferencial
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="services">Serviços oferecidos</Label>
                    <textarea
                      id="services"
                      value={profile.services}
                      onChange={(e) => updateProfile({ services: e.target.value })}
                      placeholder="Liste os principais serviços ou produtos..."
                      rows={3}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="value-prop">Proposta de valor</Label>
                    <textarea
                      id="value-prop"
                      value={profile.valueProp}
                      onChange={(e) => updateProfile({ valueProp: e.target.value })}
                      placeholder="O que diferencia sua empresa? Por que o lead deve falar com vocês?"
                      rows={3}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <ShieldAlert className="h-4 w-4 text-muted-foreground" />
                    Regras e restrições adicionais
                  </CardTitle>
                  <CardDescription>
                    O agente já tem regras padrão (não citar preço, não enviar proposta). Adicione
                    regras específicas deste perfil aqui.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <textarea
                    value={profile.additionalRules}
                    onChange={(e) => updateProfile({ additionalRules: e.target.value })}
                    placeholder="Ex: Não mencionar concorrentes. Perguntar se já vende, se já tem produto e se já investe em ads."
                    rows={4}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                  />
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Prompt do sistema</CardTitle>
                <CardDescription>
                  Escreva o prompt completo. Use{" "}
                  <code className="text-xs bg-muted px-1 py-0.5 rounded">{"{{EMPRESA}}"}</code> e{" "}
                  <code className="text-xs bg-muted px-1 py-0.5 rounded">{"{{CIDADE}}"}</code>{" "}
                  para inserir o nome e cidade do lead automaticamente.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <textarea
                  value={profile.systemPrompt}
                  onChange={(e) => updateProfile({ systemPrompt: e.target.value })}
                  placeholder={`Você é Sara, assistente de agendamento da Nexus.\n\nEstá conversando com {{EMPRESA}} de {{CIDADE}}.\n\n...`}
                  rows={16}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                />
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ── TAB: MODELO ────────────────────────────────── */}
        <TabsContent value="model" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Modelo de IA — {PROFILE_LABELS[activeProfile]}</CardTitle>
              <CardDescription>
                Escolha o equilíbrio entre custo e qualidade das respostas
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-3 max-w-lg">
                {[
                  {
                    value: "gpt-4o-mini",
                    label: "Básico",
                    desc: "gpt-4o-mini · Econômico, alto volume",
                    icon: Zap,
                  },
                  {
                    value: "gpt-4o",
                    label: "Avançado",
                    desc: "gpt-4o · Máxima qualidade",
                    icon: Cpu,
                  },
                ].map((m) => (
                  <button
                    key={m.value}
                    onClick={() => updateProfile({ model: m.value })}
                    className={cn(
                      "flex flex-col gap-1.5 rounded-lg border p-4 text-left transition-colors",
                      profile.model === m.value
                        ? "border-violet-500/60 bg-violet-500/5"
                        : "border-border/50 hover:border-border"
                    )}
                  >
                    <m.icon
                      className={cn(
                        "h-5 w-5",
                        profile.model === m.value ? "text-violet-400" : "text-muted-foreground"
                      )}
                    />
                    <p
                      className={cn(
                        "text-sm font-medium",
                        profile.model === m.value ? "text-violet-400" : "text-foreground"
                      )}
                    >
                      {m.label}
                    </p>
                    <p className="text-xs text-muted-foreground">{m.desc}</p>
                  </button>
                ))}
              </div>

              <div className="space-y-3 max-w-md">
                <div className="flex items-center justify-between">
                  <Label>Temperatura</Label>
                  <span className="text-xs text-muted-foreground">
                    {profile.temperature.toFixed(1)} · {tempLabel}
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.1}
                  value={profile.temperature}
                  onChange={(e) => updateProfile({ temperature: parseFloat(e.target.value) })}
                  className="w-full accent-violet-500"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Preciso</span>
                  <span>Criativo</span>
                </div>
              </div>

              <div className="space-y-2 max-w-xs">
                <Label htmlFor="max-tokens">Máximo de tokens por resposta</Label>
                <Input
                  id="max-tokens"
                  type="number"
                  min={100}
                  max={2000}
                  step={50}
                  value={profile.maxTokens}
                  onChange={(e) => updateProfile({ maxTokens: parseInt(e.target.value) || 500 })}
                />
                <p className="text-xs text-muted-foreground">
                  Controla o comprimento máximo das respostas (100–2000)
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Resposta automática</CardTitle>
              <CardDescription>
                Configuração global — vale para os dois perfis, já que controla o sistema de
                resposta automática como um todo, não a persona
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="flex items-center justify-between rounded-lg border border-border/50 p-4">
                <div className="space-y-0.5">
                  <p className="text-sm font-medium">Resposta automática no WhatsApp</p>
                  <p className="text-xs text-muted-foreground">
                    O agente deve estar ativo (aba Agente) para funcionar
                  </p>
                </div>
                <button
                  role="switch"
                  aria-checked={autoRespond}
                  onClick={() => setAutoRespond((v) => !v)}
                  className={cn(
                    "relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 border-transparent transition-colors cursor-pointer",
                    autoRespond ? "bg-emerald-500" : "bg-muted"
                  )}
                >
                  <span
                    className={cn(
                      "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition-transform",
                      autoRespond ? "translate-x-5" : "translate-x-0"
                    )}
                  />
                </button>
              </div>

              {autoRespond && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <Label>Pausa após intervenção humana</Label>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Quando um humano responde manualmente, o agente pausa por este período
                  </p>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {PAUSE_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => setPauseMinutes(opt.value)}
                        className={cn(
                          "px-3 py-1.5 rounded-full text-xs font-medium border transition-colors",
                          pauseMinutes === opt.value
                            ? "border-violet-500/60 bg-violet-500/10 text-violet-400"
                            : "border-border/50 text-muted-foreground hover:border-border hover:text-foreground"
                        )}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── TAB: SIMULADOR ─────────────────────────────── */}
        <TabsContent value="simulator">
          <div className="space-y-3">
            <div className="flex items-start gap-3 rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-3">
              <Zap className="h-4 w-4 text-amber-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-300/80">
                Simulando o perfil <strong className="text-amber-300">{PROFILE_LABELS[activeProfile]}</strong>{" "}
                com as configurações <strong className="text-amber-300">salvas atualmente</strong>. Salve as
                alterações antes de testar para ver o comportamento atualizado.
              </p>
            </div>
            <SimulatorChat profile={activeProfile} />
          </div>
        </TabsContent>

        {/* ── TAB: LOGS ──────────────────────────────────── */}
        <TabsContent value="logs">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Respostas recentes do agente</CardTitle>
              <CardDescription>Últimas 50 mensagens enviadas pelo SDR de IA (todos os perfis)</CardDescription>
            </CardHeader>
            <CardContent>
              {initialLogs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Activity className="h-8 w-8 text-muted-foreground/30 mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Nenhuma resposta de IA registrada ainda
                  </p>
                  <p className="text-xs text-muted-foreground/60 mt-1">
                    As respostas aparecem aqui quando o agente atender leads
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-border/50">
                  {initialLogs.map((log) => (
                    <div key={log.id} className="flex items-start gap-3 py-3">
                      <div className="h-8 w-8 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Bot className="h-4 w-4 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="text-sm font-medium text-foreground truncate">
                            {log.leads?.company_name ?? "Lead desconhecido"}
                          </p>
                          <CheckCheck className="h-3.5 w-3.5 text-[#53BDEB] flex-shrink-0" />
                          <span className="text-xs text-muted-foreground ml-auto flex-shrink-0">
                            {format(new Date(log.created_at), "dd/MM · HH:mm", { locale: ptBR })}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {log.message}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
