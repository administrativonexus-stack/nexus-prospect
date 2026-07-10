import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Bot, CheckCheck } from "lucide-react"
import type { Conversation } from "@/types/conversation"

interface Props {
  message: Conversation
}

export function MessageBubble({ message }: Props) {
  const isInbound = message.sender === "lead"
  const isAi = message.sender === "ai"
  const isOutbound = !isInbound

  return (
    <div className={cn("flex w-full px-2", isInbound ? "justify-start" : "justify-end")}>
      <div
        className={cn(
          "relative max-w-[72%] px-3 pt-2 pb-1.5 text-sm shadow-sm",
          isInbound
            ? "bg-[#202C33] text-[#E9EDEF] rounded-tr-2xl rounded-br-2xl rounded-bl-2xl"
            : isAi
            ? "bg-[#1B3A3A] text-[#E9EDEF] border border-[#00A884]/20 rounded-tl-2xl rounded-bl-2xl rounded-br-2xl"
            : "bg-[#005C4B] text-white rounded-tl-2xl rounded-bl-2xl rounded-br-2xl"
        )}
      >
        {isAi && (
          <div className="flex items-center gap-1 mb-1 text-[10px] text-[#00A884] font-semibold">
            <Bot className="h-3 w-3" />
            Sara IA
          </div>
        )}
        <p className="whitespace-pre-wrap break-words leading-[1.4]">{message.message}</p>
        <div className="flex items-center justify-end gap-1 mt-0.5">
          <span className={cn("text-[11px]", isInbound ? "text-[#8696A0]" : "text-white/50")}>
            {format(new Date(message.created_at), "HH:mm", { locale: ptBR })}
          </span>
          {isOutbound && (
            <CheckCheck className={cn("h-3.5 w-3.5 flex-shrink-0", isAi ? "text-[#00A884]/60" : "text-[#53BDEB]")} />
          )}
        </div>
      </div>
    </div>
  )
}
