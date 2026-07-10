"use client"

import { Suspense, useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { PageHeader } from "@/components/layout/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, Calendar } from "lucide-react"

export const dynamic = "force-dynamic"

function CalendarContent() {
  const searchParams = useSearchParams()
  const justConnected = searchParams.get("connected") === "true"
  const error = searchParams.get("error")
  const [connected, setConnected] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/settings?key=google_refresh_token")
      .then((r) => r.json())
      .then((data) => setConnected(!!data.value))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div>
      <PageHeader title="Google Calendar" description="Conecte sua conta Google para criação automática de reuniões" />

      <Card className="max-w-lg border-border/50">
        <CardHeader>
          <CardTitle className="text-sm font-medium">Conexão Google</CardTitle>
          <CardDescription>
            Autorize o Nexus a criar eventos no seu Google Calendar com link Google Meet automaticamente.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {justConnected && (
            <div className="flex items-center gap-2 text-sm text-emerald-400">
              <CheckCircle2 className="h-4 w-4" />
              Google Calendar conectado com sucesso!
            </div>
          )}
          {error && (
            <div className="text-sm text-red-400">
              Erro ao conectar: {error}. Tente novamente.
            </div>
          )}

          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
            <Calendar className="h-5 w-5 text-muted-foreground flex-shrink-0" />
            <div>
              <p className="text-sm font-medium">Google Calendar + Meet</p>
              <p className="text-xs text-muted-foreground">Criação automática de eventos com link de reunião</p>
            </div>
            {!loading && connected && (
              <Badge variant="secondary" className="ml-auto text-xs bg-emerald-500/10 text-emerald-400">
                Conectado
              </Badge>
            )}
          </div>

          <a href="/api/google/auth">
            <Button variant={connected ? "outline" : "default"} size="sm" disabled={loading}>
              {connected ? "Reconectar Google" : "Conectar Google Calendar"}
            </Button>
          </a>
        </CardContent>
      </Card>
    </div>
  )
}

export default function CalendarSettingsPage() {
  return (
    <Suspense>
      <CalendarContent />
    </Suspense>
  )
}
