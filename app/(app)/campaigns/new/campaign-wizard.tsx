"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { PageHeader } from "@/components/layout/page-header"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { LEAD_STATUS_LABELS, LEAD_STATUS_ORDER, type LeadStatus } from "@/types/lead"
import type { Tag } from "@/types/tag"
import { FileText, Users, CalendarClock, CheckSquare, ChevronLeft, ChevronRight, Loader2 } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

interface WhatsAppTemplate {
  name: string
  language: string
  status: string
  category: string
}

interface Props {
  templates: WhatsAppTemplate[]
  templatesError: string | null
  cities: string[]
  niches: string[]
  tags: Tag[]
}

const STEPS = [
  { id: 1, label: "Template", icon: FileText },
  { id: 2, label: "Audiência", icon: Users },
  { id: 3, label: "Agendamento", icon: CalendarClock },
  { id: 4, label: "Revisão", icon: CheckSquare },
] as const

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full px-3 py-1.5 text-xs border transition-colors",
        active
          ? "border-violet-500/60 bg-violet-500/10 text-violet-300"
          : "border-border/50 text-muted-foreground hover:border-border hover:text-foreground"
      )}
    >
      {children}
    </button>
  )
}

function toggleItem<T>(list: T[], item: T): T[] {
  return list.includes(item) ? list.filter((i) => i !== item) : [...list, item]
}

export function CampaignWizard({ templates, templatesError, cities, niches, tags }: Props) {
  const router = useRouter()
  const [step, setStep] = useState(1)

  const [name, setName] = useState("")
  const [selectedTemplate, setSelectedTemplate] = useState<WhatsAppTemplate | null>(null)

  const [selectedCities, setSelectedCities] = useState<string[]>([])
  const [selectedNiches, setSelectedNiches] = useState<string[]>([])
  const [selectedStatuses, setSelectedStatuses] = useState<LeadStatus[]>([])
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([])
  const [previewCount, setPreviewCount] = useState<number | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)

  const [sendNow, setSendNow] = useState(true)
  const [scheduledAt, setScheduledAt] = useState("")

  const [submitting, setSubmitting] = useState(false)

  const segmentFilters = {
    cities: selectedCities,
    niches: selectedNiches,
    statuses: selectedStatuses,
    tagIds: selectedTagIds,
  }

  const fetchPreview = useCallback(async () => {
    setPreviewLoading(true)
    try {
      const res = await fetch("/api/campaigns/segment-preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(segmentFilters),
      })
      if (res.ok) {
        const data = await res.json()
        setPreviewCount(data.count)
      }
    } finally {
      setPreviewLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCities, selectedNiches, selectedStatuses, selectedTagIds])

  useEffect(() => {
    if (step !== 2) return
    const id = setTimeout(fetchPreview, 400)
    return () => clearTimeout(id)
  }, [step, fetchPreview])

  function canAdvance() {
    if (step === 1) return name.trim().length > 0 && selectedTemplate !== null
    if (step === 2) return (previewCount ?? 0) > 0
    if (step === 3) return sendNow || scheduledAt.length > 0
    return true
  }

  async function handleSubmit() {
    if (!selectedTemplate) return
    setSubmitting(true)
    try {
      const res = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          templateName: selectedTemplate.name,
          templateLanguage: selectedTemplate.language,
          segmentFilters,
          scheduledAt: sendNow ? null : new Date(scheduledAt).toISOString(),
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error ?? "Falha ao criar campanha")
      }
      const campaign = await res.json()
      toast.success("Campanha criada com sucesso")
      router.push(`/campaigns/${campaign.id}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha ao criar campanha")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <PageHeader title="Nova campanha" description="Disparo em massa via WhatsApp Cloud API" />

      {/* Step indicator */}
      <div className="flex items-center gap-2">
        {STEPS.map((s, i) => (
          <div key={s.id} className="flex items-center gap-2 flex-1">
            <div
              className={cn(
                "flex items-center gap-1.5 text-xs font-medium",
                step === s.id ? "text-violet-400" : step > s.id ? "text-muted-foreground" : "text-muted-foreground/40"
              )}
            >
              <div
                className={cn(
                  "h-6 w-6 rounded-full flex items-center justify-center border",
                  step === s.id
                    ? "border-violet-500 bg-violet-500/10"
                    : step > s.id
                      ? "border-emerald-500/40 bg-emerald-500/10"
                      : "border-border/50"
                )}
              >
                <s.icon className="h-3 w-3" />
              </div>
              <span className="hidden sm:inline">{s.label}</span>
            </div>
            {i < STEPS.length - 1 && <div className="flex-1 h-px bg-border/50" />}
          </div>
        ))}
      </div>

      {/* Step 1 — Template */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Nome e template</CardTitle>
            <CardDescription>Escolha um nome interno e um template aprovado pela Meta</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="campaign-name">Nome da campanha</Label>
              <Input
                id="campaign-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Promoção de Outubro"
              />
            </div>

            {templatesError ? (
              <p className="text-sm text-red-400">
                {templatesError} — configure as credenciais em Configurações → WhatsApp Cloud.
              </p>
            ) : templates.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhum template aprovado encontrado. Crie e aguarde aprovação no Meta Business Manager.
              </p>
            ) : (
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {templates.map((t) => (
                  <button
                    key={`${t.name}-${t.language}`}
                    type="button"
                    onClick={() => setSelectedTemplate(t)}
                    className={cn(
                      "w-full text-left rounded-lg border p-3 transition-colors",
                      selectedTemplate?.name === t.name && selectedTemplate?.language === t.language
                        ? "border-violet-500/60 bg-violet-500/5"
                        : "border-border/50 hover:border-border"
                    )}
                  >
                    <p className="text-sm font-medium">{t.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{t.language} · {t.category}</p>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 2 — Audience segmentation */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Segmentação de audiência</CardTitle>
            <CardDescription>Filtre os leads que vão receber esta campanha</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {cities.length > 0 && (
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Cidade</Label>
                <div className="flex flex-wrap gap-1.5">
                  {cities.map((c) => (
                    <Chip key={c} active={selectedCities.includes(c)} onClick={() => setSelectedCities((p) => toggleItem(p, c))}>
                      {c}
                    </Chip>
                  ))}
                </div>
              </div>
            )}

            {niches.length > 0 && (
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Nicho</Label>
                <div className="flex flex-wrap gap-1.5">
                  {niches.map((n) => (
                    <Chip key={n} active={selectedNiches.includes(n)} onClick={() => setSelectedNiches((p) => toggleItem(p, n))}>
                      {n}
                    </Chip>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Status no funil</Label>
              <div className="flex flex-wrap gap-1.5">
                {LEAD_STATUS_ORDER.map((s) => (
                  <Chip key={s} active={selectedStatuses.includes(s)} onClick={() => setSelectedStatuses((p) => toggleItem(p, s))}>
                    {LEAD_STATUS_LABELS[s]}
                  </Chip>
                ))}
              </div>
            </div>

            {tags.length > 0 && (
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Tags</Label>
                <div className="flex flex-wrap gap-1.5">
                  {tags.map((t) => (
                    <Chip key={t.id} active={selectedTagIds.includes(t.id)} onClick={() => setSelectedTagIds((p) => toggleItem(p, t.id))}>
                      {t.name}
                    </Chip>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center gap-2 rounded-lg border border-border/50 bg-muted/20 px-3 py-2.5">
              {previewLoading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
              ) : (
                <Badge variant="outline" className="text-xs">{previewCount ?? 0}</Badge>
              )}
              <p className="text-xs text-muted-foreground">
                lead{previewCount !== 1 ? "s" : ""} corresponde{previewCount !== 1 ? "m" : ""} aos filtros selecionados
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3 — Schedule */}
      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Agendamento</CardTitle>
            <CardDescription>Envie imediatamente ou agende para uma data específica</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setSendNow(true)}
                className={cn(
                  "rounded-lg border p-4 text-left transition-colors",
                  sendNow ? "border-violet-500/60 bg-violet-500/5" : "border-border/50 hover:border-border"
                )}
              >
                <p className="text-sm font-medium">Enviar agora</p>
                <p className="text-xs text-muted-foreground mt-0.5">Inicia no próximo ciclo de disparo</p>
              </button>
              <button
                type="button"
                onClick={() => setSendNow(false)}
                className={cn(
                  "rounded-lg border p-4 text-left transition-colors",
                  !sendNow ? "border-violet-500/60 bg-violet-500/5" : "border-border/50 hover:border-border"
                )}
              >
                <p className="text-sm font-medium">Agendar</p>
                <p className="text-xs text-muted-foreground mt-0.5">Escolha data e hora</p>
              </button>
            </div>

            {!sendNow && (
              <div className="space-y-2 max-w-xs">
                <Label htmlFor="scheduled-at">Data e hora</Label>
                <Input
                  id="scheduled-at"
                  type="datetime-local"
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                />
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 4 — Review */}
      {step === 4 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Revisão final</CardTitle>
            <CardDescription>Confirme os detalhes antes de criar a campanha</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between border-b border-border/50 pb-2">
              <span className="text-muted-foreground">Nome</span>
              <span className="font-medium">{name}</span>
            </div>
            <div className="flex justify-between border-b border-border/50 pb-2">
              <span className="text-muted-foreground">Template</span>
              <span className="font-medium">{selectedTemplate?.name}</span>
            </div>
            <div className="flex justify-between border-b border-border/50 pb-2">
              <span className="text-muted-foreground">Destinatários</span>
              <span className="font-medium">{previewCount ?? 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Envio</span>
              <span className="font-medium">
                {sendNow ? "Agora" : format(new Date(scheduledAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setStep((s) => Math.max(1, s - 1))}
          disabled={step === 1}
          className="gap-1.5"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          Voltar
        </Button>

        {step < 4 ? (
          <Button size="sm" onClick={() => setStep((s) => s + 1)} disabled={!canAdvance()} className="gap-1.5">
            Próximo
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        ) : (
          <Button size="sm" onClick={handleSubmit} disabled={submitting} className="gap-1.5">
            {submitting ? "Criando..." : "Criar campanha"}
          </Button>
        )}
      </div>
    </div>
  )
}
