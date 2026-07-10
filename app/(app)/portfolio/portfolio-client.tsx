"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import {
  Plus, Star, ExternalLink, Eye, Copy, Pencil, Trash2, Loader2,
  Globe, Code2, Smartphone, ShoppingBag, LayoutTemplate, Monitor,
} from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

interface Project {
  id: string
  name: string
  client?: string
  category: "landing_page" | "site" | "system" | "app" | "ecommerce"
  description?: string
  url?: string
  repo_url?: string
  technologies?: string[]
  thumbnail_url?: string
  date?: string
  status: "active" | "inactive" | "development"
  is_favorite: boolean
  notes?: string
  created_at: string
  updated_at: string
}

const CATEGORIES = [
  { value: "all",          label: "Todos",         icon: Globe },
  { value: "landing_page", label: "Landing Pages",  icon: LayoutTemplate },
  { value: "site",         label: "Sites",          icon: Monitor },
  { value: "system",       label: "Sistemas",       icon: Code2 },
  { value: "app",          label: "Aplicativos",    icon: Smartphone },
  { value: "ecommerce",    label: "E-commerce",     icon: ShoppingBag },
]

const TECH_OPTIONS = [
  "React","Next.js","Laravel","Vue","Node","WordPress","Firebase",
  "Supabase","HTML","CSS","JavaScript","TypeScript","PHP","Python","Outro",
]

const STATUS_CONFIG = {
  active:      { label: "Ativo",         cls: "text-emerald-400 border-emerald-500/40 bg-emerald-500/10" },
  inactive:    { label: "Inativo",       cls: "text-zinc-400 border-zinc-500/40 bg-zinc-500/10" },
  development: { label: "Em construção", cls: "text-amber-400 border-amber-500/40 bg-amber-500/10" },
}

const CAT_LABEL: Record<string, string> = {
  landing_page: "Landing Page", site: "Site", system: "Sistema", app: "App", ecommerce: "E-commerce",
}

const SORT_OPTIONS = [
  { value: "newest",  label: "Mais recentes" },
  { value: "oldest",  label: "Mais antigos" },
  { value: "az",      label: "A → Z" },
  { value: "updated", label: "Última edição" },
]

interface FormState {
  name: string; client: string; category: string; description: string
  url: string; repo_url: string; technologies: string[]; thumbnail_url: string
  date: string; status: string; notes: string
}

const emptyForm = (): FormState => ({
  name: "", client: "", category: "site", description: "",
  url: "", repo_url: "", technologies: [], thumbnail_url: "",
  date: format(new Date(), "yyyy-MM-dd"), status: "active", notes: "",
})

function ProjectModal({ open, onClose, onSaved, editProject }: {
  open: boolean; onClose: () => void; onSaved: () => void; editProject?: Project | null
}) {
  const [form, setForm] = useState<FormState>(emptyForm())
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (editProject) {
      setForm({
        name: editProject.name, client: editProject.client ?? "",
        category: editProject.category, description: editProject.description ?? "",
        url: editProject.url ?? "", repo_url: editProject.repo_url ?? "",
        technologies: editProject.technologies ?? [], thumbnail_url: editProject.thumbnail_url ?? "",
        date: editProject.date ?? format(new Date(), "yyyy-MM-dd"),
        status: editProject.status, notes: editProject.notes ?? "",
      })
    } else {
      setForm(emptyForm())
    }
  }, [editProject, open])

  if (!open) return null
  const set = (patch: Partial<FormState>) => setForm(p => ({ ...p, ...patch }))

  function toggleTech(tech: string) {
    set({ technologies: form.technologies.includes(tech)
      ? form.technologies.filter(t => t !== tech)
      : [...form.technologies, tech]
    })
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setSaving(true)
    try {
      const res = editProject
        ? await fetch(`/api/portfolio/${editProject.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) })
        : await fetch("/api/portfolio", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) })
      if (!res.ok) throw new Error((await res.json()).error)
      toast.success(editProject ? "Projeto atualizado!" : "Projeto adicionado!")
      onSaved(); onClose()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar")
    } finally { setSaving(false) }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
      role="dialog" aria-modal="true"
    >
      <div className="w-full max-w-xl bg-card border border-border/50 rounded-xl shadow-2xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/40">
          <h2 className="text-sm font-semibold">{editProject ? "Editar" : "Novo"} Projeto</h2>
        </div>
        <form onSubmit={submit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-1.5">
              <Label className="text-xs text-muted-foreground">Nome do projeto *</Label>
              <Input value={form.name} onChange={e => set({ name: e.target.value })} required className="h-9" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Cliente</Label>
              <Input value={form.client} onChange={e => set({ client: e.target.value })} className="h-9" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Categoria *</Label>
              <select value={form.category} onChange={e => set({ category: e.target.value })}
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm">
                {CATEGORIES.filter(c => c.value !== "all").map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label className="text-xs text-muted-foreground">Descrição</Label>
              <textarea value={form.description} onChange={e => set({ description: e.target.value })}
                rows={2} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">URL do site</Label>
              <Input value={form.url} onChange={e => set({ url: e.target.value })} placeholder="https://" className="h-9" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Repositório</Label>
              <Input value={form.repo_url} onChange={e => set({ repo_url: e.target.value })} placeholder="https://github.com/..." className="h-9" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Thumbnail URL</Label>
              <Input value={form.thumbnail_url} onChange={e => set({ thumbnail_url: e.target.value })} placeholder="https://..." className="h-9" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Data</Label>
              <Input type="date" value={form.date} onChange={e => set({ date: e.target.value })} className="h-9" />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label className="text-xs text-muted-foreground">Status</Label>
              <select value={form.status} onChange={e => set({ status: e.target.value })}
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm">
                <option value="active">Ativo</option>
                <option value="inactive">Inativo</option>
                <option value="development">Em construção</option>
              </select>
            </div>
            <div className="col-span-2 space-y-2">
              <Label className="text-xs text-muted-foreground">Tecnologias</Label>
              <div className="flex flex-wrap gap-1.5">
                {TECH_OPTIONS.map(tech => (
                  <button key={tech} type="button" onClick={() => toggleTech(tech)}
                    className={cn("px-2.5 py-1 rounded-full text-xs border transition-colors",
                      form.technologies.includes(tech)
                        ? "border-violet-500/60 bg-violet-500/10 text-violet-400"
                        : "border-border/50 text-muted-foreground hover:border-border hover:text-foreground")}>
                    {tech}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <Button type="submit" disabled={saving} className="flex-1">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar"}
            </Button>
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">Cancelar</Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export function PortfolioClient() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [category, setCategory] = useState("all")
  const [sort, setSort] = useState("newest")
  const [favorites, setFavorites] = useState(false)
  const [modal, setModal] = useState(false)
  const [editProject, setEditProject] = useState<Project | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ sort })
      if (category !== "all") params.set("category", category)
      if (search) params.set("search", search)
      if (favorites) params.set("favorites", "true")
      const res = await fetch(`/api/portfolio?${params}`)
      if (res.ok) setProjects(await res.json())
    } finally { setLoading(false) }
  }, [category, sort, search, favorites])

  useEffect(() => { load() }, [load])

  async function toggleFavorite(p: Project) {
    const res = await fetch(`/api/portfolio/${p.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_favorite: !p.is_favorite }),
    })
    if (res.ok) {
      setProjects(prev => prev.map(pr => pr.id === p.id ? { ...pr, is_favorite: !pr.is_favorite } : pr))
      toast.success(p.is_favorite ? "Removido dos favoritos" : "Adicionado aos favoritos")
    }
  }

  async function deleteProject(id: string) {
    if (!confirm("Excluir projeto?")) return
    const res = await fetch(`/api/portfolio/${id}`, { method: "DELETE" })
    if (res.ok) { toast.success("Excluído"); load() }
  }

  function copyLink(url: string) {
    navigator.clipboard.writeText(url)
    toast.success("Link copiado!")
  }

  const stats = {
    total: projects.length,
    landing: projects.filter(p => p.category === "landing_page").length,
    sites: projects.filter(p => p.category === "site").length,
    systems: projects.filter(p => p.category === "system").length,
    apps: projects.filter(p => p.category === "app").length,
    ecommerce: projects.filter(p => p.category === "ecommerce").length,
    active: projects.filter(p => p.status === "active").length,
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border/40">
        <div>
          <h1 className="text-lg font-semibold text-foreground">Portfólio</h1>
          <p className="text-xs text-muted-foreground">Biblioteca de projetos da Nexus Digital</p>
        </div>
        <Button size="sm" onClick={() => { setEditProject(null); setModal(true) }} className="gap-1.5 h-8">
          <Plus className="h-3.5 w-3.5" /> Novo Projeto
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">

        {/* Stats */}
        <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
          {[
            { label: "Total", value: stats.total },
            { label: "Landing", value: stats.landing },
            { label: "Sites", value: stats.sites },
            { label: "Sistemas", value: stats.systems },
            { label: "Apps", value: stats.apps },
            { label: "E-commerce", value: stats.ecommerce },
            { label: "Ativos", value: stats.active },
          ].map(s => (
            <Card key={s.label} className="border-border/40">
              <CardContent className="p-3 text-center">
                <p className="text-2xl font-bold text-foreground tabular-nums">{s.value}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <Input placeholder="Buscar por nome, cliente..." value={search}
            onChange={e => setSearch(e.target.value)} className="h-8 w-52 text-xs" />

          <div className="flex gap-1 flex-wrap">
            {CATEGORIES.map(cat => (
              <button key={cat.value} onClick={() => setCategory(cat.value)}
                className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs border transition-colors",
                  category === cat.value
                    ? "border-violet-500/60 bg-violet-500/10 text-violet-400"
                    : "border-border/50 text-muted-foreground hover:border-border hover:text-foreground")}>
                <cat.icon className="h-3 w-3" />
                {cat.label}
              </button>
            ))}
          </div>

          <select value={sort} onChange={e => setSort(e.target.value)}
            className="h-8 rounded-md border border-input bg-background px-2 text-xs ml-auto">
            {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>

          <button onClick={() => setFavorites(p => !p)}
            className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs border transition-colors",
              favorites
                ? "border-amber-500/60 bg-amber-500/10 text-amber-400"
                : "border-border/50 text-muted-foreground hover:border-border hover:text-foreground")}>
            <Star className="h-3 w-3" />
            Favoritos
          </button>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-64 rounded-xl bg-muted/30 animate-pulse" />
            ))}
          </div>
        ) : projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Globe className="h-10 w-10 text-muted-foreground/30 mb-3" />
            <p className="text-sm font-medium text-muted-foreground">Nenhum projeto encontrado</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Adicione seu primeiro projeto ao portfólio</p>
            <Button size="sm" onClick={() => { setEditProject(null); setModal(true) }} className="mt-4 gap-1.5">
              <Plus className="h-3.5 w-3.5" /> Novo Projeto
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {projects.map(p => {
              const sc = STATUS_CONFIG[p.status]
              return (
                <Card key={p.id} className="border-border/40 hover:border-border/60 transition-all duration-200 group overflow-hidden">
                  {/* Thumbnail */}
                  <div className="relative h-36 bg-gradient-to-br from-violet-500/10 to-indigo-500/10 overflow-hidden">
                    {p.thumbnail_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.thumbnail_url} alt={p.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <Globe className="h-10 w-10 text-violet-500/30" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                      {p.url && (
                        <a href={p.url} target="_blank" rel="noopener noreferrer"
                          className="h-8 w-8 rounded-full bg-white/10 backdrop-blur flex items-center justify-center hover:bg-white/20 transition-colors"
                          title="Abrir site">
                          <ExternalLink className="h-4 w-4 text-white" />
                        </a>
                      )}
                      {p.url && (
                        <button onClick={() => copyLink(p.url!)}
                          className="h-8 w-8 rounded-full bg-white/10 backdrop-blur flex items-center justify-center hover:bg-white/20 transition-colors"
                          title="Copiar link">
                          <Copy className="h-4 w-4 text-white" />
                        </button>
                      )}
                    </div>
                    <div className="absolute top-2 right-2 flex gap-1">
                      <button onClick={() => toggleFavorite(p)}
                        className={cn("h-6 w-6 rounded-full backdrop-blur-sm flex items-center justify-center transition-colors",
                          p.is_favorite ? "bg-amber-500/20 text-amber-400" : "bg-black/20 text-white/60 hover:text-amber-400")}>
                        <Star className={cn("h-3.5 w-3.5", p.is_favorite && "fill-current")} />
                      </button>
                    </div>
                    <div className="absolute top-2 left-2">
                      <Badge variant="outline" className={cn("text-[10px] backdrop-blur-sm", sc.cls)}>{sc.label}</Badge>
                    </div>
                  </div>

                  <CardContent className="p-4">
                    <div className="mb-2">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-semibold text-sm text-foreground line-clamp-1">{p.name}</p>
                        <Badge variant="outline" className="text-[10px] flex-shrink-0 text-violet-400 border-violet-500/40">
                          {CAT_LABEL[p.category]}
                        </Badge>
                      </div>
                      {p.client && <p className="text-xs text-muted-foreground mt-0.5">{p.client}</p>}
                      {p.description && <p className="text-xs text-muted-foreground/70 mt-1 line-clamp-2">{p.description}</p>}
                    </div>

                    {p.technologies && p.technologies.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {p.technologies.slice(0, 4).map(t => (
                          <span key={t} className="px-1.5 py-0.5 rounded text-[10px] bg-muted/50 text-muted-foreground border border-border/30">{t}</span>
                        ))}
                        {p.technologies.length > 4 && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-muted/50 text-muted-foreground border border-border/30">+{p.technologies.length - 4}</span>
                        )}
                      </div>
                    )}

                    <div className="flex gap-1">
                      {p.url && (
                        <a href={p.url} target="_blank" rel="noopener noreferrer"
                          className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded text-[11px] text-muted-foreground hover:text-foreground hover:bg-muted transition-colors border border-border/40">
                          <ExternalLink className="h-3 w-3" /> Abrir
                        </a>
                      )}
                      <button onClick={() => { setEditProject(p); setModal(true) }} aria-label="Editar projeto"
                        className="flex items-center justify-center p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors border border-border/40 min-w-[28px] min-h-[28px]">
                        <Pencil className="h-3 w-3" />
                      </button>
                      <button onClick={() => deleteProject(p.id)} aria-label="Excluir projeto"
                        className="flex items-center justify-center p-1.5 rounded text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors border border-border/40 min-w-[28px] min-h-[28px]">
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      <ProjectModal
        open={modal}
        onClose={() => { setModal(false); setEditProject(null) }}
        onSaved={load}
        editProject={editProject}
      />
    </div>
  )
}
