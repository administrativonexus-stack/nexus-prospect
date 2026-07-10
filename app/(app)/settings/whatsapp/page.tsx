"use client"

import { useState, useEffect, useCallback } from "react"
import { PageHeader } from "@/components/layout/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import { Loader2, RefreshCw, Webhook, FlaskConical } from "lucide-react"

const STATUS_MAP: Record<string, { label: string; className: string }> = {
  open:       { label: "Conectado",     className: "border-emerald-500 text-emerald-400" },
  connecting: { label: "Conectando…",  className: "border-amber-500 text-amber-400" },
  close:      { label: "Desconectado", className: "border-red-500 text-red-400" },
  error:      { label: "Erro",          className: "border-red-500 text-red-400" },
  unknown:    { label: "Desconhecido", className: "border-border text-muted-foreground" },
}

export default function WhatsAppSettingsPage() {
  const [evolutionUrl, setEvolutionUrl] = useState("")
  const [evolutionKey, setEvolutionKey] = useState("")
  const [instanceName, setInstanceName] = useState("nexus")
  const [saving, setSaving] = useState(false)
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [loadingQr, setLoadingQr] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<string | null>(null)
  const [loadingStatus, setLoadingStatus] = useState(false)
  const [loadingSettings, setLoadingSettings] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [disconnecting, setDisconnecting] = useState(false)
  const [configuringWebhook, setConfiguringWebhook] = useState(false)
  const [testingWebhook, setTestingWebhook] = useState(false)
  // Load saved settings on mount, then auto-check connection status
  useEffect(() => {
    async function load() {
      try {
        const [urlRes, keyRes, instanceRes] = await Promise.all([
          fetch("/api/settings?key=evolution_api_url").then((r) => r.json()),
          fetch("/api/settings?key=evolution_api_key").then((r) => r.json()),
          fetch("/api/settings?key=evolution_instance").then((r) => r.json()),
        ])
        if (urlRes.value) setEvolutionUrl(urlRes.value)
        if (keyRes.value) setEvolutionKey(keyRes.value)
        const loadedInstance = instanceRes.value || "nexus"
        if (instanceRes.value) setInstanceName(loadedInstance)

        // Auto-check status using the freshly loaded instance name
        if (urlRes.value && keyRes.value) {
          const statusRes = await fetch(`/api/evolution/status?instance=${loadedInstance}`)
          const statusData = await statusRes.json()
          if (statusRes.ok) setConnectionStatus(statusData.state ?? "unknown")
        }
      } finally {
        setLoadingSettings(false)
      }
    }
    load()
  }, [])

  async function triggerHistorySync() {
    setSyncing(true)
    try {
      const res = await fetch("/api/evolution/sync-history", { method: "POST" })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data?.error ?? "Falha ao sincronizar histórico")
        return
      }
      if (data.messages > 0) {
        toast.success(`Histórico importado: ${data.messages} mensagens de ${data.chats} conversas`)
      } else {
        const debug = data._debug
        const info = debug
          ? `Chats encontrados: ${debug.total_chats_found}. ${debug.sample_chat ? `Campos: ${debug.sample_chat.keys?.join(", ")}` : "Nenhum chat retornado."}`
          : "Nenhuma mensagem encontrada."
        toast.info(info, { duration: 8000 })
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha ao sincronizar")
    } finally {
      setSyncing(false)
    }
  }

  async function handleTestWebhook() {
    setTestingWebhook(true)
    try {
      const res = await fetch("/api/webhooks/evolution/test", { method: "POST" })
      const data = await res.json()
      if (data.ok) {
        toast.success("Pipeline do webhook funcionando — verifique a aba Conversas")
      } else {
        toast.error(`Falha na etapa "${data.step}": ${data.error}`)
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao testar webhook")
    } finally {
      setTestingWebhook(false)
    }
  }

  async function handleConfigureWebhook() {
    setConfiguringWebhook(true)
    try {
      const res = await fetch("/api/evolution/webhook-setup", { method: "POST" })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Falha ao configurar webhook")
      toast.success(`Webhook configurado: ${data.webhookUrl}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha ao configurar webhook")
    } finally {
      setConfiguringWebhook(false)
    }
  }

  async function handleDisconnect() {
    if (!confirm("Desconectar WhatsApp e apagar todo o histórico de mensagens?")) return
    setDisconnecting(true)
    try {
      const res = await fetch("/api/evolution/disconnect", { method: "POST" })
      if (!res.ok) throw new Error("Falha ao desconectar")
      setConnectionStatus("close")
      setQrCode(null)
      toast.success("WhatsApp desconectado e histórico apagado")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha ao desconectar")
    } finally {
      setDisconnecting(false)
    }
  }

  const checkStatus = useCallback(async () => {
    setLoadingStatus(true)
    try {
      const res = await fetch(`/api/evolution/status?instance=${instanceName}`)
      const data = await res.json()
      const newState = res.ok ? (data.state ?? "unknown") : "error"

      setConnectionStatus((prev) => {
        // Detecta transição connecting → open para disparar sync
        if (newState === "open" && prev === "connecting") {
          triggerHistorySync()
        }
        return newState
      })
    } catch {
      setConnectionStatus("error")
    } finally {
      setLoadingStatus(false)
    }
  }, [instanceName]) // triggerHistorySync é estável (não depende de estado)

  // Auto-poll every 10s while connecting (stops when status changes)
  useEffect(() => {
    if (connectionStatus !== "connecting") return
    const id = setInterval(checkStatus, 10_000)
    return () => clearInterval(id)
  }, [connectionStatus, checkStatus])

  async function handleSaveEvolution() {
    setSaving(true)
    try {
      const responses = await Promise.all([
        fetch("/api/settings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key: "evolution_api_url", value: evolutionUrl }),
        }),
        fetch("/api/settings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key: "evolution_api_key", value: evolutionKey }),
        }),
        fetch("/api/settings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key: "evolution_instance", value: instanceName }),
        }),
      ])
      const failed = responses.find((r) => !r.ok)
      if (failed) {
        const err = await failed.json().catch(() => ({ error: "Erro desconhecido" }))
        throw new Error(err.error ?? "Falha ao salvar")
      }
      toast.success("Evolution API configurada")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha ao salvar")
    } finally {
      setSaving(false)
    }
  }

  async function handleGetQR() {
    setLoadingQr(true)
    setQrCode(null)
    try {
      const res = await fetch(`/api/evolution/qr?instance=${instanceName}`)
      const data = await res.json()

      // Instance already connected — no QR needed
      if (data.already_connected) {
        setConnectionStatus("open")
        toast.success("WhatsApp já está conectado!")
        return
      }

      if (!res.ok) {
        throw new Error(data?.error ?? `Erro ${res.status}`)
      }
      const qr: string = data.qrcode ?? ""
      if (!qr) throw new Error("QR code não retornado pela Evolution API")
      // Strip data URI prefix — the <img> tag adds it back
      setQrCode(qr.startsWith("data:") ? qr.split(",")[1] : qr)
      setConnectionStatus("connecting")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha ao obter QR code")
    } finally {
      setLoadingQr(false)
    }
  }

  const statusInfo = connectionStatus ? (STATUS_MAP[connectionStatus] ?? STATUS_MAP.unknown) : null

  return (
    <div className="space-y-6">
      <PageHeader title="WhatsApp" description="Conecte via Evolution API" />

      <Card className="max-w-lg border-border/50">
        <CardHeader>
          <CardTitle className="text-sm font-medium">Evolution API</CardTitle>
          <CardDescription>Configure a URL e chave da sua instância Evolution API auto-hospedada.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-sm text-muted-foreground">URL da API</Label>
            <Input
              placeholder={loadingSettings ? "Carregando..." : "https://evolution.seudominio.com"}
              value={evolutionUrl}
              disabled={loadingSettings}
              onChange={(e) => setEvolutionUrl(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm text-muted-foreground">API Key</Label>
            <Input
              type="password"
              placeholder={loadingSettings ? "Carregando..." : "sua-api-key"}
              value={evolutionKey}
              disabled={loadingSettings}
              onChange={(e) => setEvolutionKey(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm text-muted-foreground">Nome da Instância</Label>
            <Input
              placeholder="nexus"
              value={instanceName}
              disabled={loadingSettings}
              onChange={(e) => setInstanceName(e.target.value)}
            />
          </div>
          <Button onClick={handleSaveEvolution} disabled={saving || loadingSettings} size="sm">
            {saving ? "Salvando..." : "Salvar configurações"}
          </Button>
        </CardContent>
      </Card>

      <Card className="max-w-lg border-border/50">
        <CardHeader>
          <CardTitle className="text-sm font-medium">Status da Conexão</CardTitle>
          <CardDescription>Verifique se a instância está conectada ao WhatsApp.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={checkStatus}
            disabled={loadingStatus}
            className="gap-1.5"
          >
            {loadingStatus ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <RefreshCw className="h-3.5 w-3.5" />
            )}
            Verificar conexão
          </Button>
          {statusInfo && (
            <Badge variant="outline" className={`text-xs ${statusInfo.className}`}>
              {statusInfo.label}
            </Badge>
          )}
          </div>

          {/* Sync + Disconnect — visible whenever connected */}
          {connectionStatus === "open" && (
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <Button
                variant="outline"
                size="sm"
                onClick={handleConfigureWebhook}
                disabled={configuringWebhook || disconnecting}
                className="gap-1.5"
              >
                {configuringWebhook ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Webhook className="h-3.5 w-3.5" />
                )}
                {configuringWebhook ? "Configurando…" : "Configurar webhook"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleTestWebhook}
                disabled={testingWebhook || disconnecting}
                className="gap-1.5"
              >
                {testingWebhook ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <FlaskConical className="h-3.5 w-3.5" />
                )}
                {testingWebhook ? "Testando…" : "Testar webhook"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={triggerHistorySync}
                disabled={syncing || disconnecting}
                className="gap-1.5"
              >
                {syncing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <span className="text-base leading-none">↓</span>}
                {syncing ? "Sincronizando…" : "Sincronizar histórico"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDisconnect}
                disabled={disconnecting || syncing}
                className="gap-1.5 border-red-500/40 text-red-400 hover:bg-red-500/10 hover:text-red-300"
              >
                {disconnecting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                {disconnecting ? "Desconectando…" : "Desconectar WhatsApp"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="max-w-lg border-border/50">
        <CardHeader>
          <CardTitle className="text-sm font-medium">Conectar WhatsApp</CardTitle>
          <CardDescription>Escaneie o QR code com seu WhatsApp para conectar a instância.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {connectionStatus === "open" ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500 flex-shrink-0" />
                <p className="text-sm text-emerald-400 font-medium">WhatsApp conectado com sucesso</p>
              </div>
              {syncing && (
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Importando histórico de conversas…
                </p>
              )}
            </div>
          ) : loadingQr ? (
            <Skeleton className="h-48 w-48 rounded-lg" />
          ) : qrCode ? (
            <div className="space-y-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`data:image/png;base64,${qrCode}`}
                alt="QR Code WhatsApp"
                width={192}
                height={192}
                className="rounded-lg"
              />
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs text-amber-400 border-amber-400/30">
                  Aguardando conexão…
                </Badge>
                <button
                  type="button"
                  onClick={checkStatus}
                  disabled={loadingStatus}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  {loadingStatus ? "Verificando…" : "Verificar agora"}
                </button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Clique em "Gerar QR Code" para conectar.</p>
          )}
          {connectionStatus !== "open" && (
            <Button onClick={handleGetQR} disabled={loadingQr} variant="outline" size="sm">
              {loadingQr ? "Gerando..." : "Gerar QR Code"}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
