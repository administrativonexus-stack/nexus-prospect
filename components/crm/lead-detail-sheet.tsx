"use client"

import { useState, useEffect } from "react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"
import { ExternalLink, Phone, MapPin, Star, Loader2, X, Plus, Tag as TagIcon } from "lucide-react"
import { toast } from "sonner"
import { LEAD_STATUS_LABELS } from "@/types/lead"
import type { Lead } from "@/types/lead"
import type { Audit } from "@/types/audit"
import type { Tag } from "@/types/tag"

interface LeadDetailSheetProps {
  lead: Lead | null
  open: boolean
  onClose: () => void
  onLeadUpdated: (lead: Lead) => void
}

export function LeadDetailSheet({ lead, open, onClose, onLeadUpdated }: LeadDetailSheetProps) {
  const [notes, setNotes] = useState("")
  const [savingNotes, setSavingNotes] = useState(false)
  const [niche, setNiche] = useState("")
  const [savingNiche, setSavingNiche] = useState(false)
  const [audit, setAudit] = useState<Audit | null>(null)
  const [history, setHistory] = useState<{ id: string; action: string; description: string; created_at: string }[]>([])
  const [loadingAudit, setLoadingAudit] = useState(false)
  const [runningAudit, setRunningAudit] = useState(false)
  const [allTags, setAllTags] = useState<Tag[]>([])
  const [leadTags, setLeadTags] = useState<Tag[]>([])
  const [addingTag, setAddingTag] = useState(false)
  const [newTagName, setNewTagName] = useState("")
  const [creatingTag, setCreatingTag] = useState(false)

  useEffect(() => {
    if (!lead) return
    setNotes(lead.notes ?? "")
    setNiche(lead.niche ?? "")
    fetchAudit()
    fetchHistory()
    fetchTags()
  }, [lead?.id])

  async function handleSaveNiche() {
    if (!lead) return
    setSavingNiche(true)
    try {
      const res = await fetch(`/api/leads/${lead.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ niche: niche.trim() || null }),
      })
      if (!res.ok) throw new Error()
      const updated = await res.json()
      onLeadUpdated(updated)
      toast.success("Nicho atualizado")
    } catch {
      toast.error("Falha ao salvar nicho")
    } finally {
      setSavingNiche(false)
    }
  }

  async function fetchTags() {
    if (!lead?.id) return
    const [allRes, leadRes] = await Promise.all([
      fetch("/api/tags"),
      fetch(`/api/leads/${lead.id}/tags`),
    ])
    if (allRes.ok) setAllTags(await allRes.json())
    if (leadRes.ok) setLeadTags(await leadRes.json())
  }

  async function handleAddTag(tagId: string) {
    if (!lead) return
    try {
      const res = await fetch(`/api/leads/${lead.id}/tags`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tag_id: tagId }),
      })
      if (!res.ok) throw new Error()
      await fetchTags()
    } catch {
      toast.error("Falha ao adicionar tag")
    } finally {
      setAddingTag(false)
    }
  }

  async function handleRemoveTag(tagId: string) {
    if (!lead) return
    try {
      const res = await fetch(`/api/leads/${lead.id}/tags?tag_id=${tagId}`, { method: "DELETE" })
      if (!res.ok) throw new Error()
      setLeadTags((prev) => prev.filter((t) => t.id !== tagId))
    } catch {
      toast.error("Falha ao remover tag")
    }
  }

  async function handleCreateTag() {
    if (!newTagName.trim()) return
    setCreatingTag(true)
    try {
      const res = await fetch("/api/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newTagName.trim() }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error ?? "Falha ao criar tag")
      }
      const tag = await res.json()
      setNewTagName("")
      await handleAddTag(tag.id)
      setAllTags((prev) => [...prev, tag])
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha ao criar tag")
    } finally {
      setCreatingTag(false)
    }
  }

  async function fetchAudit() {
    if (!lead?.id) return
    setLoadingAudit(true)
    try {
      const res = await fetch(`/api/audit?leadId=${lead.id}`)
      if (res.ok) setAudit(await res.json())
    } finally {
      setLoadingAudit(false)
    }
  }

  async function fetchHistory() {
    if (!lead?.id) return
    const res = await fetch(`/api/leads/${lead.id}/history`)
    if (res.ok) setHistory(await res.json())
  }

  async function handleSaveNotes() {
    if (!lead) return
    setSavingNotes(true)
    try {
      const res = await fetch(`/api/leads/${lead.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes }),
      })
      if (!res.ok) throw new Error()
      const updated = await res.json()
      onLeadUpdated(updated)
      toast.success("Observações salvas")
    } catch {
      toast.error("Falha ao salvar")
    } finally {
      setSavingNotes(false)
    }
  }

  async function handleRunAudit() {
    if (!lead) return
    setRunningAudit(true)
    try {
      const res = await fetch("/api/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId: lead.id }),
      })
      if (!res.ok) throw new Error()
      const result = await res.json()
      setAudit(result.audit)
      onLeadUpdated({ ...lead, score: result.audit.score })
      toast.success("Auditoria concluída")
    } catch {
      toast.error("Falha na auditoria IA")
    } finally {
      setRunningAudit(false)
    }
  }

  if (!lead) return null

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto" side="right">
        <SheetHeader className="pb-4">
          <div className="flex items-start gap-3">
            <div className="flex-1 min-w-0">
              <SheetTitle className="text-base font-semibold leading-tight">
                {lead.company_name}
              </SheetTitle>
              <div className="flex flex-wrap items-center gap-2 mt-1.5">
                <Badge variant="secondary" className="text-xs">
                  {LEAD_STATUS_LABELS[lead.status]}
                </Badge>
                {lead.score > 0 && (
                  <Badge variant="outline" className="text-xs">
                    Score {lead.score}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Quick info */}
          <div className="flex flex-col gap-1 pt-2">
            {lead.phone && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="h-3.5 w-3.5" />
                <a
                  href={`https://wa.me/${lead.phone.replace("@s.whatsapp.net", "").replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-foreground transition-colors"
                >
                  {lead.phone.replace("@s.whatsapp.net", "")}
                </a>
              </div>
            )}
            {lead.city && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-3.5 w-3.5" />
                {lead.city}
              </div>
            )}
            {lead.website && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <ExternalLink className="h-3.5 w-3.5" />
                <a
                  href={lead.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-foreground transition-colors truncate"
                >
                  {lead.website.replace(/^https?:\/\//, "")}
                </a>
              </div>
            )}
            {lead.rating && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                {lead.rating} ({lead.review_count} avaliações)
              </div>
            )}
          </div>

          {/* Niche — used by the SDR to route this lead to the right agent profile */}
          <div className="flex items-center gap-2 pt-2">
            <TagIcon className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
            <Input
              value={niche}
              onChange={(e) => setNiche(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSaveNiche()}
              placeholder="Nicho (ex: Marketplace, Restaurante...)"
              className="h-7 text-xs"
            />
            {niche !== (lead.niche ?? "") && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleSaveNiche}
                disabled={savingNiche}
                className="h-7 text-xs px-2 flex-shrink-0"
              >
                {savingNiche ? <Loader2 className="h-3 w-3 animate-spin" /> : "Salvar"}
              </Button>
            )}
          </div>

          {/* Tags */}
          <div className="flex flex-wrap items-center gap-1.5 pt-2">
            {leadTags.map((tag) => (
              <Badge key={tag.id} variant="outline" className="text-xs gap-1 pr-1">
                {tag.name}
                <button
                  onClick={() => handleRemoveTag(tag.id)}
                  aria-label={`Remover tag ${tag.name}`}
                  className="hover:text-red-400 transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
            <div className="relative">
              <button
                onClick={() => setAddingTag((v) => !v)}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground border border-dashed border-border/60 rounded-full px-2 py-0.5 transition-colors"
              >
                <Plus className="h-3 w-3" />
                Tag
              </button>
              {addingTag && (
                <div className="absolute z-10 mt-1 w-44 max-h-48 overflow-y-auto rounded-md border border-border bg-popover shadow-md p-1">
                  {allTags
                    .filter((t) => !leadTags.some((lt) => lt.id === t.id))
                    .map((tag) => (
                      <button
                        key={tag.id}
                        onClick={() => handleAddTag(tag.id)}
                        className="w-full text-left text-xs px-2 py-1.5 rounded-sm hover:bg-accent transition-colors"
                      >
                        {tag.name}
                      </button>
                    ))}
                  <div className="flex items-center gap-1 border-t border-border/50 mt-1 pt-1 px-1">
                    <input
                      value={newTagName}
                      onChange={(e) => setNewTagName(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleCreateTag()}
                      placeholder="Nova tag..."
                      className="flex-1 text-xs bg-transparent px-1 py-1 outline-none placeholder:text-muted-foreground/60"
                    />
                    <button
                      onClick={handleCreateTag}
                      disabled={creatingTag || !newTagName.trim()}
                      className="text-xs text-violet-400 hover:text-violet-300 disabled:opacity-40 px-1"
                    >
                      Criar
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </SheetHeader>

        <Tabs defaultValue="notes" className="mt-2">
          <TabsList className="w-full grid grid-cols-3 h-8">
            <TabsTrigger value="notes" className="text-xs">Notas</TabsTrigger>
            <TabsTrigger value="audit" className="text-xs">Auditoria IA</TabsTrigger>
            <TabsTrigger value="history" className="text-xs">Histórico</TabsTrigger>
          </TabsList>

          {/* Notes tab */}
          <TabsContent value="notes" className="mt-3 space-y-3">
            <Textarea
              placeholder="Adicionar observações sobre este lead..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={8}
              className="resize-none text-sm"
            />
            <Button
              size="sm"
              onClick={handleSaveNotes}
              disabled={savingNotes || notes === (lead.notes ?? "")}
              className="w-full"
            >
              {savingNotes ? (
                <><Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" /> Salvando...</>
              ) : "Salvar observações"}
            </Button>
          </TabsContent>

          {/* Audit tab */}
          <TabsContent value="audit" className="mt-3 space-y-4">
            {loadingAudit ? (
              <div className="space-y-2">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : audit ? (
              <AuditDisplay audit={audit} />
            ) : (
              <div className="flex flex-col items-center gap-3 py-6">
                <p className="text-sm text-muted-foreground text-center">
                  Nenhuma auditoria realizada ainda.
                  {!lead.website && " Este lead não tem website cadastrado."}
                </p>
                <Button
                  size="sm"
                  onClick={handleRunAudit}
                  disabled={runningAudit || !lead.website}
                >
                  {runningAudit ? (
                    <><Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" /> Analisando...</>
                  ) : "Analisar com IA"}
                </Button>
              </div>
            )}

            {audit && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleRunAudit}
                disabled={runningAudit || !lead.website}
                className="w-full"
              >
                {runningAudit ? "Analisando..." : "Reanalisar"}
              </Button>
            )}
          </TabsContent>

          {/* History tab */}
          <TabsContent value="history" className="mt-3">
            {history.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhuma atividade registrada.
              </p>
            ) : (
              <div className="space-y-2">
                {history.map((item) => (
                  <div key={item.id} className="flex gap-3 text-sm">
                    <div className="flex flex-col items-center">
                      <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40 mt-2" />
                      <div className="flex-1 w-px bg-border/50 mt-1" />
                    </div>
                    <div className="pb-3 flex-1 min-w-0">
                      <p className="text-foreground/80">{item.description}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {new Date(item.created_at).toLocaleString("pt-BR")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  )
}

function AuditDisplay({ audit }: { audit: Audit }) {
  const checks = [
    { key: "has_website", label: "Possui site" },
    { key: "is_responsive", label: "Site responsivo" },
    { key: "has_form", label: "Formulário" },
    { key: "has_cta", label: "CTA" },
    { key: "has_chatbot", label: "Chatbot" },
    { key: "has_lead_capture", label: "Captura de leads" },
  ] as const

  return (
    <div className="space-y-4">
      {/* Score */}
      <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
        <div
          className={`text-2xl font-bold ${
            audit.score >= 70 ? "text-emerald-400" :
            audit.score >= 40 ? "text-amber-400" : "text-red-400"
          }`}
        >
          {audit.score}
        </div>
        <div>
          <p className="text-sm font-medium">Score de Oportunidade</p>
          <p className="text-xs text-muted-foreground">0 = sem potencial · 100 = alta oportunidade</p>
        </div>
      </div>

      {/* Checks */}
      <div className="grid grid-cols-2 gap-1.5">
        {checks.map(({ key, label }) => (
          <div key={key} className="flex items-center gap-1.5 text-xs">
            <span className={audit[key] ? "text-emerald-400" : "text-red-400/60"}>
              {audit[key] ? "✓" : "✗"}
            </span>
            <span className={audit[key] ? "text-foreground/70" : "text-muted-foreground"}>
              {label}
            </span>
          </div>
        ))}
      </div>

      {/* Problems */}
      {Array.isArray(audit.problems) && audit.problems.length > 0 && (
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
            Problemas encontrados
          </p>
          <ul className="space-y-1">
            {(audit.problems as string[]).map((p, i) => (
              <li key={i} className="text-xs text-foreground/70 flex gap-1.5">
                <span className="text-red-400 mt-0.5">·</span>
                {p}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Arguments */}
      {Array.isArray(audit.sales_arguments) && audit.sales_arguments.length > 0 && (
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
            Argumentos de venda
          </p>
          <ul className="space-y-1">
            {(audit.sales_arguments as string[]).map((a, i) => (
              <li key={i} className="text-xs text-foreground/70 flex gap-1.5">
                <span className="text-emerald-400 mt-0.5">·</span>
                {a}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
