import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { FinanceiroClient } from "./financeiro-client"

export default async function FinanceiroPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")
  return <FinanceiroClient />
}
