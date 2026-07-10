import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { startOfMonth, endOfMonth, startOfWeek, format, subMonths } from "date-fns"

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const now = new Date()
  const monthStart = format(startOfMonth(now), "yyyy-MM-dd")
  const monthEnd = format(endOfMonth(now), "yyyy-MM-dd")
  const today = format(now, "yyyy-MM-dd")
  const weekStart = format(startOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd")
  const prevMonthStart = format(startOfMonth(subMonths(now, 1)), "yyyy-MM-dd")
  const prevMonthEnd = format(endOfMonth(subMonths(now, 1)), "yyyy-MM-dd")

  const [txRes, clientsRes, prevTxRes, goalRes, chartRes] = await Promise.all([
    supabase.from("financial_transactions").select("*").eq("user_id", user.id),
    supabase.from("financial_clients").select("*").eq("user_id", user.id),
    supabase.from("financial_transactions").select("*").eq("user_id", user.id)
      .gte("due_date", prevMonthStart).lte("due_date", prevMonthEnd).eq("status", "paid"),
    supabase.from("financial_goals").select("*").eq("user_id", user.id)
      .eq("month", format(now, "yyyy-MM")).single(),
    supabase.from("financial_transactions").select("*").eq("user_id", user.id)
      .gte("due_date", format(subMonths(now, 11), "yyyy-MM-dd"))
      .order("due_date"),
  ])

  const all = txRes.data ?? []
  const prevPaid = prevTxRes.data ?? []
  const clients = clientsRes.data ?? []
  const chart = chartRes.data ?? []

  const thisMonth = all.filter(t => t.due_date >= monthStart && t.due_date <= monthEnd)
  const paid = thisMonth.filter(t => t.status === "paid")
  const paidIncome = paid.filter(t => t.type === "income").reduce((s, t) => s + Number(t.amount), 0)
  const paidExpense = paid.filter(t => t.type === "expense").reduce((s, t) => s + Number(t.amount), 0)

  const prevIncome = prevPaid.filter(t => t.type === "income").reduce((s, t) => s + Number(t.amount), 0)
  const prevExpense = prevPaid.filter(t => t.type === "expense").reduce((s, t) => s + Number(t.amount), 0)
  const prevProfit = prevIncome - prevExpense

  const todayTx = all.filter(t => t.paid_date === today && t.status === "paid")
  const weekTx = all.filter(t => t.paid_date >= weekStart && t.paid_date <= today && t.status === "paid")

  const pending = all.filter(t => t.status === "pending")
  const overdue = all.filter(t => t.status === "overdue")
  const allPaid = all.filter(t => t.status === "paid")

  const mrr = clients.filter(c => c.status === "active").reduce((s, c) => s + Number(c.monthly_value), 0)

  const incomeTransactions = allPaid.filter(t => t.type === "income")
  const ticketMedio = incomeTransactions.length > 0
    ? incomeTransactions.reduce((s, t) => s + Number(t.amount), 0) / incomeTransactions.length
    : 0

  // Chart data: group by month (last 12 months)
  const monthMap: Record<string, { income: number; expense: number; profit: number }> = {}
  for (let i = 11; i >= 0; i--) {
    const m = format(subMonths(now, i), "yyyy-MM")
    monthMap[m] = { income: 0, expense: 0, profit: 0 }
  }
  for (const t of chart) {
    if (t.status !== "paid" || !t.due_date) continue
    const m = t.due_date.slice(0, 7)
    if (!monthMap[m]) continue
    if (t.type === "income") monthMap[m].income += Number(t.amount)
    else monthMap[m].expense += Number(t.amount)
  }
  for (const m of Object.keys(monthMap)) {
    monthMap[m].profit = monthMap[m].income - monthMap[m].expense
  }
  const chartData = Object.entries(monthMap).map(([month, v]) => ({
    month,
    label: new Date(month + "-01").toLocaleDateString("pt-BR", { month: "short", year: "2-digit" }),
    ...v,
  }))

  const totalFaturado = allPaid.filter(t => t.type === "income").reduce((s, t) => s + Number(t.amount), 0)
  const totalGasto = allPaid.filter(t => t.type === "expense").reduce((s, t) => s + Number(t.amount), 0)

  // Best month
  const bestMonth = chartData.reduce((best, m) => m.income > best.income ? m : best, { income: 0, label: "-", month: "" })

  // Forecast: avg of last 3 months income
  const last3 = chartData.slice(-4, -1)
  const avgIncome = last3.length > 0 ? last3.reduce((s, m) => s + m.income, 0) / last3.length : 0

  const goal = goalRes.data ?? null

  return NextResponse.json({
    receita_mes: paidIncome,
    despesas_mes: paidExpense,
    lucro_liquido: paidIncome - paidExpense,
    mrr,
    arr: mrr * 12,
    receita_prevista: Math.round(avgIncome),
    fluxo_caixa: allPaid.reduce((s, t) => s + (t.type === "income" ? Number(t.amount) : -Number(t.amount)), 0),
    contas_pagar: pending.filter(t => t.type === "expense").reduce((s, t) => s + Number(t.amount), 0),
    contas_receber: pending.filter(t => t.type === "income").reduce((s, t) => s + Number(t.amount), 0),
    ticket_medio: ticketMedio,
    clientes_ativos: clients.filter(c => c.status === "active").length,
    clientes_inadimplentes: overdue.length,
    valor_hoje: todayTx.reduce((s, t) => s + (t.type === "income" ? Number(t.amount) : -Number(t.amount)), 0),
    valor_semana: weekTx.reduce((s, t) => s + (t.type === "income" ? Number(t.amount) : -Number(t.amount)), 0),
    valor_mes: paidIncome,
    prev_income: prevIncome,
    prev_expense: prevExpense,
    prev_profit: prevProfit,
    total_faturado: totalFaturado,
    total_gasto: totalGasto,
    lucro_total: totalFaturado - totalGasto,
    media_mensal: chartData.length > 0 ? chartData.reduce((s, m) => s + m.income, 0) / chartData.filter(m => m.income > 0).length : 0,
    best_month: bestMonth.label,
    chart: chartData,
    goal: goal ? { target: Number(goal.target_amount), current: paidIncome } : null,
  })
}
