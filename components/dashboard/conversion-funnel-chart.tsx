"use client"

import { useState } from "react"
import { ResponsiveContainer, FunnelChart, Funnel, LabelList, Tooltip } from "recharts"

export interface FunnelStage {
  name: string
  value: number
}

interface ConversionFunnelChartProps {
  stages: FunnelStage[]
}

const FUNNEL_COLORS = ["#6366f1", "#8b5cf6", "#a855f7", "#c084fc", "#e879f9"]

export function ConversionFunnelChart({ stages }: ConversionFunnelChartProps) {
  const [animate] = useState(() =>
    typeof window === "undefined" ? true : !window.matchMedia("(prefers-reduced-motion: reduce)").matches
  )

  const data = stages.map((s, i) => ({ ...s, fill: FUNNEL_COLORS[i % FUNNEL_COLORS.length] }))

  return (
    <ResponsiveContainer width="100%" height={280}>
      <FunnelChart>
        <Tooltip
          contentStyle={{
            backgroundColor: "hsl(var(--card))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "6px",
            color: "hsl(var(--foreground))",
            fontSize: "12px",
          }}
        />
        <Funnel dataKey="value" data={data} isAnimationActive={animate}>
          <LabelList position="right" fill="hsl(var(--muted-foreground))" stroke="none" dataKey="name" />
        </Funnel>
      </FunnelChart>
    </ResponsiveContainer>
  )
}
