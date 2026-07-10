import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { ExternalLink, Phone, Globe, MapPin, Star } from "lucide-react"
import { LEAD_STATUS_LABELS } from "@/types/lead"
import type { Lead } from "@/types/lead"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

interface Props {
  lead: Lead
}

export function LeadInfoPanel({ lead }: Props) {
  const statusLabel = LEAD_STATUS_LABELS[lead.status]

  return (
    <div className="w-64 flex-shrink-0 border-l border-white/5 flex flex-col bg-[#111B21] overflow-y-auto">
      {/* Header */}
      <div className="px-4 py-3.5 border-b border-white/5 bg-[#202C33]">
        <p className="text-[11px] font-semibold text-[#8696A0] uppercase tracking-wider">Informações</p>
      </div>

      <div className="p-4 space-y-4">
        {/* Company */}
        <div>
          <h3 className="text-sm font-semibold text-[#E9EDEF]">{lead.company_name}</h3>
          <Badge
            variant="outline"
            className="mt-1.5 text-[10px] border-[#00A884]/30 text-[#00A884] bg-[#00A884]/10"
          >
            {statusLabel}
          </Badge>
        </div>

        {/* Score */}
        {lead.score !== null && lead.score !== undefined && lead.score > 0 && (
          <div className="flex items-center gap-2">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
                lead.score >= 70
                  ? "bg-emerald-500/20 text-emerald-400"
                  : lead.score >= 40
                  ? "bg-amber-500/20 text-amber-400"
                  : "bg-red-500/20 text-red-400"
              }`}
            >
              {lead.score}
            </div>
            <span className="text-xs text-[#8696A0]">Score IA</span>
          </div>
        )}

        {/* Details */}
        <div className="space-y-2.5 text-xs text-[#8696A0]">
          {lead.phone && (
            <div className="flex items-start gap-2">
              <Phone className="h-3 w-3 mt-0.5 flex-shrink-0 text-[#00A884]" />
              <span className="text-[#E9EDEF]">{lead.phone.replace("@s.whatsapp.net", "")}</span>
            </div>
          )}
          {lead.city && (
            <div className="flex items-start gap-2">
              <MapPin className="h-3 w-3 mt-0.5 flex-shrink-0 text-[#00A884]" />
              <span>{lead.city}</span>
            </div>
          )}
          {lead.website && (
            <div className="flex items-start gap-2">
              <Globe className="h-3 w-3 mt-0.5 flex-shrink-0 text-[#00A884]" />
              <a
                href={lead.website}
                target="_blank"
                rel="noopener noreferrer"
                className="truncate hover:text-[#E9EDEF] transition-colors"
              >
                {lead.website.replace(/^https?:\/\//, "")}
              </a>
            </div>
          )}
          {lead.rating && (
            <div className="flex items-center gap-2">
              <Star className="h-3 w-3 fill-amber-400 text-amber-400 flex-shrink-0" />
              <span>{lead.rating} ({lead.review_count} avaliações)</span>
            </div>
          )}
        </div>

        {/* Notes */}
        {lead.notes && (
          <div>
            <p className="text-xs font-medium text-[#8696A0] mb-1.5">Notas</p>
            <p className="text-xs text-[#E9EDEF]/80 whitespace-pre-wrap">{lead.notes}</p>
          </div>
        )}

        <div className="border-t border-white/5 pt-3 space-y-2">
          <p className="text-[10px] text-[#8696A0]/50">
            Importado em {format(new Date(lead.created_at), "dd/MM/yyyy", { locale: ptBR })}
          </p>

          <Link
            href="/crm"
            className={buttonVariants({
              variant: "outline",
              size: "sm",
              className: "w-full gap-1.5 text-xs border-white/10 text-[#8696A0] hover:text-[#E9EDEF] hover:bg-white/5",
            })}
          >
            <ExternalLink className="h-3 w-3" />
            Ver no CRM
          </Link>
        </div>
      </div>
    </div>
  )
}
