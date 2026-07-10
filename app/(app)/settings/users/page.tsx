"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { UserPlus, Mail } from "lucide-react"

interface Profile {
  id: string
  name: string | null
  email: string | null
}

export default function UsersPage() {
  const [users, setUsers] = useState<Profile[]>([])
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    supabase
      .from("profiles")
      .select("id, name, email")
      .order("name")
      .then(({ data }) => setUsers(data ?? []))
  }, [])

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setLoading(true)

    const res = await fetch("/api/admin/invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim() }),
    })
    const data = await res.json()

    if (!res.ok) {
      toast.error(data.error ?? "Erro ao enviar convite")
    } else {
      toast.success(`Convite enviado para ${email.trim()}`)
      setEmail("")
    }

    setLoading(false)
  }

  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <h2 className="text-lg font-semibold">Usuários</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Gerencie quem tem acesso ao Nexus Prospect System.
        </p>
      </div>

      {/* Current users */}
      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Usuários ativos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {users.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum usuário encontrado.</p>
          ) : (
            users.map((u) => (
              <div key={u.id} className="flex items-center gap-3 py-1.5">
                <div className="h-8 w-8 rounded-full bg-accent flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-semibold text-foreground uppercase">
                    {(u.name ?? u.email ?? "?")[0]}
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{u.name ?? u.email}</p>
                  {u.name && (
                    <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                  )}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Invite form */}
      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Convidar novo usuário</CardTitle>
          <CardDescription>
            O convidado receberá um e-mail com link para definir a senha e acessar a plataforma.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleInvite} className="flex gap-2">
            <div className="relative flex-1">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
              <Input
                type="email"
                placeholder="socio@nexus.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="pl-9 bg-input/50 border-border/50 h-10"
              />
            </div>
            <Button type="submit" disabled={loading || !email.trim()} className="h-10 gap-2">
              <UserPlus className="h-4 w-4" />
              {loading ? "Enviando..." : "Convidar"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
