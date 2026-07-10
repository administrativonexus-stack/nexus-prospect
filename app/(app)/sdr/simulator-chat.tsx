"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Loader2, Send, RotateCcw, Bot, User, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

interface Message {
  role: "user" | "assistant"
  content: string
  ts: Date
  isError?: boolean
}

interface SimulatorChatProps {
  profile: "default" | "marketplace"
}

export function SimulatorChat({ profile }: SimulatorChatProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Switching profile mid-conversation would mix personas in the same history — reset instead
  useEffect(() => {
    setMessages([])
  }, [profile])

  async function handleSend() {
    const text = input.trim()
    if (!text || loading) return

    const userMsg: Message = { role: "user", content: text, ts: new Date() }
    setMessages((prev) => [...prev, userMsg])
    setInput("")
    setLoading(true)

    try {
      const history = messages.map((m) => ({ role: m.role, content: m.content }))
      const res = await fetch("/api/sdr/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, history, profile }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Erro na simulação")
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.reply, ts: new Date() },
      ])
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: err instanceof Error ? err.message : "Erro ao simular",
          ts: new Date(),
          isError: true,
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex flex-col h-[560px] rounded-xl border border-border/50 overflow-hidden bg-[#0B141A]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#202C33] border-b border-white/5">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
            <Bot className="h-4 w-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-medium text-[#E9EDEF]">Simulador de conversa</p>
            <p className="text-[11px] text-[#8696A0]">Você está simulando como lead fictício</p>
          </div>
        </div>
        {messages.length > 0 && (
          <button
            onClick={() => setMessages([])}
            className="flex items-center gap-1.5 text-xs text-[#8696A0] hover:text-[#E9EDEF] transition-colors"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reiniciar
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="h-12 w-12 rounded-full bg-[#202C33] flex items-center justify-center mb-3">
              <Bot className="h-6 w-6 text-[#8696A0]" />
            </div>
            <p className="text-sm text-[#8696A0]">Envie uma mensagem para testar o agente</p>
            <p className="text-xs text-[#8696A0]/60 mt-1">
              As configurações salvas são usadas para gerar as respostas
            </p>
          </div>
        )}

        {messages.map((msg, i) => {
          const isUser = msg.role === "user"
          return (
            <div key={i} className={cn("flex", isUser ? "justify-end" : "justify-start")}>
              {!isUser && (
                <div className="h-7 w-7 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center flex-shrink-0 mr-2 mt-1">
                  <Bot className="h-3.5 w-3.5 text-white" />
                </div>
              )}
              <div className="max-w-[75%]">
                <div
                  className={cn(
                    "px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap flex items-start gap-1.5",
                    isUser
                      ? "bg-[#005C4B] text-white rounded-tl-2xl rounded-bl-2xl rounded-br-2xl"
                      : msg.isError
                        ? "bg-red-500/10 text-red-400 rounded-tr-2xl rounded-br-2xl rounded-bl-2xl"
                        : "bg-[#202C33] text-[#E9EDEF] rounded-tr-2xl rounded-br-2xl rounded-bl-2xl"
                  )}
                >
                  {msg.isError && <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />}
                  {msg.content}
                </div>
                <p className="text-[10px] text-[#8696A0] mt-1 px-1">
                  {format(msg.ts, "HH:mm", { locale: ptBR })}
                </p>
              </div>
              {isUser && (
                <div className="h-7 w-7 rounded-full bg-[#2A3942] flex items-center justify-center flex-shrink-0 ml-2 mt-1">
                  <User className="h-3.5 w-3.5 text-[#8696A0]" />
                </div>
              )}
            </div>
          )
        })}

        {loading && (
          <div className="flex justify-start">
            <div className="h-7 w-7 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center flex-shrink-0 mr-2 mt-1">
              <Bot className="h-3.5 w-3.5 text-white" />
            </div>
            <div className="bg-[#202C33] rounded-tr-2xl rounded-br-2xl rounded-bl-2xl px-4 py-3">
              <div className="flex gap-1 items-center">
                <span className="h-1.5 w-1.5 rounded-full bg-[#8696A0] animate-bounce [animation-delay:0ms]" />
                <span className="h-1.5 w-1.5 rounded-full bg-[#8696A0] animate-bounce [animation-delay:150ms]" />
                <span className="h-1.5 w-1.5 rounded-full bg-[#8696A0] animate-bounce [animation-delay:300ms]" />
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-3 py-3 bg-[#202C33] border-t border-white/5 flex items-end gap-2">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Digite uma mensagem como se fosse o lead..."
          rows={1}
          className="flex-1 resize-none bg-[#2A3942] text-[#E9EDEF] placeholder:text-[#8696A0] text-sm rounded-lg px-3 py-2.5 outline-none border-none focus:ring-0 min-h-[40px] max-h-[120px] overflow-y-auto"
          style={{ scrollbarWidth: "none" }}
        />
        <Button
          onClick={handleSend}
          disabled={!input.trim() || loading}
          size="icon"
          className="h-10 w-10 rounded-full bg-[#00A884] hover:bg-[#00A884]/80 flex-shrink-0 disabled:opacity-40"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin text-white" />
          ) : (
            <Send className="h-4 w-4 text-white" />
          )}
        </Button>
      </div>
    </div>
  )
}
