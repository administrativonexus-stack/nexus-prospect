"use client"

import { Skeleton } from "@/components/ui/skeleton"
import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { useCountUp } from "@/hooks/use-count-up"

// Semantic accent palette — each metric type gets a visual identity
const ACCENT = {
  violet: {
    border: "#7c3aed",
    iconColor: "#a78bfa",
    iconBg: "rgba(124,58,237,0.10)",
    glowBg: "rgba(124,58,237,0.06)",
    dot: "#8b5cf6",
  },
  green: {
    border: "#059669",
    iconColor: "#34d399",
    iconBg: "rgba(5,150,105,0.10)",
    glowBg: "rgba(5,150,105,0.06)",
    dot: "#10b981",
  },
  blue: {
    border: "#2563eb",
    iconColor: "#60a5fa",
    iconBg: "rgba(37,99,235,0.10)",
    glowBg: "rgba(37,99,235,0.06)",
    dot: "#3b82f6",
  },
  amber: {
    border: "#d97706",
    iconColor: "#fbbf24",
    iconBg: "rgba(217,119,6,0.10)",
    glowBg: "rgba(217,119,6,0.06)",
    dot: "#f59e0b",
  },
} as const

export interface MetricCardProps {
  label: string
  value: number | null
  loading?: boolean
  icon?: LucideIcon
  accent?: keyof typeof ACCENT
  /** hero = larger prominent card; stat = compact supporting card */
  size?: "hero" | "stat"
  /** Renders a pulsing live-data dot next to the label */
  live?: boolean
  /** CSS animation-delay in ms for staggered entrance */
  delay?: number
}

export function MetricCard({
  label,
  value,
  loading,
  icon: Icon,
  accent = "violet",
  size = "stat",
  live = false,
  delay = 0,
}: MetricCardProps) {
  const c = ACCENT[accent]
  const animatedValue = useCountUp(!loading && value !== null ? value : null)

  return (
    <div
      className={cn("relative rounded-lg border border-border/50 bg-card overflow-hidden anim-fade-up")}
      style={{
        animationDelay: `${delay}ms`,
        borderTop: `2px solid ${c.border}`,
      }}
    >
      {/* Colored top-area glow — gives each card a distinct atmospheric tint */}
      <div
        className="absolute top-0 left-0 right-0 h-20 pointer-events-none"
        style={{ background: `linear-gradient(180deg, ${c.glowBg} 0%, transparent 100%)` }}
        aria-hidden="true"
      />

      <div className={cn("relative", size === "hero" ? "p-5" : "p-4")}>
        {/* Label row */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-1.5 min-w-0">
            {live && (
              <span
                className="h-[7px] w-[7px] rounded-full flex-shrink-0 animate-pulse"
                style={{ backgroundColor: c.dot }}
                title="Dado em tempo real"
                aria-label="Dados ao vivo"
              />
            )}
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground truncate">
              {label}
            </p>
          </div>
          {Icon && (
            <div
              className={cn(
                "rounded-md flex items-center justify-center flex-shrink-0",
                size === "hero" ? "h-8 w-8" : "h-7 w-7"
              )}
              style={{ backgroundColor: c.iconBg }}
            >
              <Icon
                className={cn(size === "hero" ? "h-4 w-4" : "h-3.5 w-3.5")}
                style={{ color: c.iconColor }}
                aria-hidden="true"
              />
            </div>
          )}
        </div>

        {/* Value */}
        {loading || value === null ? (
          <Skeleton className={cn("w-20", size === "hero" ? "h-10" : "h-8")} />
        ) : (
          <p
            className={cn(
              "font-semibold tabular-nums leading-none tracking-tight text-foreground",
              size === "hero" ? "text-4xl" : "text-[2rem]"
            )}
          >
            {animatedValue.toLocaleString("pt-BR")}
          </p>
        )}
      </div>
    </div>
  )
}
