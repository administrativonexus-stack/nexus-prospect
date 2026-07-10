"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { Send, Bot, Phone } from "lucide-react"
import { useRealtimeMessages } from "@/hooks/use-realtime-messages"
import { MessageBubble } from "./message-bubble"
import type { Lead } from "@/types/lead"
import type { Conversation } from "@/types/conversation"
import { cn } from "@/lib/utils"

interface Props {
  lead: Lead
  initialMessages: Conversation[]
}

export function ChatWindow({ lead, initialMessages }: Props) {
  const { messages, addMessage } = useRealtimeMessages(lead.id, initialMessages)
  const [text, setText] = useState("")
  const [sending, setSending] = useState(false)
  const [aiMode, setAiMode] = useState(false)
  const [profilePhotoUrl, setProfilePhotoUrl] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  // Fetch profile picture from Evolution API
  useEffect(() => {
    if (!lead.phone) return
    const phone = lead.phone.replace("@s.whatsapp.net", "").replace(/\D/g, "")
    if (!phone) return

    fetch(`/api/evolution/profile-picture?phone=${phone}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d?.url) setProfilePhotoUrl(d.url) })
      .catch(() => {})
  }, [lead.phone])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (!text.trim()) return

    setSending(true)
    const message = text.trim()
    setText("")

    try {
      if (aiMode) {
        const res = await fetch("/api/sdr", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ lead_id: lead.id, user_message: message }),
        })
        if (!res.ok) {
          const err = await res.json().catch(() => ({}))
          throw new Error(err.error ?? "SDR falhou")
        }
        const saved = await res.json()
        if (saved?.id) addMessage(saved)
      } else {
        const res = await fetch("/api/messages/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ lead_id: lead.id, message }),
        })
        if (!res.ok) {
          const err = await res.json().catch(() => ({}))
          throw new Error(err.error ?? "Envio falhou")
        }
        const saved = await res.json()
        if (saved?.id) addMessage(saved)
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha ao enviar mensagem")
      setText(message)
    } finally {
      setSending(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend(e as unknown as React.FormEvent)
    }
  }

  const initial = lead.company_name.charAt(0).toUpperCase()
  const cleanPhone = lead.phone
    ? lead.phone.replace("@s.whatsapp.net", "")
    : null

  return (
    <div className="flex flex-col flex-1 overflow-hidden bg-[#0B141A]">
      {/* Header — WhatsApp Business style */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#202C33] border-b border-white/5 flex-shrink-0">
        <div className="flex items-center gap-3">
          {/* Contact avatar with profile photo */}
          <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 bg-[#00A884] flex items-center justify-center text-white font-semibold text-base">
            {profilePhotoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profilePhotoUrl}
                alt={lead.company_name}
                width={40}
                height={40}
                className="w-full h-full object-cover"
                onError={() => setProfilePhotoUrl(null)}
              />
            ) : (
              initial
            )}
          </div>
          <div>
            <p className="text-sm font-semibold text-[#E9EDEF] leading-tight">{lead.company_name}</p>
            {cleanPhone && (
              <p className="text-xs text-[#8696A0] flex items-center gap-1 mt-0.5">
                <Phone className="h-2.5 w-2.5" />
                {cleanPhone}
              </p>
            )}
          </div>
        </div>

        <Button
          size="sm"
          variant={aiMode ? "default" : "outline"}
          className={cn(
            "gap-1.5 text-xs",
            aiMode
              ? "bg-[#00A884] hover:bg-[#00A884]/90 text-white border-0"
              : "border-white/10 text-[#8696A0] hover:text-[#E9EDEF] hover:bg-white/5"
          )}
          onClick={() => setAiMode((v) => !v)}
        >
          <Bot className="h-3.5 w-3.5" />
          {aiMode ? "SDR IA ativo" : "Ativar SDR IA"}
        </Button>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto py-3 space-y-1">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-xs text-[#8696A0] bg-[#182229] px-4 py-2 rounded-full">
              Nenhuma mensagem ainda. Inicie a conversa!
            </p>
          </div>
        ) : (
          messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} />
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <form
        onSubmit={handleSend}
        className="flex items-end gap-2 px-3 py-2.5 bg-[#202C33] border-t border-white/5 flex-shrink-0"
      >
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            aiMode
              ? "Simular mensagem do lead para o SDR IA..."
              : "Digite uma mensagem..."
          }
          className="min-h-[2.5rem] max-h-32 resize-none text-sm bg-[#2A3942] border-0 text-[#E9EDEF] placeholder:text-[#8696A0] rounded-xl focus-visible:ring-0 focus-visible:ring-offset-0"
          rows={1}
        />
        <Button
          type="submit"
          size="icon"
          disabled={sending || !text.trim()}
          className="flex-shrink-0 h-10 w-10 rounded-full bg-[#00A884] hover:bg-[#00A884]/90 border-0 text-white disabled:opacity-40"
        >
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  )
}
