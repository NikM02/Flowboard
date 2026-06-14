"use client"

import { useState, useMemo } from "react"
import { motion } from "framer-motion"
import { Brain, Zap, Heart, Moon, Target, TrendingUp, AlertCircle, Check } from "lucide-react"
import { cn } from "@/lib/shadcn-utils"
import { useDopamineStore } from "@/store/use-dopamine-store"
import { format, startOfWeek, endOfWeek, eachDayOfInterval } from "date-fns"

type Metric = {
  key: string
  label: string
  icon: typeof Brain
  color: string
  bg: string
}

const metrics: Metric[] = [
  { key: "mood", label: "Mood", icon: Heart, color: "text-rose-600 dark:text-rose-400", bg: "bg-rose-50 dark:bg-rose-950/30" },
  { key: "energy", label: "Energy", icon: Zap, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-950/30" },
  { key: "motivation", label: "Motivation", icon: TrendingUp, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-950/30" },
  { key: "focus", label: "Focus", icon: Target, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-950/30" },
  { key: "stress", label: "Stress", icon: AlertCircle, color: "text-violet-600 dark:text-violet-400", bg: "bg-violet-50 dark:bg-violet-950/30" },
  { key: "sleep", label: "Sleep", icon: Moon, color: "text-indigo-600 dark:text-indigo-400", bg: "bg-indigo-50 dark:bg-indigo-950/30" },
]

const labels = ["Very Low", "Low", "Medium", "High", "Very High"]

type DopamineValues = {
  mood: number; energy: number; motivation: number; focus: number; stress: number; sleep: number
}

const defaultValues: DopamineValues = { mood: 3, energy: 3, motivation: 3, focus: 3, stress: 3, sleep: 3 }

export function DopaminePanel() {
  const { entries, saveToday } = useDopamineStore()
  const today = format(new Date(), "yyyy-MM-dd")

  const weekDays = useMemo(() => {
    const start = startOfWeek(new Date(), { weekStartsOn: 1 })
    const end = endOfWeek(new Date(), { weekStartsOn: 1 })
    return eachDayOfInterval({ start, end })
  }, [])

  const [selectedDate, setSelectedDate] = useState(today)
  const [values, setValues] = useState<DopamineValues>(defaultValues)
  const [saved, setSaved] = useState(false)

  const selectedEntry = entries.find((e) => e.date === selectedDate)

  const handleDaySelect = (dateStr: string) => {
    setSelectedDate(dateStr)
    const entry = entries.find((e) => e.date === dateStr)
    if (entry) {
      setValues({ mood: entry.mood, energy: entry.energy, motivation: entry.motivation, focus: entry.focus, stress: entry.stress, sleep: entry.sleep })
    } else {
      setValues(defaultValues)
    }
    setSaved(false)
  }

  const setMetric = (key: keyof DopamineValues, val: number) => {
    setValues((p) => ({ ...p, [key]: val }))
  }

  const avg = (values.mood + values.energy + values.motivation + values.focus + values.stress + values.sleep) / 6
  const avgPct = (avg / 5) * 100
  const isLow = avgPct < 50

  const handleSave = () => {
    saveToday(values)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const history = [...entries].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 7)

  return (
    <div className="space-y-5">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-neutral-200/60 bg-white p-5 dark:border-neutral-800/60 dark:bg-neutral-950"
      >
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-neutral-600 dark:text-neutral-400" />
            <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-50">Daily Dopamine</h3>
          </div>
          <span className="text-xs text-neutral-400">Week of {format(weekDays[0], "MMM d")}</span>
        </div>

        <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
          {weekDays.map((d) => {
            const ds = format(d, "yyyy-MM-dd")
            const entry = entries.find((e) => e.date === ds)
            const isSelected = ds === selectedDate
            const isToday = ds === today
            return (
              <button
                key={ds}
                onClick={() => handleDaySelect(ds)}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-xl px-3 py-2 transition-all shrink-0 min-w-[52px]",
                  isSelected
                    ? "bg-neutral-900 text-white dark:bg-neutral-50 dark:text-neutral-900"
                    : "bg-neutral-50 text-neutral-500 hover:bg-neutral-100 dark:bg-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800"
                )}
              >
                <span className="text-[10px] font-medium uppercase">{format(d, "EEE")[0]}</span>
                <span className="text-sm font-semibold">{format(d, "d")}</span>
                {entry ? (
                  <div className={cn(
                    "h-1.5 w-1.5 rounded-full",
                    entry.average >= 4 ? "bg-emerald-500" : entry.average >= 2.5 ? "bg-amber-500" : "bg-red-500"
                  )} />
                ) : (
                  !isToday && <span className="h-1.5 w-1.5" />
                )}
                {isToday && !entry && <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />}
              </button>
            )
          })}
        </div>

        <div className="mb-5">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">
              {format(new Date(selectedDate), "EEEE, MMM d")}
              {selectedDate === today && <span className="ml-2 text-[10px] font-normal text-amber-500">Today</span>}
            </h4>
            {selectedEntry && (
              <span className="text-xs text-neutral-400">Avg: {selectedEntry.average.toFixed(1)}/5</span>
            )}
          </div>

          <div className="flex items-center gap-4 mb-4">
            <div className="relative flex h-16 w-16 items-center justify-center">
              <svg className="h-16 w-16 -rotate-90" viewBox="0 0 80 80">
                <circle cx="40" cy="40" r="34" fill="none" stroke="#e5e5e5" strokeWidth="5" className="dark:stroke-neutral-800" />
                <circle cx="40" cy="40" r="34" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round"
                  strokeDasharray={`${avgPct * 2.13} 213`}
                  className={cn(isLow ? "text-red-500" : "text-neutral-900 dark:text-neutral-50")} />
              </svg>
              <span className={cn("absolute text-lg font-bold", isLow ? "text-red-500" : "text-neutral-900 dark:text-neutral-50")}>
                {avg.toFixed(1)}
              </span>
            </div>
            <div>
              <p className={cn("text-sm font-semibold", isLow ? "text-red-500" : "text-neutral-900 dark:text-neutral-50")}>
                {isLow ? "Low Energy Day" : "Good Day"}
              </p>
              <div className="flex items-center gap-1 mt-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <span key={star} className={cn("text-sm", avg >= star ? (isLow ? "text-red-400" : "text-amber-400") : "text-neutral-200 dark:text-neutral-700")}>★</span>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {metrics.map((m) => {
              const val = values[m.key as keyof DopamineValues]
              return (
                <div key={m.key}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5">
                      <m.icon className={cn("h-3.5 w-3.5", m.color)} />
                      <span className="text-xs font-medium text-neutral-600 dark:text-neutral-400">{m.label}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className={cn("text-xs font-bold", m.color)}>{val}/5</span>
                      <span className="text-[10px] text-neutral-400">{labels[val - 1]}</span>
                    </div>
                  </div>
                  <div className="flex gap-1 sm:gap-1.5">
                    {[1, 2, 3, 4, 5].map((dot) => (
                      <button
                        key={dot}
                        onClick={() => setMetric(m.key as keyof DopamineValues, dot)}
                        className={cn(
                          "flex-1 h-11 sm:h-8 rounded-lg transition-all text-sm sm:text-xs",
                          dot <= val
                            ? `${m.bg} ${m.color}`
                            : "bg-neutral-100 text-neutral-300 dark:bg-neutral-800 dark:text-neutral-600"
                        )}
                      >
                        <span className="font-bold">{dot}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <button
          onClick={handleSave}
          className={cn(
            "w-full rounded-xl py-2.5 text-sm font-semibold transition-all",
            saved
              ? "bg-emerald-500 text-white"
              : "bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-neutral-50 dark:text-neutral-900 dark:hover:bg-neutral-200"
          )}
        >
          {saved ? "Saved!" : "Save Check-in"}
        </button>
      </motion.div>

      {history.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-neutral-200/60 bg-white p-5 dark:border-neutral-800/60 dark:bg-neutral-950"
        >
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-4 w-4 text-neutral-500" />
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">Recent History</h3>
          </div>

          <div className="space-y-2">
            {history.map((entry) => {
              const pct = (entry.average / 5) * 100
              const low = pct < 50
              return (
                <div key={entry.id} className="flex items-center gap-3 rounded-xl bg-neutral-50 p-3 dark:bg-neutral-900">
                  <div className={cn("relative flex h-10 w-10 items-center justify-center rounded-lg", low ? "bg-red-100 dark:bg-red-950/30" : "bg-neutral-200 dark:bg-neutral-700")}>
                    <span className={cn("text-xs font-bold", low ? "text-red-500" : "text-neutral-600 dark:text-neutral-400")}>
                      {entry.average.toFixed(1)}
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
                      {format(new Date(entry.date), "EEE, MMM d")}
                    </p>
                    <div className="flex items-center gap-1 mt-0.5">
                      {metrics.map((m) => {
                        const v = entry[m.key as keyof typeof entry] as number
                        return (
                          <span key={m.key} className={cn("h-2 w-2 rounded-full", v >= 4 ? "bg-neutral-900 dark:bg-neutral-50" : v >= 2 ? "bg-neutral-300 dark:bg-neutral-600" : "bg-neutral-200 dark:bg-neutral-700")} />
                        )
                      })}
                    </div>
                  </div>
                  <span className={cn("text-xs font-semibold", low ? "text-red-500" : "text-neutral-500")}>
                    {entry.average.toFixed(1)}
                  </span>
                </div>
              )
            })}
          </div>
        </motion.div>
      )}
    </div>
  )
}