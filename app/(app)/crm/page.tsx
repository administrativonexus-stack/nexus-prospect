import { PageHeader } from "@/components/layout/page-header"
import { KanbanBoard } from "@/components/crm/kanban-board"
import { getLeads } from "@/lib/supabase/queries/leads"

export default async function CRMPage() {
  const leads = await getLeads({ limit: 200 })

  return (
    <div className="h-full">
      <PageHeader
        title="CRM"
        description="Pipeline de vendas com 7 estágios"
      />
      <KanbanBoard initialLeads={leads} />
    </div>
  )
}
