import type { Database } from "./database"

export type Audit = Database["public"]["Tables"]["audits"]["Row"]
export type AuditInsert = Database["public"]["Tables"]["audits"]["Insert"]

export interface AuditResult {
  score: number
  has_website: boolean
  is_responsive: boolean
  has_form: boolean
  has_cta: boolean
  has_chatbot: boolean
  has_lead_capture: boolean
  problems: string[]
  opportunities: string[]
  sales_arguments: string[]
}
