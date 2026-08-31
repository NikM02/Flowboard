import type { InvestmentPlan, PlanFrequency } from "@/types"

export function toDateKey(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

export function addMonths(date: Date, months: number): Date {
  const d = new Date(date.getTime())
  const day = d.getDate()
  d.setDate(1)
  d.setMonth(d.getMonth() + months)
  const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()
  d.setDate(Math.min(day, lastDay))
  return d
}

export function enumerateInstallments(plan: InvestmentPlan): string[] {
  if (!plan.start) return []
  const dates: string[] = []
  let cur = new Date(plan.start + "T00:00:00")
  for (let i = 0; i < plan.tenure; i++) {
    dates.push(toDateKey(cur))
    cur = addMonths(cur, plan.frequency === "monthly" ? 1 : 3)
  }
  return dates
}

export type PlanStatus = {
  hasPlan: boolean
  total: number
  due: number
  paid: number
  elapsed: number
  nextDue: string
  latestDue: string
  latestPaid: boolean
  overdue: boolean
  label: string
}

export function computePlan(plan: InvestmentPlan | undefined, now: Date = new Date()): PlanStatus {
  const noPlan: PlanStatus = {
    hasPlan: false,
    total: 0,
    due: 0,
    paid: 0,
    elapsed: 0,
    nextDue: "",
    latestDue: "",
    latestPaid: false,
    overdue: false,
    label: "No plan",
  }
  if (!plan || !plan.start || plan.tenure <= 0) return noPlan

  const today = toDateKey(now)
  const installments = enumerateInstallments(plan)
  const dueDates = installments.filter((d) => d <= today)
  const paidDates = new Set(plan.paid || [])
  const paid = dueDates.filter((d) => paidDates.has(d)).length
  const overdue = dueDates.length > 0 && dueDates.some((d) => !paidDates.has(d))
  const latestDue = dueDates[dueDates.length - 1] || ""
  const latestPaid = latestDue === "" ? false : paidDates.has(latestDue)
  const nextDue = installments.find((d) => d > today) || ""
  const elapsed = installments.length ? Math.round((paid / installments.length) * 100) : 0

  let label = "Not started"
  if (installments.length === 0) label = "No plan"
  else if (paid >= installments.length) label = "Completed"
  else if (overdue) label = "Overdue"
  else if (latestPaid && latestDue) label = "On track"
  else if (latestDue) label = "Upcoming"

  return {
    hasPlan: true,
    total: installments.length,
    due: dueDates.length,
    paid,
    elapsed,
    nextDue,
    latestDue,
    latestPaid,
    overdue,
    label,
  }
}

export function formatInstallmentDate(key: string): string {
  if (!key) return "—"
  const [y, m, d] = key.split("-").map(Number)
  return new Date(y, m - 1, d).toLocaleDateString("en-US", { day: "numeric", month: "short" })
}

export function toggleLatestPaid(plan: InvestmentPlan | undefined): InvestmentPlan | undefined {
  if (!plan) return plan
  const st = computePlan(plan)
  if (!st.latestDue) return plan
  const paid = new Set(plan.paid || [])
  if (paid.has(st.latestDue)) paid.delete(st.latestDue)
  else paid.add(st.latestDue)
  return { ...plan, paid: [...paid] }
}

