"use client"

import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Badge } from "@/components/ui/badge"
import { Star, Globe, Phone, Check } from "lucide-react"
import type { Lead } from "@/types/lead"
import { cn } from "@/lib/utils"

interface LeadCardProps {
  lead: Lead
  onClick?: () => void
  selectionMode?: boolean
  isSelected?: boolean
  onToggleSelect?: (id: string) => void
}

export function LeadCard({
  lead,
  onClick,
  selectionMode = false,
  isSelected = false,
  onToggleSelect,
}: LeadCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: lead.id, disabled: selectionMode })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  function handleClick() {
    if (selectionMode) {
      onToggleSelect?.(lead.id)
    } else {
      onClick?.()
    }
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...(!selectionMode ? listeners : {})}
      onClick={handleClick}
      className={cn(
        "group relative rounded-lg border border-border/50 bg-card p-3 transition-colors",
        selectionMode ? "cursor-pointer" : "cursor-pointer hover:border-border hover:bg-card/80",
        isDragging && "opacity-50 shadow-lg ring-1 ring-primary/30",
        isSelected && "border-violet-500/60 bg-violet-500/5 ring-1 ring-violet-500/20"
      )}
    >
      {/* Selection checkbox */}
      {selectionMode && (
        <div
          className={cn(
            "absolute top-2.5 right-2.5 h-4 w-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors",
            isSelected
              ? "border-violet-500 bg-violet-500"
              : "border-muted-foreground/30 bg-background/50"
          )}
          aria-hidden="true"
        >
          {isSelected && <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />}
        </div>
      )}

      <div className={cn("space-y-2", selectionMode && "pr-6")}>
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-medium text-foreground leading-tight line-clamp-2">
            {lead.company_name}
          </p>
          {!selectionMode && lead.score > 0 && (
            <Badge
              variant="secondary"
              className={cn(
                "text-xs flex-shrink-0 px-1.5",
                lead.score >= 70 && "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
                lead.score >= 40 && lead.score < 70 && "bg-amber-500/10 text-amber-400 border-amber-500/20",
                lead.score < 40 && "bg-red-500/10 text-red-400 border-red-500/20"
              )}
            >
              {lead.score}
            </Badge>
          )}
          {selectionMode && lead.score > 0 && (
            <span className={cn(
              "text-xs font-medium flex-shrink-0",
              lead.score >= 70 ? "text-emerald-400" : lead.score >= 40 ? "text-amber-400" : "text-red-400"
            )}>
              {lead.score}
            </span>
          )}
        </div>

        <div className="flex flex-col gap-1">
          {lead.city && (
            <p className="text-xs text-muted-foreground truncate">{lead.city}</p>
          )}
          {lead.niche && (
            <p className="text-xs text-muted-foreground/70 truncate">{lead.niche}</p>
          )}
        </div>

        <div className="flex items-center gap-3 pt-0.5">
          {lead.phone && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Phone className="h-3 w-3" />
            </span>
          )}
          {lead.website && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Globe className="h-3 w-3" />
            </span>
          )}
          {lead.rating && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
              {lead.rating}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
