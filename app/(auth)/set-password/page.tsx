"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { Eye, EyeOff } from "lucide-react"

export default function SetPasswordPage() {
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password.length < 8) {
      toast.error("A senha deve ter pelo menos 8 caracteres.")
      return
    }
    if (password !== confirm) {
      toast.error("As senhas não coincidem.")
      return
    }

    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      toast.error("Erro ao definir senha. Tente novamente.")
    } else {
      toast.success("Senha definida com sucesso!")
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
        <div className="flex items-center gap-2.5 mb-3">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/30">
            <span className="text-[13px] font-black text-white" aria-hidden="true">N</span>
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground leading-none">Nexus</p>
            <p className="text-[10px] text-muted-foreground/60 uppercase tracking-widest mt-0.5">Prospect System</p>
          </div>
        </div>
        <div className="h-px bg-border/50" />
        <div className="pt-1">
          <CardTitle className="text-xl font-semibold">Criar sua senha</CardTitle>
          <CardDescription className="text-muted-foreground mt-1">
            Defina uma senha para acessar a plataforma.
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-sm text-muted-foreground">
              Nova senha
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Mínimo 8 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="new-password"
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

          <div className="space-y-1.5">
            <Label htmlFor="confirm" className="text-sm text-muted-foreground">
              Confirmar senha
            </Label>
            <Input
              id="confirm"
              type={showPassword ? "text" : "password"}
              placeholder="Repita a senha"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              autoComplete="new-password"
              className="bg-input/50 border-border/50 h-10"
            />
          </div>

          <Button type="submit" className="w-full h-10 font-medium" disabled={loading}>
            {loading ? "Salvando..." : "Definir senha e entrar"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
