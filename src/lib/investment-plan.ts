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
  nextPayable: string
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
    nextPayable: "",
    overdue: false,
    label: "No plan",
  }
  if (!plan || !plan.start || plan.tenure <= 0) return noPlan

  const today = toDateKey(now)
  const installments = enumerateInstallments(plan)
  const dueDates = installments.filter((d) => d <= today)
  const paidDates = new Set(plan.paid || [])
  const paid = dueDates.filter((d) => paidDates.has(d)).length
  const unpaidDue = dueDates.find((d) => !paidDates.has(d)) || ""
  const nextPayable = unpaidDue || ""
  const overdue = dueDates.length > 0 && !!unpaidDue
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
    nextPayable,
    overdue,
    label,
  }
}

export function paidCount(plan: InvestmentPlan | undefined): number {
  if (!plan || !plan.start || plan.tenure <= 0) return 0
  const paid = new Set(plan.paid || [])
  return enumerateInstallments(plan).filter((d) => paid.has(d)).length
}

export function monthsSince(key: string, now: Date = new Date()): number {
  if (!key) return 0
  const start = new Date(key + "T00:00:00")
  if (isNaN(start.getTime())) return 0
  const months = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth())
  return Math.max(0, months + (now.getDate() >= start.getDate() ? 0 : -1))
}

export function formatInstallmentDate(key: string): string {
  if (!key) return "—"
  const [y, m, d] = key.split("-").map(Number)
  return new Date(y, m - 1, d).toLocaleDateString("en-US", { day: "numeric", month: "short" })
}

export function toggleNextPaid(plan: InvestmentPlan | undefined): InvestmentPlan | undefined {
  if (!plan) return plan
  const st = computePlan(plan)
  const target = st.nextPayable || st.latestDue
  if (!target) return plan
  const paid = new Set(plan.paid || [])
  if (paid.has(target)) paid.delete(target)
  else paid.add(target)
  return { ...plan, paid: [...paid] }
}

