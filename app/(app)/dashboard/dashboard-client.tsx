"use client"

import Link from "next/link"
import {
  UserPlus,
  Users,
  MessageSquare,
  MessageCircle,
  CalendarCheck,
  Trophy,
  Megaphone,
} from "lucide-react"
import { MetricCard } from "@/components/dashboard/metric-card"
import { ConversionFunnelChart } from "@/components/dashboard/conversion-funnel-chart"
import { useDashboardMetrics } from "@/hooks/use-dashboard-metrics"
import type { DashboardMetrics } from "@/types/api"

interface DashboardClientProps {
  initialMetrics: DashboardMetrics | null
  activeCampaigns: number | null
}

export function DashboardClient({ initialMetrics, activeCampaigns }: DashboardClientProps) {
  const { metrics, loading } = useDashboardMetrics(initialMetrics ?? undefined)

  const conversionRate =
    metrics?.funnel?.leads && metrics.funnel.sales
      ? ((metrics.funnel.sales / metrics.funnel.leads) * 100).toFixed(1)
      : null

  return (
    <div className="space-y-3">
      {/* Tier 1 — live today metrics, large and prominent */}
      <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
        <MetricCard
          label="Leads hoje"
          value={metrics?.leads_today ?? null}
          loading={loading}
          icon={UserPlus}
          accent="green"
          size="hero"
          live
          delay={0}
        />
        <MetricCard
          label="Mensagens enviadas"
          value={metrics?.messages_sent ?? null}
          loading={loading}
          icon={MessageSquare}
          accent="blue"
          size="hero"
          live
          delay={60}
        />
      </div>

      {/* Tier 2 — pipeline metrics, supporting context */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-5">
        <MetricCard
          label="Leads no mês"
          value={metrics?.leads_month ?? null}
          loading={loading}
          icon={Users}
          accent="violet"
          delay={140}
        />
        <MetricCard
          label="Respostas"
          value={metrics?.replies_received ?? null}
          loading={loading}
          icon={MessageCircle}
          accent="green"
          delay={190}
        />
        <MetricCard
          label="Reuniões"
          value={metrics?.meetings_scheduled ?? null}
          loading={loading}
          icon={CalendarCheck}
          accent="amber"
          delay={240}
        />
        <MetricCard
          label="Negócios fechados"
          value={metrics?.deals_closed ?? null}
          loading={loading}
          icon={Trophy}
          accent="amber"
          delay={290}
        />
        <Link href="/campaigns" className="block">
          <MetricCard
            label="Campanhas ativas"
            value={activeCampaigns}
            loading={loading && activeCampaigns === null}
            icon={Megaphone}
            accent="violet"
            delay={320}
          />
        </Link>
      </div>

      {/* Tier 3 — conversion funnel */}
      {metrics?.funnel && (
        <div
          className="rounded-lg border border-border/50 bg-card p-5 anim-fade-up"
          style={{ animationDelay: "360ms" }}
        >
          <div className="flex items-start justify-between mb-1">
            <div>
              <p className="text-sm font-semibold">Funil de Conversão</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Leads → Mensagens → Respostas → Reuniões → Vendas
              </p>
            </div>
            {conversionRate && (
              <div className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-md px-2.5 py-1 flex-shrink-0">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-semibold text-emerald-400 tabular-nums">
                  {conversionRate}% conversão
                </span>
              </div>
            )}
          </div>
          <ConversionFunnelChart
            stages={[
              { name: "Leads", value: metrics.funnel.leads },
              { name: "Mensagens", value: metrics.funnel.messages },
              { name: "Respostas", value: metrics.funnel.replies },
              { name: "Reuniões", value: metrics.funnel.meetings },
              { name: "Vendas", value: metrics.funnel.sales },
            ]}
          />
        </div>
      )}
    </div>
  )
}
