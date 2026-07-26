"use client"

import { useMemo } from "react"
import { motion } from "framer-motion"
import { Check, Circle } from "lucide-react"
import { cn } from "@/lib/shadcn-utils"
import { useDopamineStore } from "@/store/use-dopamine-store"
import { format, subDays, startOfWeek, addDays } from "date-fns"

export function DopaminePanel() {
  const { entries, toggleCheckIn, isCheckedIn } = useDopamineStore()
  const today = format(new Date(), "yyyy-MM-dd")

  const weekDays = useMemo(() => {
    const start = startOfWeek(new Date(), { weekStartsOn: 1 })
    return Array.from({ length: 7 }, (_, i) => {
      const d = addDays(start, i)
      return {
        date: format(d, "yyyy-MM-dd"),
        label: format(d, "EEE"),
        dayNum: format(d, "d"),
        month: format(d, "MMM"),
        isToday: format(d, "yyyy-MM-dd") === today,
        isFuture: d > new Date(),
      }
    })
  }, [today])

  const last30 = useMemo(() => {
    return Array.from({ length: 30 }, (_, i) => {
      const d = subDays(new Date(), 29 - i)
      const dateStr = format(d, "yyyy-MM-dd")
      return {
        date: dateStr,
        dayNum: format(d, "d"),
        month: format(d, "MMM"),
        isToday: dateStr === today,
        checked: isCheckedIn(dateStr),
      }
    })
  }, [entries, today])

  const totalChecked = entries.length
  const thisWeek = weekDays.filter((d) => isCheckedIn(d.date)).length

  return (
    <div className="space-y-4">
      {/* This Week */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-neutral-200/60 bg-white p-4 sm:p-5 dark:border-neutral-800/60 dark:bg-neutral-950"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">This Week</h3>
          <span className="text-xs text-neutral-400">{thisWeek}/7 days</span>
        </div>

        <div className="grid grid-cols-7 gap-2">
          {weekDays.map((day) => {
            const checked = isCheckedIn(day.date)
            const disabled = day.isFuture

            return (
              <button
                key={day.date}
                onClick={() => !disabled && toggleCheckIn(day.date)}
                disabled={disabled}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-xl py-3 transition-all",
                  disabled
                    ? "opacity-30 cursor-not-allowed"
                    : checked
                      ? "bg-emerald-50 dark:bg-emerald-900/20"
                      : "bg-neutral-50 hover:bg-neutral-100 dark:bg-neutral-900 dark:hover:bg-neutral-800"
                )}
              >
                <span className="text-[10px] font-medium text-neutral-500 dark:text-neutral-400">
                  {day.label}
                </span>
                <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                  {day.dayNum}
                </span>
                {day.isToday ? (
                  <div className={cn(
                    "mt-0.5 flex h-6 w-6 items-center justify-center rounded-full border-2 transition-all",
                    checked
                      ? "border-emerald-500 bg-emerald-500"
                      : "border-neutral-300 dark:border-neutral-600"
                  )}>
                    {checked && <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} />}
                  </div>
                ) : (
                  <div className={cn(
                    "mt-0.5 flex h-6 w-6 items-center justify-center rounded-full transition-all",
                    checked
                      ? "bg-emerald-500"
                      : "bg-neutral-200 dark:bg-neutral-700"
                  )}>
                    {checked && <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} />}
                  </div>
                )}
              </button>
            )
          })}
        </div>

        {thisWeek === 7 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-3 flex items-center justify-center gap-2 rounded-xl bg-emerald-50 py-2 dark:bg-emerald-900/20"
          >
            <span className="text-sm">🔥</span>
            <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">Perfect week!</span>
          </motion.div>
        )}
      </motion.div>

      {/* Last 30 Days Grid */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="rounded-2xl border border-neutral-200/60 bg-white p-4 sm:p-5 dark:border-neutral-800/60 dark:bg-neutral-950"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">Last 30 Days</h3>
          <span className="text-xs text-neutral-400">{totalChecked} check-ins</span>
        </div>

        <div className="grid grid-cols-10 gap-1.5">
          {last30.map((day) => (
            <button
              key={day.date}
              onClick={() => toggleCheckIn(day.date)}
              className={cn(
                "group flex flex-col items-center gap-0.5 rounded-lg py-1.5 transition-all",
                day.isToday && "ring-1 ring-neutral-300 dark:ring-neutral-600",
                day.checked
                  ? "bg-emerald-100 dark:bg-emerald-900/30"
                  : "bg-neutral-50 hover:bg-neutral-100 dark:bg-neutral-900 dark:hover:bg-neutral-800"
              )}
              title={`${day.month} ${day.dayNum}${day.checked ? " (checked)" : ""}`}
            >
              <span className="text-[8px] font-medium text-neutral-400 dark:text-neutral-500">
                {day.dayNum}
              </span>
              <div className={cn(
                "h-2 w-2 rounded-full transition-all",
                day.checked
                  ? "bg-emerald-500"
                  : day.isToday
                    ? "bg-amber-400 animate-pulse"
                    : "bg-neutral-200 dark:bg-neutral-700"
              )} />
            </button>
          ))}
        </div>

        <div className="mt-3 flex items-center gap-4 text-[10px] text-neutral-400">
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-emerald-500" /> Checked in
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-neutral-200 dark:bg-neutral-700" /> Missed
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" /> Today
          </div>
        </div>
      </motion.div>
    </div>
  )
}
