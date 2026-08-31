"use client"

import { Check } from "lucide-react"
import { cn } from "@/lib/shadcn-utils"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { enumerateInstallments, formatInstallmentDate } from "@/lib/investment-plan"
import type { InvestmentPlan, PlanFrequency } from "@/types"

export type PlanDraft = {
  enabled: boolean
  start: string
  amount: number
  frequency: PlanFrequency
  tenure: number
}

export const emptyPlanDraft: PlanDraft = { enabled: false, start: "", amount: 0, frequency: "monthly", tenure: 12 }

export function draftFromPlan(plan?: InvestmentPlan): PlanDraft {
  if (!plan) return emptyPlanDraft
  return {
    enabled: true,
    start: plan.start,
    amount: plan.amount,
    frequency: plan.frequency,
    tenure: plan.tenure,
  }
}

export function draftToPlan(draft: PlanDraft, prevPaid: string[] = []): InvestmentPlan | undefined {
  if (!draft.enabled || !draft.start || draft.amount <= 0 || draft.tenure <= 0) return undefined
  return { start: draft.start, amount: draft.amount, frequency: draft.frequency, tenure: draft.tenure, paid: prevPaid }
}

export function PlanFields({
  draft,
  onChange,
}: {
  draft: PlanDraft
  onChange: (d: PlanDraft) => void
}) {
  const preview = draftToPlan(draft)
  const dates = preview ? enumerateInstallments(preview) : []

  return (
    <div className="space-y-3 rounded-xl border border-neutral-200 p-3 dark:border-neutral-800">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-neutral-900 dark:text-neutral-50">Recurring installment plan</p>
          <p className="text-[11px] text-neutral-400 dark:text-neutral-500">Track paid installments with a progress bar</p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={draft.enabled}
          onClick={() => onChange({ ...draft, enabled: !draft.enabled })}
          className={cn("relative h-6 w-11 shrink-0 rounded-full transition-colors", draft.enabled ? "bg-green-500" : "bg-neutral-300 dark:bg-neutral-700")}
        >
          <span className={cn("absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all", draft.enabled ? "left-[22px]" : "left-0.5")} />
        </button>
      </div>

      {draft.enabled && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="plan-start" className="text-[11px] text-neutral-400">First due date</Label>
              <Input id="plan-start" type="date" value={draft.start} onChange={(e) => onChange({ ...draft, start: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="plan-amount" className="text-[11px] text-neutral-400">Installment (₹)</Label>
              <Input id="plan-amount" type="number" value={draft.amount || ""} onChange={(e) => onChange({ ...draft, amount: Number(e.target.value) })} placeholder="500" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-[11px] text-neutral-400">Frequency</Label>
              <div className="grid grid-cols-2 gap-1 rounded-lg bg-neutral-100 p-0.5 dark:bg-neutral-800">
                {(["monthly", "quarterly"] as PlanFrequency[]).map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => onChange({ ...draft, frequency: f })}
                    className={cn("rounded-md py-1.5 text-xs font-semibold capitalize transition-colors", draft.frequency === f ? "bg-white text-neutral-900 shadow-sm dark:bg-neutral-900 dark:text-neutral-50" : "text-neutral-500 dark:text-neutral-400")}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="plan-tenure" className="text-[11px] text-neutral-400">Tenure (instalments)</Label>
              <Input id="plan-tenure" type="number" min={1} value={draft.tenure || ""} onChange={(e) => onChange({ ...draft, tenure: Number(e.target.value) })} placeholder="12" />
            </div>
          </div>

          {dates.length > 0 && (
            <div className="rounded-lg bg-neutral-50 p-2.5 dark:bg-neutral-900">
              <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-neutral-400">Schedule preview</p>
              <div className="flex flex-wrap gap-1">
                {dates.slice(0, 6).map((d, i) => (
                  <span key={d} className={cn("rounded-md px-1.5 py-0.5 text-[10px]", i === 0 ? "bg-green-100 font-semibold text-green-700 dark:bg-green-950/40 dark:text-green-400" : "bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400")}>
                    {formatInstallmentDate(d)}
                  </span>
                ))}
                {dates.length > 6 && <span className="rounded-md bg-neutral-100 px-1.5 py-0.5 text-[10px] text-neutral-400 dark:bg-neutral-800">…{dates.length - 6} more</span>}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export function PlanSummaryNote({ dates }: { dates: string[] }) {
  return (
    <p className="flex items-center gap-1 text-[11px] text-neutral-400">
      <Check className="h-3 w-3 text-green-500" /> {dates.length} installments scheduled — mark each as paid when done
    </p>
  )
}
