"use client"

import { useState, useEffect } from "react"
import { PageHeader } from "@/components/layout/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { CheckCircle2 } from "lucide-react"

const CREDENTIAL_KEYS = [
  { key: "whatsapp_cloud_access_token", label: "Access Token", placeholder: "EAAxxxxxxxxxxxx", secret: true },
  { key: "whatsapp_cloud_phone_number_id", label: "Phone Number ID", placeholder: "123456789012345", secret: false },
  { key: "whatsapp_cloud_business_account_id", label: "Business Account ID", placeholder: "123456789012345", secret: false },
  { key: "whatsapp_cloud_app_secret", label: "App Secret", placeholder: "Usado para validar assinatura do webhook", secret: true },
  { key: "whatsapp_cloud_verify_token", label: "Verify Token", placeholder: "Defina uma string e use no handshake do Meta", secret: true },
] as const

const DISPATCH_KEYS = [
  { key: "campaign_dispatch_secret", label: "Segredo do Dispatch", placeholder: "Segredo usado pelo cron para chamar /api/campaigns/dispatch", secret: true },
  { key: "campaign_rate_limit_per_second", label: "Limite por segundo", placeholder: "8", secret: false },
  { key: "campaign_batch_size", label: "Tamanho do lote por execução", placeholder: "200", secret: false },
  { key: "campaign_daily_tier_limit", label: "Limite diário (nível da conta Meta)", placeholder: "Ex: 1000", secret: false },
] as const

export default function WhatsAppCloudSettingsPage() {
  const [values, setValues] = useState<Record<string, string>>({})
  const [configured, setConfigured] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const allKeys = [...CREDENTIAL_KEYS, ...DISPATCH_KEYS].map((k) => k.key)
    Promise.all(
      allKeys.map((key) =>
        fetch(`/api/settings?key=${key}`)
          .then((r) => r.json())
          .then((data) => [key, !!data.value] as const)
      )
    )
      .then((results) => setConfigured(Object.fromEntries(results)))
      .finally(() => setLoading(false))
  }, [])

  function setValue(key: string, value: string) {
    setValues((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSave() {
    setSaving(true)
    try {
      const entries = Object.entries(values).filter(([, v]) => v.trim() !== "")
      if (entries.length === 0) {
        toast.info("Nenhuma alteração para salvar")
        return
      }

      const results = await Promise.all(
        entries.map(([key, value]) =>
          fetch("/api/settings", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ key, value }),
          })
        )
      )
      if (results.some((r) => !r.ok)) throw new Error()

      setConfigured((prev) => ({ ...prev, ...Object.fromEntries(entries.map(([k]) => [k, true])) }))
      setValues({})
      toast.success("Configurações do WhatsApp Cloud salvas")
    } catch {
      toast.error("Falha ao salvar configurações")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="WhatsApp Cloud API"
        description="Credenciais oficiais da Meta para campanhas em massa (separado do WhatsApp via QR code)"
      />

      <Card className="max-w-lg border-border/50">
        <CardHeader>
          <CardTitle className="text-sm font-medium">Credenciais Meta</CardTitle>
          <CardDescription>
            Obtidas no Meta App Dashboard, dentro do produto WhatsApp da sua app.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {CREDENTIAL_KEYS.map(({ key, label, placeholder, secret }) => (
            <div key={key} className="space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <Label htmlFor={key} className="text-sm text-muted-foreground">{label}</Label>
                {!loading && configured[key] && (
                  <Badge variant="secondary" className="text-[10px] bg-emerald-500/10 text-emerald-400 gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    Configurado
                  </Badge>
                )}
              </div>
              <Input
                id={key}
                type={secret ? "password" : "text"}
                placeholder={configured[key] ? "Já configurado — digite para substituir" : placeholder}
                value={values[key] ?? ""}
                onChange={(e) => setValue(key, e.target.value)}
                disabled={loading}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="max-w-lg border-border/50">
        <CardHeader>
          <CardTitle className="text-sm font-medium">Disparo de Campanhas</CardTitle>
          <CardDescription>
            Controla o segredo do endpoint de dispatch e os limites de rate limiting.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {DISPATCH_KEYS.map(({ key, label, placeholder, secret }) => (
            <div key={key} className="space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <Label htmlFor={key} className="text-sm text-muted-foreground">{label}</Label>
                {!loading && configured[key] && (
                  <Badge variant="secondary" className="text-[10px] bg-emerald-500/10 text-emerald-400 gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    Configurado
                  </Badge>
                )}
              </div>
              <Input
                id={key}
                type={secret ? "password" : "text"}
                placeholder={configured[key] ? "Já configurado — digite para substituir" : placeholder}
                value={values[key] ?? ""}
                onChange={(e) => setValue(key, e.target.value)}
                disabled={loading}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={saving || loading} size="sm">
        {saving ? "Salvando..." : "Salvar configurações"}
      </Button>
    </div>
  )
}
