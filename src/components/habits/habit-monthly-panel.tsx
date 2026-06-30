"use client"

import { useState, useMemo } from "react"
import { motion } from "framer-motion"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useHabitStore } from "@/store/use-habit-store"
import { format, parseISO, isToday, addMonths, subMonths } from "date-fns"

function getMonthGrid(year: number, month: number): (number | null)[][] {
  const daysInMonth = new Date(year, month, 0).getDate()
  const firstDay = new Date(year, month - 1, 1).getDay()
  const startOffset = firstDay === 0 ? 6 : firstDay - 1
  const weeks: (number | null)[][] = []
  let week: (number | null)[] = []
  for (let i = 0; i < startOffset; i++) week.push(null)
  for (let d = 1; d <= daysInMonth; d++) {
    week.push(d)
    if (week.length === 7) { weeks.push(week); week = [] }
  }
  if (week.length > 0) { while (week.length < 7) week.push(null); weeks.push(week) }
  return weeks
}

export function HabitMonthlyPanel() {
  const { getMonthlySummary, getRecordsForDate, toggleDay } = useHabitStore()
  const [current, setCurrent] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  const year = current.getFullYear()
  const month = current.getMonth() + 1
  const monthStr = `${year}-${String(month).padStart(2, "0")}`
  const grid = useMemo(() => getMonthGrid(year, month), [year, month])
  const summary = useMemo(() => getMonthlySummary(monthStr), [getMonthlySummary, monthStr])

  const selectedRecords = selectedDate ? getRecordsForDate(selectedDate) : []

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      className="overflow-x-hidden rounded-2xl border border-neutral-200/60 bg-white p-5 dark:border-neutral-800/60 dark:bg-neutral-950"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">Monthly Overview</h3>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setCurrent((p) => subMonths(p, 1))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300 min-w-[120px] text-center">
            {format(current, "MMMM yyyy")}
          </span>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setCurrent((p) => addMonths(p, 1))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-1">
        {["M", "T", "W", "T", "F", "S", "S"].map((d) => (
          <div key={d} className="text-center text-[10px] font-semibold text-neutral-300 dark:text-neutral-600 py-1">{d}</div>
        ))}
      </div>

      {grid.map((week, wi) => (
        <div key={wi} className="grid grid-cols-7 gap-1 mb-1">
          {week.map((day, ci) => {
            if (!day) return <div key={ci} />
            const dateStr = `${monthStr}-${String(day).padStart(2, "0")}`
            const daySummary = summary.find((s) => s.date === dateStr)
            const isT = isToday(parseISO(dateStr))
            const isSelected = selectedDate === dateStr

            let bg = "bg-neutral-100 dark:bg-neutral-800"
            if (daySummary && daySummary.completed > 0) {
              const pct = daySummary.rate
              if (pct >= 100) bg = "bg-emerald-200 dark:bg-emerald-800"
              else if (pct >= 50) bg = "bg-emerald-100 dark:bg-emerald-900/50"
              else bg = "bg-amber-50 dark:bg-amber-950/30"
            }

            return (
              <button key={day} onClick={() => setSelectedDate(dateStr)}
                className={`flex flex-col items-center justify-center rounded-lg py-1.5 text-[11px] font-medium transition-all ${bg} ${
                  isSelected ? "ring-2 ring-neutral-900 dark:ring-neutral-50" : ""
                } ${isT ? "ring-1 ring-dashed ring-neutral-300 dark:ring-neutral-600" : ""}`}
              >
                <span className="text-neutral-700 dark:text-neutral-300">{day}</span>
                {daySummary && daySummary.total > 0 && (
                  <span className="text-[8px] text-neutral-400 mt-0.5">{daySummary.completed}/{daySummary.total}</span>
                )}
              </button>
            )
          })}
        </div>
      ))}

      {selectedDate && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
          className="mt-3 overflow-hidden"
        >
          <div className="border-t border-neutral-100 pt-3 dark:border-neutral-800">
            <p className="text-xs font-medium text-neutral-500 mb-2">{format(parseISO(selectedDate), "MMMM d, yyyy")}</p>
            <div className="space-y-1.5">
              {selectedRecords.map((r) => (
                <div key={r.habitId} className="flex items-center justify-between text-sm">
                  <span className="text-neutral-700 dark:text-neutral-300">{r.name}</span>
                  <button onClick={() => toggleDay(r.habitId, selectedDate)}
                    className={`text-xs font-medium px-2 py-0.5 rounded-md ${
                      r.completed ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" : "bg-neutral-100 text-neutral-400 dark:bg-neutral-800"
                    }`}
                  >
                    {r.completed ? "Done" : "Missed"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  )
}
