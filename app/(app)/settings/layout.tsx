"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { BrainCircuit, MessageCircle, Calendar, Megaphone, Users } from "lucide-react"

const settingsNav = [
  { href: "/settings/openai",         label: "OpenAI",         icon: BrainCircuit },
  { href: "/settings/whatsapp",       label: "WhatsApp",       icon: MessageCircle },
  { href: "/settings/whatsapp-cloud", label: "WhatsApp Cloud", icon: Megaphone },
  { href: "/settings/calendar",       label: "Calendário",     icon: Calendar },
  { href: "/settings/users",          label: "Usuários",       icon: Users },
]

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="flex gap-8">
      {/* Sub-nav */}
      <nav className="w-44 flex-shrink-0 space-y-0.5 pt-1">
        {settingsNav.map(({ href, label, icon: Icon }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-accent text-foreground font-medium"
                  : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Page content */}
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  )
}
