"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Search,
  Kanban,
  MessageCircle,
  Megaphone,
  Bot,
  Settings,
  LogOut,
  DollarSign,
  Briefcase,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"

const NAV_GROUPS = [
  {
    label: null,
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    ],
  },
  {
    label: "Prospecção",
    items: [
      { href: "/prospecting", label: "Prospecção", icon: Search },
      { href: "/crm",         label: "CRM",         icon: Kanban },
      { href: "/conversations",label: "Conversas",  icon: MessageCircle },
    ],
  },
  {
    label: "Automação",
    items: [
      { href: "/campaigns", label: "Campanhas", icon: Megaphone },
      { href: "/sdr",       label: "SDR IA",    icon: Bot },
    ],
  },
  {
    label: "Agência",
    items: [
      { href: "/financeiro", label: "Financeiro", icon: DollarSign },
      { href: "/portfolio",  label: "Portfólio",  icon: Briefcase },
    ],
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push("/login")
  }

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(href + "/")
  }

  return (
    <aside className="flex h-full w-56 flex-col border-r border-sidebar-border bg-sidebar px-3 py-4">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-2 mb-6">
        <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center flex-shrink-0 shadow-sm shadow-violet-500/25">
          <span className="text-[11px] font-black text-white" aria-hidden="true">N</span>
        </div>
        <span className="text-sm font-semibold text-sidebar-foreground tracking-tight">
          Nexus Prospect
        </span>
      </div>

      {/* Navigation */}
      <nav aria-label="Navegação principal" className="flex-1 space-y-4">
        {NAV_GROUPS.map((group, gi) => (
          <div key={gi}>
            {group.label && (
              <p className="px-2 mb-1 text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/30 select-none">
                {group.label}
              </p>
            )}
            <div className="space-y-0.5">
              {group.items.map(({ href, label, icon: Icon }) => {
                const active = isActive(href)
                return (
                  <Link
                    key={href}
                    href={href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex items-center gap-2.5 rounded-md px-2 py-2 text-sm transition-colors min-h-[36px]",
                      active
                        ? "bg-sidebar-accent text-sidebar-foreground font-medium"
                        : "text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                    )}
                  >
                    <Icon
                      className={cn(
                        "h-4 w-4 flex-shrink-0 transition-colors",
                        active ? "text-violet-400" : "text-sidebar-foreground/40"
                      )}
                    />
                    {label}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="space-y-0.5 border-t border-sidebar-border pt-3 mt-3">
        <Link
          href="/settings"
          aria-current={pathname.startsWith("/settings") ? "page" : undefined}
          className={cn(
            "flex items-center gap-2.5 rounded-md px-2 py-2 text-sm transition-colors min-h-[36px]",
            pathname.startsWith("/settings")
              ? "bg-sidebar-accent text-sidebar-foreground font-medium"
              : "text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
          )}
        >
          <Settings
            className={cn(
              "h-4 w-4 flex-shrink-0 transition-colors",
              pathname.startsWith("/settings") ? "text-violet-400" : "text-sidebar-foreground/40"
            )}
          />
          Configurações
        </Link>
        <button
          onClick={handleLogout}
          aria-label="Sair da conta"
          className="flex w-full items-center gap-2.5 rounded-md px-2 py-2 text-sm text-sidebar-foreground/60 transition-colors hover:bg-red-500/10 hover:text-red-400 min-h-[36px]"
        >
          <LogOut className="h-4 w-4 flex-shrink-0 text-sidebar-foreground/40" />
          Sair
        </button>
      </div>
    </aside>
  )
}
