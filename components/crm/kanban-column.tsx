"use client"

import { useDroppable } from "@dnd-kit/core"
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { LeadCard } from "./lead-card"
import { cn } from "@/lib/utils"
import type { Lead, LeadStatus } from "@/types/lead"

interface KanbanColumnProps {
  status: LeadStatus
  label: string
  leads: Lead[]
  onLeadClick: (lead: Lead) => void
  selectionMode: boolean
  selectedIds: Set<string>
  onToggleSelect: (id: string) => void
}

export function KanbanColumn({
  status,
  label,
  leads,
  onLeadClick,
  selectionMode,
  selectedIds,
  onToggleSelect,
}: KanbanColumnProps) {
  const { isOver, setNodeRef } = useDroppable({ id: status })

  const selectedInColumn = leads.filter((l) => selectedIds.has(l.id)).length

  return (
    <div className="flex flex-col w-64 flex-shrink-0">
      {/* Column header */}
      <div className="flex items-center justify-between mb-2 px-1">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          {label}
        </span>
        <div className="flex items-center gap-1.5">
          {selectionMode && selectedInColumn > 0 && (
            <span className="text-[10px] font-semibold text-violet-400">
              {selectedInColumn} ✓
            </span>
          )}
          <span className="text-xs text-muted-foreground/60 tabular-nums">
            {leads.length}
          </span>
        </div>
      </div>

      {/* Drop zone */}
      <div
        ref={setNodeRef}
        className={cn(
          "flex flex-col gap-2 min-h-[200px] rounded-lg p-2 transition-colors",
          isOver && !selectionMode ? "bg-accent/30" : "bg-muted/20"
        )}
      >
        <SortableContext
          items={leads.map((l) => l.id)}
          strategy={verticalListSortingStrategy}
        >
          {leads.map((lead) => (
            <LeadCard
              key={lead.id}
              lead={lead}
              onClick={() => onLeadClick(lead)}
              selectionMode={selectionMode}
              isSelected={selectedIds.has(lead.id)}
              onToggleSelect={onToggleSelect}
            />
          ))}
        </SortableContext>

        {leads.length === 0 && (
          <div className="flex items-center justify-center h-20">
            <p className="text-xs text-muted-foreground/40">Sem leads</p>
          </div>
        )}
      </div>
    </div>
  )
}
