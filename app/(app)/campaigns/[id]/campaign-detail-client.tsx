"use client"

import { useState, useEffect, useCallback } from "react"
import { PageHeader } from "@/components/layout/page-header"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MetricCard } from "@/components/dashboard/metric-card"
import { ConversionFunnelChart } from "@/components/dashboard/conversion-funnel-chart"
import { Send, CheckCheck, Eye, MessageCircle, CalendarCheck, Pause, Play, X } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import type { CampaignDetail } from "@/lib/supabase/queries/campaigns"

const RECIPIENT_STATUS_LABELS: Record<string, { label: string; className: string }> = {
  pending:   { label: "Pendente",  className: "bg-muted text-muted-foreground" },
  sending:   { label: "Enviando",  className: "bg-amber-500/10 text-amber-400" },
  sent:      { label: "Enviado",   className: "bg-blue-500/10 text-blue-400" },
  delivered: { label: "Entregue",  className: "bg-blue-500/10 text-blue-400" },
  read:      { label: "Lido",      className: "bg-violet-500/10 text-violet-400" },
  replied:   { label: "Respondeu", className: "bg-emerald-500/10 text-emerald-400" },
  failed:    { label: "Falhou",    className: "bg-red-500/10 text-red-400" },
  skipped:   { label: "Ignorado",  className: "bg-muted text-muted-foreground" },
}

const CAMPAIGN_STATUS_LABELS: Record<string, { label: string; className: string }> = {
  draft:     { label: "Rascunho",  className: "bg-muted text-muted-foreground" },
  scheduled: { label: "Agendada",  className: "bg-blue-500/10 text-blue-400" },
  sending:   { label: "Enviando",  className: "bg-amber-500/10 text-amber-400" },
  completed: { label: "Concluída", className: "bg-emerald-500/10 text-emerald-400" },
  paused:    { label: "Pausada",   className: "bg-muted text-muted-foreground" },
  cancelled: { label: "Cancelada", className: "bg-red-500/10 text-red-400" },
}

interface Props {
  initialDetail: CampaignDetail
  campaignId: string
}

export function CampaignDetailClient({ initialDetail, campaignId }: Props) {
  const [detail, setDetail] = useState<CampaignDetail>(initialDetail)
  const [transitioning, setTransitioning] = useState(false)

  const poll = useCallback(async () => {
    try {
      const res = await fetch(`/api/campaigns/${campaignId}`)
      if (!res.ok) return
      const data = await res.json()
      setDetail(data)
    } catch {
      // ignore
    }
  }, [campaignId])

  useEffect(() => {
    const id = setInterval(poll, 5000)
    return () => clearInterval(id)
  }, [poll])

  async function handleTransition(status: string) {
    setTransitioning(true)
    try {
      const res = await fetch(`/api/campaigns/${campaignId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error ?? "Falha ao atualizar campanha")
      }
      await poll()
      toast.success("Campanha atualizada")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha ao atualizar campanha")
    } finally {
      setTransitioning(false)
    }
  }

  const { campaign, metrics, recipients } = detail
  const statusInfo = CAMPAIGN_STATUS_LABELS[campaign.status] ?? CAMPAIGN_STATUS_LABELS.draft

  return (
    <div className="space-y-6">
      <PageHeader
        title={campaign.name}
        description={`Template: ${campaign.template_name} · ${campaign.total_recipients} destinatários`}
        action={
          <div className="flex items-center gap-2">
            <Badge className={cn("text-xs border-0", statusInfo.className)}>{statusInfo.label}</Badge>
            {(campaign.status === "scheduled" || campaign.status === "sending") && (
              <Button size="sm" variant="outline" disabled={transitioning} onClick={() => handleTransition("paused")} className="gap-1.5">
                <Pause className="h-3.5 w-3.5" />
                Pausar
              </Button>
            )}
            {campaign.status === "paused" && (
              <Button size="sm" variant="outline" disabled={transitioning} onClick={() => handleTransition("scheduled")} className="gap-1.5">
                <Play className="h-3.5 w-3.5" />
                Retomar
              </Button>
            )}
            {["draft", "scheduled", "sending", "paused"].includes(campaign.status) && (
              <Button
                size="sm"
                variant="outline"
                disabled={transitioning}
                onClick={() => handleTransition("cancelled")}
                className="gap-1.5 border-red-500/40 text-red-400 hover:bg-red-500/10 hover:text-red-300"
              >
                <X className="h-3.5 w-3.5" />
                Cancelar
              </Button>
            )}
          </div>
        }
      />

      <div className="grid gap-3 grid-cols-2 lg:grid-cols-5">
        <MetricCard label="Enviadas" value={metrics.sent} icon={Send} accent="blue" live delay={0} />
        <MetricCard label="Entregues" value={metrics.delivered} icon={CheckCheck} accent="green" delay={60} />
        <MetricCard label="Lidas" value={metrics.read} icon={Eye} accent="violet" delay={120} />
        <MetricCard label="Respondidas" value={metrics.replied} icon={MessageCircle} accent="amber" delay={180} />
        <MetricCard label="Reuniões marcadas" value={metrics.meetings_booked} icon={CalendarCheck} accent="green" delay={240} />
      </div>

      <div className="rounded-lg border border-border/50 bg-card p-5">
        <p className="text-sm font-semibold mb-1">Funil da campanha</p>
        <p className="text-xs text-muted-foreground mb-1">Enviado → Entregue → Lido → Respondido → Reunião marcada</p>
        <ConversionFunnelChart
          stages={[
            { name: "Enviadas", value: metrics.sent },
            { name: "Entregues", value: metrics.delivered },
            { name: "Lidas", value: metrics.read },
            { name: "Respondidas", value: metrics.replied },
            { name: "Reuniões", value: metrics.meetings_booked },
          ]}
        />
      </div>

      <div className="rounded-lg border border-border/50 bg-card">
        <div className="px-4 py-3 border-b border-border/50">
          <p className="text-sm font-semibold">Destinatários</p>
        </div>
        {recipients.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">Nenhum destinatário.</p>
        ) : (
          <div className="divide-y divide-border/50 max-h-[480px] overflow-y-auto">
            {recipients.map((r) => {
              const rStatus = RECIPIENT_STATUS_LABELS[r.status] ?? RECIPIENT_STATUS_LABELS.pending
              const lastTimestamp = r.replied_at ?? r.read_at ?? r.delivered_at ?? r.sent_at
              return (
                <div key={r.id} className="flex items-center gap-4 px-4 py-2.5">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{r.leads?.company_name ?? "Lead desconhecido"}</p>
                    {r.leads?.phone && <p className="text-xs text-muted-foreground">{r.leads.phone}</p>}
                    {r.status === "failed" && r.error_message && (
                      <p className="text-xs text-red-400 mt-0.5 truncate">{r.error_message}</p>
                    )}
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <Badge className={cn("text-xs border-0", rStatus.className)}>{rStatus.label}</Badge>
                    {lastTimestamp && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(new Date(lastTimestamp), "dd/MM/yy · HH:mm", { locale: ptBR })}
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
