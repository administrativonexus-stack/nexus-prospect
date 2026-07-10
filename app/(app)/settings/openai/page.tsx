"use client"

import { useState, useEffect } from "react"
import { PageHeader } from "@/components/layout/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { Eye, EyeOff, CheckCircle2 } from "lucide-react"

export default function OpenAISettingsPage() {
  const [apiKey, setApiKey] = useState("")
  const [saving, setSaving] = useState(false)
  const [showKey, setShowKey] = useState(false)
  const [configured, setConfigured] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/settings?key=openai_api_key")
      .then((r) => r.json())
      .then((data) => setConfigured(!!data.value))
      .finally(() => setLoading(false))
  }, [])

  async function handleSave() {
    if (!apiKey.startsWith("sk-")) {
      toast.error("Chave inválida. Deve começar com sk-")
      return
    }
    setSaving(true)
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "openai_api_key", value: apiKey }),
      })
      if (!res.ok) throw new Error()
      toast.success("Chave OpenAI salva com sucesso")
      setApiKey("")
      setConfigured(true)
    } catch {
      toast.error("Falha ao salvar")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <PageHeader title="OpenAI" description="Configure sua chave de API do OpenAI" />
      <Card className="max-w-lg border-border/50">
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="text-sm font-medium">API Key</CardTitle>
            {!loading && configured && (
              <Badge variant="secondary" className="text-xs bg-emerald-500/10 text-emerald-400 gap-1">
                <CheckCircle2 className="h-3 w-3" />
                Configurado
              </Badge>
            )}
          </div>
          <CardDescription>
            Usada para o Auditor IA e o SDR IA. Acesse{" "}
            <span className="font-medium text-foreground">platform.openai.com</span> para gerar uma.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="api-key" className="text-sm text-muted-foreground">
              Chave de API
            </Label>
            <div className="relative">
              <Input
                id="api-key"
                type={showKey ? "text" : "password"}
                placeholder={configured ? "Chave já configurada — digite para substituir" : "sk-..."}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <Button onClick={handleSave} disabled={saving || !apiKey} size="sm">
            {saving ? "Salvando..." : "Salvar chave"}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
