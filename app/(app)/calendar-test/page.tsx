"use client"

import { useState } from "react"
import { PageHeader } from "@/components/layout/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { CalendarSearch, Clock, Video } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

interface AvailableSlot {
  start: string
  end: string
}

interface CreatedEvent {
  eventId: string
  meetLink: string | null
  htmlLink: string
}

export default function CalendarTestPage() {
  const [slots, setSlots] = useState<AvailableSlot[] | null>(null)
  const [loading, setLoading] = useState(false)

  const [email, setEmail] = useState("")
  const [dateTime, setDateTime] = useState("")
  const [creating, setCreating] = useState(false)
  const [createdEvent, setCreatedEvent] = useState<CreatedEvent | null>(null)

  async function handleSearch() {
    setLoading(true)
    setSlots(null)
    try {
      const res = await fetch("/api/google/available-slots")
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error ?? "Falha ao buscar horários")
      }
      const data: AvailableSlot[] = await res.json()
      setSlots(data)
      if (data.length === 0) toast.info("Nenhum horário disponível encontrado")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha ao buscar horários")
    } finally {
      setLoading(false)
    }
  }

  async function handleCreateMeeting() {
    setCreating(true)
    setCreatedEvent(null)
    try {
      const res = await fetch("/api/google/create-test-meeting", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, dateTime }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error ?? "Falha ao criar reunião")
      }
      const event: CreatedEvent = await res.json()
      setCreatedEvent(event)
      toast.success("Reunião criada com sucesso")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha ao criar reunião")
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Teste — Google Calendar"
        description="Página apenas para testes. Não conectada ao SDR de IA."
      />

      <Card className="max-w-lg border-border/50">
        <CardHeader>
          <CardTitle className="text-sm font-medium">Disponibilidade</CardTitle>
          <CardDescription>
            Busca os próximos 3 horários livres de 1 hora no Google Calendar conectado.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={handleSearch} disabled={loading} size="sm" className="gap-1.5">
            <CalendarSearch className="h-4 w-4" />
            {loading ? "Buscando..." : "Buscar Horários Disponíveis"}
          </Button>

          {slots && slots.length > 0 && (
            <div className="space-y-2 pt-2">
              {slots.map((slot, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 rounded-lg border border-border/50 bg-muted/20 px-3 py-2.5"
                >
                  <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <p className="text-sm">
                    {format(new Date(slot.start), "EEEE, dd/MM 'às' HH:mm", { locale: ptBR })}
                    {" – "}
                    {format(new Date(slot.end), "HH:mm", { locale: ptBR })}
                  </p>
                </div>
              ))}
            </div>
          )}

          {slots && slots.length === 0 && (
            <p className="text-sm text-muted-foreground">Nenhum horário disponível encontrado.</p>
          )}
        </CardContent>
      </Card>

      <Card className="max-w-lg border-border/50">
        <CardHeader>
          <CardTitle className="text-sm font-medium">Criar reunião de teste</CardTitle>
          <CardDescription>
            Cria um evento no Google Calendar com link do Google Meet e convida o e-mail informado.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="meeting-email" className="text-sm text-muted-foreground">E-mail do convidado</Label>
            <Input
              id="meeting-email"
              type="email"
              placeholder="convidado@exemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="meeting-datetime" className="text-sm text-muted-foreground">Data e hora</Label>
            <Input
              id="meeting-datetime"
              type="datetime-local"
              value={dateTime}
              onChange={(e) => setDateTime(e.target.value)}
            />
          </div>

          <Button
            onClick={handleCreateMeeting}
            disabled={creating || !email || !dateTime}
            size="sm"
            className="gap-1.5"
          >
            <Video className="h-4 w-4" />
            {creating ? "Criando..." : "Criar Reunião"}
          </Button>

          {createdEvent && (
            <div className="space-y-1.5 rounded-lg border border-border/50 bg-muted/20 px-3 py-2.5">
              <p className="text-xs text-muted-foreground">
                Event ID: <span className="text-foreground font-mono">{createdEvent.eventId}</span>
              </p>
              <p className="text-xs text-muted-foreground break-all">
                Meet URL:{" "}
                <a
                  href={createdEvent.meetLink ?? createdEvent.htmlLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-violet-400 hover:text-violet-300 transition-colors"
                >
                  {createdEvent.meetLink ?? createdEvent.htmlLink}
                </a>
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
