"use client"

import { useState } from "react"
import { ArrowDown } from "lucide-react"
import { useCountUp } from "@/hooks/use-count-up"
import { cn } from "@/lib/utils"

export interface FunnelStage {
  name: string
  value: number
}

interface ConversionFunnelChartProps {
  stages: FunnelStage[]
}

const FUNNEL_COLORS = ["#6366f1", "#8b5cf6", "#a855f7", "#c084fc", "#e879f9"]

function StageValue({ value, animate }: { value: number; animate: boolean }) {
  const animated = useCountUp(animate ? value : null)
  return <>{(animate ? animated : value).toLocaleString("pt-BR")}</>
}

export function ConversionFunnelChart({ stages }: ConversionFunnelChartProps) {
  const [animate] = useState(() =>
    typeof window === "undefined" ? true : !window.matchMedia("(prefers-reduced-motion: reduce)").matches
  )

  const max = stages[0]?.value || 1

  return (
    <div className="space-y-0.5">
      {stages.map((stage, i) => {
        const pct = max > 0 ? (stage.value / max) * 100 : 0
        const prevValue = i > 0 ? stages[i - 1].value : null
        const convPct = prevValue && prevValue > 0 ? (stage.value / prevValue) * 100 : null
        const color = FUNNEL_COLORS[i % FUNNEL_COLORS.length]

        return (
          <div key={stage.name}>
            {i > 0 && (
              <div className="flex items-center gap-1.5 pl-[calc(5.75rem+0.75rem)] py-1 text-[11px] text-muted-foreground">
                <ArrowDown className="h-3 w-3 flex-shrink-0" style={{ color }} aria-hidden="true" />
                {convPct !== null && (
                  <span className="font-medium tabular-nums" style={{ color }}>
                    {convPct.toFixed(0)}%
                  </span>
                )}
                <span>de conversão</span>
              </div>
            )}
            <div
              className={cn("flex items-center gap-3", animate && "anim-fade-up")}
              style={animate ? { animationDelay: `${i * 90}ms` } : undefined}
            >
              <span className="w-[5.75rem] flex-shrink-0 truncate text-xs text-muted-foreground">
                {stage.name}
              </span>
              <div className="relative h-8 flex-1 overflow-hidden rounded-md bg-muted/20">
                <div
                  className="flex h-full items-center justify-end rounded-md px-2.5 transition-[width] duration-500 ease-out"
                  style={{
                    width: `${Math.max(pct, 8)}%`,
                    background: `linear-gradient(90deg, ${color}b3, ${color})`,
                    boxShadow: `0 0 12px 0 ${color}40`,
                  }}
                >
                  <span className="text-xs font-semibold tabular-nums text-white">
                    <StageValue value={stage.value} animate={animate} />
                  </span>
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
