"use client"

import { useState, useCallback } from "react"
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core"
import { KanbanColumn } from "./kanban-column"
import { LeadCard } from "./lead-card"
import { LeadDetailSheet } from "./lead-detail-sheet"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import { Trash2, CheckSquare, Square, X } from "lucide-react"
import type { Lead, LeadStatus } from "@/types/lead"
import { LEAD_STATUS_LABELS, LEAD_STATUS_ORDER } from "@/types/lead"
import { cn } from "@/lib/utils"

interface KanbanBoardProps {
  initialLeads: Lead[]
}

export function KanbanBoard({ initialLeads }: KanbanBoardProps) {
  const [leads, setLeads] = useState<Lead[]>(initialLeads)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)

  // Selection state
  const [selectionMode, setSelectionMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  const getLeadsByStatus = useCallback(
    (status: LeadStatus) => leads.filter((l) => l.status === status),
    [leads]
  )

  const activeLead = activeId ? leads.find((l) => l.id === activeId) : null

  function handleDragStart({ active }: DragStartEvent) {
    if (selectionMode) return
    setActiveId(active.id as string)
  }

  async function handleDragEnd({ active, over }: DragEndEvent) {
    setActiveId(null)
    if (!over || active.id === over.id) return

    const lead = leads.find((l) => l.id === active.id)
    const newStatus = over.id as LeadStatus

    if (!lead || lead.status === newStatus) return

    setLeads((prev) =>
      prev.map((l) => (l.id === lead.id ? { ...l, status: newStatus } : l))
    )

    try {
      const res = await fetch(`/api/leads/${lead.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })
      if (!res.ok) throw new Error()
    } catch {
      setLeads((prev) =>
        prev.map((l) => (l.id === lead.id ? { ...l, status: lead.status } : l))
      )
      toast.error("Falha ao atualizar status. Tente novamente.")
    }
  }

  function toggleSelectionMode() {
    setSelectionMode((v) => !v)
    setSelectedIds(new Set())
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const allSelected = leads.length > 0 && selectedIds.size === leads.length

  function handleSelectAll() {
    if (allSelected) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(leads.map((l) => l.id)))
    }
  }

  async function handleDeleteConfirm() {
    setDeleting(true)
    const ids = Array.from(selectedIds)
    try {
      const res = await fetch("/api/leads/bulk-delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error ?? "Falha ao excluir leads")
      }

      setLeads((prev) => prev.filter((l) => !selectedIds.has(l.id)))
      setSelectedIds(new Set())
      setSelectionMode(false)
      setDeleteDialogOpen(false)
      toast.success(
        `${ids.length} lead${ids.length !== 1 ? "s" : ""} excluído${ids.length !== 1 ? "s" : ""} com sucesso`
      )
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha ao excluir leads")
    } finally {
      setDeleting(false)
    }
  }

  return (
    <>
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs text-muted-foreground">
          {leads.length} lead{leads.length !== 1 ? "s" : ""} no pipeline
        </p>
        <Button
          size="sm"
          variant={selectionMode ? "secondary" : "outline"}
          className="gap-1.5 text-xs h-8"
          onClick={toggleSelectionMode}
        >
          {selectionMode ? (
            <>
              <X className="h-3.5 w-3.5" />
              Cancelar seleção
            </>
          ) : (
            <>
              <CheckSquare className="h-3.5 w-3.5" />
              Selecionar
            </>
          )}
        </Button>
      </div>

      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-4">
          {LEAD_STATUS_ORDER.map((status) => (
            <KanbanColumn
              key={status}
              status={status}
              label={LEAD_STATUS_LABELS[status]}
              leads={getLeadsByStatus(status)}
              onLeadClick={setSelectedLead}
              selectionMode={selectionMode}
              selectedIds={selectedIds}
              onToggleSelect={toggleSelect}
            />
          ))}
        </div>

        <DragOverlay>
          {activeLead && <LeadCard lead={activeLead} />}
        </DragOverlay>
      </DndContext>

      {/* Floating action bar — visible when leads are selected */}
      {selectionMode && selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-xl border border-border/80 bg-card/95 px-4 py-3 shadow-2xl backdrop-blur-sm anim-fade-up">
          <span className="text-sm font-medium text-foreground">
            {selectedIds.size} selecionado{selectedIds.size !== 1 ? "s" : ""}
          </span>

          <div className="h-4 w-px bg-border mx-1" />

          <button
            onClick={handleSelectAll}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            {allSelected ? (
              <><Square className="h-3.5 w-3.5" /> Desmarcar todos</>
            ) : (
              <><CheckSquare className="h-3.5 w-3.5" /> Selecionar todos ({leads.length})</>
            )}
          </button>

          <div className="h-4 w-px bg-border mx-1" />

          <button
            onClick={() => setDeleteDialogOpen(true)}
            className="flex items-center gap-1.5 text-xs text-destructive hover:text-destructive/80 transition-colors font-medium"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Excluir ({selectedIds.size})
          </button>
        </div>
      )}

      {/* Lead detail sheet */}
      <LeadDetailSheet
        lead={selectedLead}
        open={!!selectedLead}
        onClose={() => setSelectedLead(null)}
        onLeadUpdated={(updated) =>
          setLeads((prev) => prev.map((l) => (l.id === updated.id ? updated : l)))
        }
      />

      {/* Bulk delete confirmation dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Excluir leads selecionados</DialogTitle>
            <DialogDescription>
              Você está prestes a excluir permanentemente{" "}
              <strong className="text-foreground">
                {selectedIds.size} lead{selectedIds.size !== 1 ? "s" : ""}
              </strong>
              , incluindo todo o histórico de conversas, auditorias e dados associados.
              Essa ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" disabled={deleting} />}>
              Cancelar
            </DialogClose>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={deleting}
            >
              {deleting
                ? "Excluindo..."
                : `Excluir ${selectedIds.size} lead${selectedIds.size !== 1 ? "s" : ""}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
