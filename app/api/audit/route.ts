import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getLeadById, updateLead } from "@/lib/supabase/queries/leads"
import { createAudit, getAuditByLead } from "@/lib/supabase/queries/audits"
import { runAudit } from "@/lib/openai/auditor"

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const leadId = searchParams.get("leadId")
    if (!leadId) return NextResponse.json({ error: "leadId required" }, { status: 400 })

    const audit = await getAuditByLead(leadId)
    if (!audit) return NextResponse.json(null)
    return NextResponse.json(audit)
  } catch {
    return NextResponse.json({ error: "Failed to fetch audit" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { leadId } = await request.json()
    if (!leadId) return NextResponse.json({ error: "leadId required" }, { status: 400 })

    const lead = await getLeadById(leadId)
    if (!lead.website) {
      return NextResponse.json({ error: "Lead has no website to audit" }, { status: 400 })
    }

    const result = await runAudit(lead.company_name, lead.website)

    // Persist audit and update lead score
    const [audit] = await Promise.all([
      createAudit({ lead_id: leadId, ...result, raw_response: null }),
      updateLead(leadId, { score: result.score }),
      supabase.from("lead_history").insert({
        lead_id: leadId,
        action: "audit_run",
        description: `Auditoria IA concluída — Score: ${result.score}`,
        metadata: { score: result.score },
        performed_by: user.id,
      }),
    ])

    return NextResponse.json({ audit })
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Audit failed"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
