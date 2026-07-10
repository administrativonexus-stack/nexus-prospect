"use client"

import { useEffect, useState, useCallback } from "react"
import type { Conversation } from "@/types/conversation"

export function useRealtimeMessages(leadId: string, initialMessages: Conversation[]) {
  const [messages, setMessages] = useState<Conversation[]>(initialMessages)

  const addMessage = useCallback((msg: Conversation) => {
    setMessages((prev) => {
      if (prev.some((m) => m.id === msg.id)) return prev
      return [...prev, msg]
    })
  }, [])

  useEffect(() => {
    let cancelled = false

    const poll = async () => {
      try {
        const res = await fetch(`/api/conversations/${leadId}`)
        console.log("[poll] status:", res.status, "cancelled:", cancelled)
        if (!res.ok || cancelled) return
        const data: Conversation[] = await res.json()
        console.log("[poll] data length:", data.length)
        if (!Array.isArray(data) || cancelled) return
        setMessages((prev) => {
          console.log("[poll] prev:", prev.length, "new:", data.length)
          if (data.length <= prev.length) return prev
          return data
        })
      } catch (err) {
        console.error("[poll] error:", err)
      }
    }

    // Fetch immediately on mount, then every 4s
    poll()
    const id = setInterval(poll, 4000)
    return () => {
      cancelled = true
      clearInterval(id)
    }
  }, [leadId])

  return { messages, addMessage }
}
