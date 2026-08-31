"use client"

import { motion } from "framer-motion"
import { Check, X, CalendarClock, Pencil, Play } from "lucide-react"
import { cn } from "@/lib/shadcn-utils"
import { computePlan, formatInstallmentDate } from "@/lib/investment-plan"
import type { InvestmentPlan } from "@/types"

export function PlanTracker({
  plan,
  label = "Installments",
  onEdit,
  onToggleLatest,
}: {
  plan?: InvestmentPlan
  label?: string
  onEdit?: () => void
  onToggleLatest?: () => void
}) {
  const st = computePlan(plan)

  if (!st.hasPlan) {
    return (
      <div className="mt-3 flex items-center justify-between rounded-xl border border-dashed border-neutral-200 px-3 py-2 dark:border-neutral-800">
        <span className="flex items-center gap-1.5 text-[10px] text-neutral-400 dark:text-neutral-500">
          <CalendarClock className="h-3 w-3" /> No installment plan
        </span>
        {onEdit && (
          <button
            onClick={onEdit}
            className="flex items-center gap-1 text-[10px] font-semibold text-neutral-500 underline-offset-2 hover:underline dark:text-neutral-400"
          >
            <Play className="h-3 w-3" /> Set plan
          </button>
        )}
      </div>
    )
  }

  const progress = Math.min(st.elapsed, 100)
  const completed = st.paid >= st.total
  const dueNow = st.latestDue && !st.latestPaid

  return (
    <div className="mt-3 rounded-xl border border-neutral-100 bg-neutral-50/70 p-3 dark:border-neutral-800 dark:bg-neutral-800/40">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
          <CalendarClock className="h-3 w-3" /> {label}
        </span>
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold",
            completed ? "bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400"
            : st.overdue ? "bg-red-100 text-red-600 dark:bg-red-950/40 dark:text-red-400"
            : "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300"
          )}
        >
          {completed ? <Check className="h-3 w-3" /> : st.overdue ? <X className="h-3 w-3" /> : <CalendarClock className="h-3 w-3" />}
          {st.label}
        </span>
      </div>

      <div className="mt-2 flex h-2 w-full overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-700/50">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className={cn("h-full rounded-full", completed || !st.overdue ? "bg-green-500" : "bg-red-500")}
        />
      </div>

      <div className="mt-1.5 flex items-center justify-between text-[10px] text-neutral-400 dark:text-neutral-500">
        <span>{st.paid}/{st.total} paid</span>
        <span>{st.elapsed}%</span>
      </div>

      <div className="mt-2 flex items-center justify-between rounded-lg bg-white px-2.5 py-1.5 dark:bg-neutral-900">
        <div>
          <p className="text-[10px] text-neutral-400">Next payable</p>
          <p className="text-xs font-semibold text-neutral-900 dark:text-neutral-50">
            {formatInstallmentDate(st.nextDue || st.latestDue)}
            {plan?.amount ? ` · ₹${plan.amount.toLocaleString()}` : ""}
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={onToggleLatest}
            disabled={!st.latestDue}
            className={cn(
              "flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-semibold transition-colors",
              dueNow ? "bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-950/40 dark:text-green-400" : "bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400"
            )}
          >
            {st.latestPaid ? <Check className="h-3 w-3" /> : <Play className="h-3 w-3" />}
            {st.latestPaid ? "Paid" : "Mark paid"}
          </button>
          {onEdit && (
            <button
              onClick={onEdit}
              aria-label="Edit plan"
              className="rounded-lg bg-neutral-100 p-1.5 text-neutral-500 transition-colors hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-700"
            >
              <Pencil className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
