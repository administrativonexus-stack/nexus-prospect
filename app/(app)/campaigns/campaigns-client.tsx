"use client"

import Link from "next/link"
import { PageHeader } from "@/components/layout/page-header"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MetricCard } from "@/components/dashboard/metric-card"
import { useRealtimeCampaigns } from "@/hooks/use-realtime-campaigns"
import { Plus, Send, CheckCheck, Eye, MessageCircle, Megaphone } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { cn } from "@/lib/utils"
import type { CampaignListItem, CampaignsOverview } from "./page"

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  draft:     { label: "Rascunho",   className: "bg-muted text-muted-foreground" },
  scheduled: { label: "Agendada",   className: "bg-blue-500/10 text-blue-400" },
  sending:   { label: "Enviando",   className: "bg-amber-500/10 text-amber-400" },
  completed: { label: "Concluída",  className: "bg-emerald-500/10 text-emerald-400" },
  paused:    { label: "Pausada",    className: "bg-muted text-muted-foreground" },
  cancelled: { label: "Cancelada",  className: "bg-red-500/10 text-red-400" },
}

interface Props {
  initialCampaigns: CampaignListItem[]
  initialOverview: CampaignsOverview | null
}

export function CampaignsClient({ initialCampaigns, initialOverview }: Props) {
  const campaigns = useRealtimeCampaigns(initialCampaigns)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Campanhas"
        description="Disparos em massa via WhatsApp Cloud API (oficial)"
        action={
          <Link href="/campaigns/new">
            <Button size="sm" className="gap-1.5">
              <Plus className="h-4 w-4" />
              Nova campanha
            </Button>
          </Link>
        }
      />

      <div className="grid gap-3 grid-cols-2 lg:grid-cols-5">
        <MetricCard
          label="Ativas"
          value={initialOverview?.active_campaigns ?? null}
          icon={Megaphone}
          accent="violet"
          live
          delay={0}
        />
        <MetricCard
          label="Enviadas"
          value={initialOverview?.sent_total ?? null}
          icon={Send}
          accent="blue"
          delay={60}
        />
        <MetricCard
          label="Entregues"
          value={initialOverview?.delivered_total ?? null}
          icon={CheckCheck}
          accent="green"
          delay={120}
        />
        <MetricCard
          label="Lidas"
          value={initialOverview?.read_total ?? null}
          icon={Eye}
          accent="amber"
          delay={180}
        />
        <MetricCard
          label="Respondidas"
          value={initialOverview?.replied_total ?? null}
          icon={MessageCircle}
          accent="green"
          delay={240}
        />
      </div>

      <div className="rounded-lg border border-border/50 bg-card">
        {campaigns.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Megaphone className="h-8 w-8 text-muted-foreground/30 mb-2" />
            <p className="text-sm text-muted-foreground">Nenhuma campanha criada ainda.</p>
            <Link href="/campaigns/new" className="mt-3">
              <Button size="sm" variant="outline" className="gap-1.5">
                <Plus className="h-3.5 w-3.5" />
                Criar primeira campanha
              </Button>
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-border/50">
            {campaigns.map((c) => {
              const statusInfo = STATUS_LABELS[c.status] ?? STATUS_LABELS.draft
              return (
                <Link
                  key={c.id}
                  href={`/campaigns/${c.id}`}
                  className="flex items-center gap-4 px-4 py-3.5 hover:bg-accent/40 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{c.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Template: {c.template_name} · {c.total_recipients} destinatário{c.total_recipients !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <Badge className={cn("text-xs border-0", statusInfo.className)}>
                      {statusInfo.label}
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-1">
                      {c.scheduled_at
                        ? format(new Date(c.scheduled_at), "dd/MM/yy · HH:mm", { locale: ptBR })
                        : format(new Date(c.created_at), "dd/MM/yy", { locale: ptBR })}
                    </p>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
