"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { Eye, EyeOff } from "lucide-react"

const DEV_EMAIL = "dev@nexus.com"
const DEV_PASSWORD = "nexus@dev2025"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  function fillDevCredentials() {
    setEmail(DEV_EMAIL)
    setPassword(DEV_PASSWORD)
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      toast.error("Credenciais inválidas. Tente novamente.")
    } else {
      window.location.href = "/dashboard"
    }

    setLoading(false)
  }

  return (
    <Card
      className="w-full max-w-sm border-border/60 bg-card anim-fade-up"
      style={{
        boxShadow:
          "0 0 0 1px oklch(1 0 0 / 6%), 0 20px 60px oklch(0 0 0 / 60%), 0 0 80px oklch(0.488 0.243 264 / 8%)",
      }}
    >
      <CardHeader className="space-y-1 pb-5">
        {/* Brand mark */}
        <div className="flex items-center gap-2.5 mb-3">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/30">
            <span className="text-[13px] font-black text-white" aria-hidden="true">N</span>
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground leading-none">Nexus</p>
            <p className="text-[10px] text-muted-foreground/60 uppercase tracking-widest mt-0.5">Prospect System</p>
          </div>
        </div>

        {/* Separator */}
        <div className="h-px bg-border/50" />

        <div className="pt-1">
          <CardTitle className="text-xl font-semibold">Entrar na plataforma</CardTitle>
          <CardDescription className="text-muted-foreground mt-1">
            Acesso exclusivo para a equipe Nexus
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleLogin} className="space-y-4" noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-sm text-muted-foreground">
              E-mail
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="voce@nexus.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="username"
              className="bg-input/50 border-border/50 h-10"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-sm text-muted-foreground">
              Senha
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="bg-input/50 border-border/50 h-10 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-muted-foreground transition-colors"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <Button type="submit" className="w-full h-10 font-medium" disabled={loading}>
            {loading ? "Entrando..." : "Entrar"}
          </Button>
        </form>

        <div className="mt-4 rounded-lg border border-border/40 bg-muted/30 p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-muted-foreground">Acesso dev</p>
              <p className="text-[11px] text-muted-foreground/60">{DEV_EMAIL}</p>
            </div>
            <button
              type="button"
              onClick={fillDevCredentials}
              className="text-[11px] text-violet-400 hover:text-violet-300 transition-colors font-medium"
            >
              Preencher →
            </button>
          </div>
        </div>

      </CardContent>
    </Card>
  )
}
