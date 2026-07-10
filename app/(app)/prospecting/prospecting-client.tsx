"use client"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import {
  Search,
  Star,
  Globe,
  Phone,
  MapPin,
  Download,
  Loader2,
  RefreshCw,
} from "lucide-react"
import type { ScrapedCompany } from "@/lib/prospecting/types"
import type { ImportStatus, ImportResult } from "@/types/prospecting"

// Stable per-company key that survives result re-renders.
// Phone is preferred; falls back to name+index for companies without phones.
function stableKey(company: ScrapedCompany, index: number): string {
  return company.phone ?? `${company.company_name}-${index}`
}

function ImportStatusIndicator({
  status,
  onRetry,
}: {
  status: ImportStatus
  onRetry: () => void
}) {
  if (status === "importing") {
    return <Loader2 className="h-4 w-4 animate-spin text-muted-foreground flex-shrink-0" />
  }
  if (status === "imported") {
    return (
      <Badge className="flex-shrink-0 bg-emerald-600 text-white hover:bg-emerald-600 text-xs">
        Importado
      </Badge>
    )
  }
  if (status === "duplicate") {
    return (
      <Badge variant="outline" className="flex-shrink-0 border-amber-500 text-amber-500 text-xs">
        Duplicado
      </Badge>
    )
  }
  if (status === "error") {
    return (
      <Button
        size="sm"
        variant="ghost"
        className="flex-shrink-0 h-7 gap-1 text-xs text-red-400 hover:text-red-300"
        onClick={onRetry}
      >
        <RefreshCw className="h-3 w-3" />
        Tentar novamente
      </Button>
    )
  }
  return null
}

export function ProspectingForm() {
  const [niche, setNiche] = useState("")
  const [city, setCity] = useState("")
  const [quantity, setQuantity] = useState("20")
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<ScrapedCompany[]>([])
  const [importStatuses, setImportStatuses] = useState<Map<string, ImportStatus>>(new Map())
  const [importingAll, setImportingAll] = useState(false)

  function setStatus(key: string, status: ImportStatus) {
    setImportStatuses((prev) => new Map(prev).set(key, status))
  }

  async function doImport(company: ScrapedCompany, index: number) {
    const key = stableKey(company, index)
    setStatus(key, "importing")

    try {
      const res = await fetch("/api/prospecting/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(company),
      })

      if (res.status === 401) {
        toast.error("Sessão expirada. Faça login novamente.")
        setStatus(key, "error")
        return
      }
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Erro desconhecido" }))
        throw new Error(err.error)
      }

      const result: ImportResult = await res.json()

      if (result.duplicate) {
        setStatus(key, "duplicate")
        // No toast — the badge is sufficient feedback for duplicates
      } else if (result.imported) {
        setStatus(key, "imported")
        toast.success(`${company.company_name} importado para o CRM`)
      } else {
        setStatus(key, "error")
        toast.error(result.error ?? `Falha ao importar ${company.company_name}`)
      }
    } catch (err) {
      setStatus(key, "error")
      toast.error(err instanceof Error ? err.message : "Falha ao importar")
    }
  }

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setResults([])
    setImportStatuses(new Map()) // reset all statuses for new search

    try {
      const res = await fetch("/api/prospecting/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ niche: niche.trim(), city: city.trim(), limit: Number(quantity) }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Falha na busca" }))
        throw new Error(err.error)
      }

      const data: ScrapedCompany[] = await res.json()
      setResults(data)

      if (data.length === 0) {
        toast.info("Nenhuma empresa encontrada. Tente outro nicho ou cidade.")
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha na busca")
    } finally {
      setLoading(false)
    }
  }

  async function handleImportAll() {
    setImportingAll(true)
    let successCount = 0
    let duplicateCount = 0

    for (let i = 0; i < results.length; i++) {
      const company = results[i]
      const key = stableKey(company, i)
      const currentStatus = importStatuses.get(key)

      // Skip rows already processed
      if (currentStatus === "imported" || currentStatus === "importing") continue

      await doImport(company, i)

      const newStatus = importStatuses.get(key)
      if (newStatus === "imported") successCount++
      if (newStatus === "duplicate") duplicateCount++

      // Small delay between requests to avoid overwhelming the API
      if (i < results.length - 1) {
        await new Promise((r) => setTimeout(r, 300))
      }
    }

    setImportingAll(false)

    const parts: string[] = []
    if (successCount > 0) parts.push(`${successCount} importado${successCount !== 1 ? "s" : ""}`)
    if (duplicateCount > 0) parts.push(`${duplicateCount} duplicado${duplicateCount !== 1 ? "s" : ""}`)
    if (parts.length > 0) toast.success(parts.join(", "))
  }

  const importedCount = [...importStatuses.values()].filter((s) => s === "imported").length
  const pendingCount = results.filter((c, i) => {
    const s = importStatuses.get(stableKey(c, i))
    return !s || s === "error"
  }).length

  return (
    <div className="space-y-6">
      {/* Search form */}
      <form onSubmit={handleSearch} className="flex flex-wrap gap-3 items-end">
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Nicho</Label>
          <Input
            placeholder="Ex: Contabilidade"
            value={niche}
            onChange={(e) => setNiche(e.target.value)}
            required
            className="w-48"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Cidade</Label>
          <Input
            placeholder="Ex: São Paulo"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            required
            className="w-48"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Quantidade</Label>
          <Input
            type="number"
            min={1}
            max={100}
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="w-24"
          />
        </div>
        <Button type="submit" disabled={loading || importingAll} className="gap-2">
          <Search className="h-4 w-4" />
          {loading ? "Buscando..." : "Buscar"}
        </Button>
      </form>

      {/* Loading skeletons */}
      {loading && (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-[4.5rem] w-full rounded-lg" />
          ))}
        </div>
      )}

      {/* Results */}
      {!loading && results.length > 0 && (
        <div className="space-y-3">
          {/* Header row */}
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              {results.length} empresa{results.length !== 1 ? "s" : ""} encontrada{results.length !== 1 ? "s" : ""}
              {importedCount > 0 && (
                <span className="ml-2 text-emerald-400">· {importedCount} importada{importedCount !== 1 ? "s" : ""}</span>
              )}
            </p>
            {pendingCount > 0 && (
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 text-xs"
                disabled={importingAll || loading}
                onClick={handleImportAll}
              >
                <Download className="h-3.5 w-3.5" />
                {importingAll
                  ? "Importando..."
                  : `Importar todos (${pendingCount})`}
              </Button>
            )}
          </div>

          {/* Company rows */}
          <div className="space-y-2">
            {results.map((company, i) => {
              const key = stableKey(company, i)
              const status = importStatuses.get(key) ?? "idle"
              const isIdle = status === "idle" || status === "error"

              return (
                <div
                  key={key}
                  className="flex items-center gap-4 rounded-lg border border-border/50 bg-card px-4 py-3"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{company.company_name}</p>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
                      {company.phone && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Phone className="h-3 w-3 flex-shrink-0" />
                          {company.phone}
                        </span>
                      )}
                      {company.website && (
                        <a
                          href={company.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors truncate max-w-[220px]"
                        >
                          <Globe className="h-3 w-3 flex-shrink-0" />
                          {company.website.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                        </a>
                      )}
                      {company.rating != null && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Star className="h-3 w-3 flex-shrink-0 fill-amber-400 text-amber-400" />
                          {company.rating.toFixed(1)}
                          {company.review_count > 0 && (
                            <span className="text-muted-foreground/60">({company.review_count})</span>
                          )}
                        </span>
                      )}
                      {company.address && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground truncate max-w-[300px]">
                          <MapPin className="h-3 w-3 flex-shrink-0" />
                          {company.address}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Import action / status */}
                  <div className="flex-shrink-0">
                    {status === "idle" || status === "error" ? (
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1.5 text-xs h-7"
                        disabled={importingAll}
                        onClick={() => doImport(company, i)}
                      >
                        <Download className="h-3 w-3" />
                        Importar
                      </Button>
                    ) : (
                      <ImportStatusIndicator
                        status={status}
                        onRetry={() => doImport(company, i)}
                      />
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
