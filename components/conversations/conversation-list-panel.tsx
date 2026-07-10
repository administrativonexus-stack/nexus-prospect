"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { format, isToday, isYesterday } from "date-fns"
import { ptBR } from "date-fns/locale"
import { MessageSquare, Trash2 } from "lucide-react"
import { toast } from "sonner"
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

type Lead = {
  id: string
  company_name: string
  phone: string | null
  conversations: Array<{
    message: string
    sender: string
    read: boolean
    created_at: string
  }>
}

interface Props {
  leads: Lead[]
  selectedLeadId: string | null
}

function formatTime(dateStr: string) {
  const d = new Date(dateStr)
  if (isToday(d)) return format(d, "HH:mm", { locale: ptBR })
  if (isYesterday(d)) return "Ontem"
  return format(d, "dd/MM/yy", { locale: ptBR })
}

function getInitialColor(name: string) {
  const colors = [
    "#00A884", "#1DA462", "#2DB884", "#128C7E",
    "#25D366", "#075E54", "#34B7F1", "#0070BA",
  ]
  return colors[name.charCodeAt(0) % colors.length]
}

export function ConversationListPanel({ leads, selectedLeadId }: Props) {
  const router = useRouter()
  const [clearDialogOpen, setClearDialogOpen] = useState(false)
  const [clearing, setClearing] = useState(false)
  const [photos, setPhotos] = useState<Record<string, string>>({})

  // Refresh server data every 5s to update conversation list and unread counts
  useEffect(() => {
    const id = setInterval(() => router.refresh(), 5000)
    return () => clearInterval(id)
  }, [router])

  // Fetch profile pictures once per lead — track attempted IDs to avoid re-fetching
  const attemptedRef = useRef<Set<string>>(new Set())
  useEffect(() => {
    leads.forEach(async (lead) => {
      if (!lead.phone || attemptedRef.current.has(lead.id)) return
      attemptedRef.current.add(lead.id)
      const phone = lead.phone.replace("@s.whatsapp.net", "").replace(/\D/g, "")
      if (!phone) return
      try {
        const res = await fetch(`/api/evolution/profile-picture?phone=${phone}`)
        if (!res.ok) return
        const data = await res.json()
        if (data.url) setPhotos((prev) => ({ ...prev, [lead.id]: data.url }))
      } catch { /* ignore */ }
    })
  }, [leads])

  const leadsWithMessages = leads.filter((l) => l.conversations && l.conversations.length > 0)

  const totalMessages = leadsWithMessages.reduce(
    (sum, l) => sum + l.conversations.length,
    0
  )

  async function handleClearHistory() {
    setClearing(true)
    try {
      const res = await fetch("/api/conversations", { method: "DELETE" })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error ?? "Falha ao limpar histórico")
      }
      setClearDialogOpen(false)
      toast.success("Histórico de conversas limpo com sucesso")
      router.push("/conversations")
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao limpar histórico")
    } finally {
      setClearing(false)
    }
  }

  return (
    <>
      <div className="w-72 flex-shrink-0 border-r border-white/5 flex flex-col bg-[#111B21]">
        {/* Header */}
        <div className="px-4 py-3.5 border-b border-white/5 bg-[#202C33] flex items-center justify-between">
          <div>
            <h2 className="text-[15px] font-semibold text-[#E9EDEF]">Conversas</h2>
            {leadsWithMessages.length > 0 && (
              <p className="text-xs text-[#8696A0] mt-0.5">
                {leadsWithMessages.length} conversa{leadsWithMessages.length !== 1 ? "s" : ""}
              </p>
            )}
          </div>
          {leadsWithMessages.length > 0 && (
            <button
              onClick={() => setClearDialogOpen(true)}
              title="Limpar histórico de conversas"
              aria-label="Limpar histórico de conversas"
              className="h-8 w-8 rounded-md flex items-center justify-center text-[#8696A0] hover:text-red-400 hover:bg-white/5 transition-colors flex-shrink-0"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="overflow-y-auto flex-1">
          {leadsWithMessages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-4 py-8">
              <MessageSquare className="h-8 w-8 text-[#8696A0]/30 mb-2" />
              <p className="text-xs text-[#8696A0]">Nenhuma conversa ainda.</p>
              <p className="text-xs text-[#8696A0]/70 mt-1">Inicie contato por um lead no CRM.</p>
            </div>
          ) : (
            leadsWithMessages.map((lead) => {
              const sorted = [...lead.conversations].sort(
                (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
              )
              const latest = sorted[0]
              const unreadCount = lead.conversations.filter((c) => !c.read && c.sender === "lead").length
              const isSelected = lead.id === selectedLeadId
              const avatarColor = getInitialColor(lead.company_name)
              const initial = lead.company_name.charAt(0).toUpperCase()

              return (
                <Link
                  key={lead.id}
                  href={`/conversations/${lead.id}`}
                  className={cn(
                    "flex items-center gap-3 px-3 py-3 hover:bg-[#202C33] transition-colors border-b border-white/5",
                    isSelected && "bg-[#2A3942]"
                  )}
                >
                  <div
                    className="flex-shrink-0 w-11 h-11 rounded-full overflow-hidden flex items-center justify-center text-sm font-semibold text-white"
                    style={{ backgroundColor: avatarColor }}
                  >
                    {photos[lead.id] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={photos[lead.id]}
                        alt={lead.company_name}
                        className="w-full h-full object-cover"
                        onError={() => setPhotos((prev) => { const n = { ...prev }; delete n[lead.id]; return n })}
                      />
                    ) : (
                      initial
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <p className={cn(
                        "text-[14px] truncate leading-tight",
                        unreadCount > 0 ? "font-semibold text-[#E9EDEF]" : "font-normal text-[#E9EDEF]"
                      )}>
                        {lead.company_name}
                      </p>
                      {latest && (
                        <span className={cn(
                          "text-[11px] flex-shrink-0",
                          unreadCount > 0 ? "text-[#00A884]" : "text-[#8696A0]"
                        )}>
                          {formatTime(latest.created_at)}
                        </span>
                      )}
                    </div>
                    {latest && (
                      <div className="flex items-center justify-between gap-1 mt-0.5">
                        <p className={cn(
                          "text-[12px] truncate",
                          unreadCount > 0 ? "text-[#E9EDEF]" : "text-[#8696A0]"
                        )}>
                          {latest.sender !== "lead" && (
                            <span className="text-[#8696A0]">Você: </span>
                          )}
                          {latest.message}
                        </p>
                        {unreadCount > 0 && (
                          <span className="flex-shrink-0 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#00A884] text-[11px] font-bold text-white px-1.5">
                            {unreadCount}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </Link>
              )
            })
          )}
        </div>
      </div>

      {/* Clear history confirmation dialog */}
      <Dialog open={clearDialogOpen} onOpenChange={setClearDialogOpen}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Limpar histórico de conversas</DialogTitle>
            <DialogDescription>
              Isso vai excluir permanentemente{" "}
              <strong className="text-foreground">{totalMessages} mensagens</strong> de{" "}
              <strong className="text-foreground">{leadsWithMessages.length} conversas</strong>.
              Essa ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" disabled={clearing} />}>
              Cancelar
            </DialogClose>
            <Button
              variant="destructive"
              onClick={handleClearHistory}
              disabled={clearing}
            >
              {clearing ? "Excluindo..." : "Limpar tudo"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
