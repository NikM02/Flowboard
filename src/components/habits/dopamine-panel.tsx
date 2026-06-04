"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Brain, Zap, Target, Heart, Moon, TrendingUp, AlertCircle } from "lucide-react"
import { cn } from "@/lib/shadcn-utils"
import { useDopamineStore } from "@/store/use-dopamine-store"
import { format } from "date-fns"

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

export function DopaminePanel() {
  const { getToday, saveToday, getHistory } = useDopamineStore()
  const todayEntry = getToday()

  const [values, setValues] = useState<DopamineValues>({
    mood: 3, energy: 3, motivation: 3, focus: 3, stress: 3, sleep: 3,
  })
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (todayEntry) {
      setValues({
        mood: todayEntry.mood,
        energy: todayEntry.energy,
        motivation: todayEntry.motivation,
        focus: todayEntry.focus,
        stress: todayEntry.stress,
        sleep: todayEntry.sleep,
      })
    }
  }, [todayEntry?.id])

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

  const history = getHistory().slice(0, 7)

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
          <span className="text-xs text-neutral-400">{format(new Date(), "EEEE, MMM d")}</span>
        </div>

        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex h-20 w-20 items-center justify-center">
            <svg className="h-20 w-20 -rotate-90" viewBox="0 0 80 80">
              <circle cx="40" cy="40" r="34" fill="none" stroke="#e5e5e5" strokeWidth="5" className="dark:stroke-neutral-800" />
              <circle cx="40" cy="40" r="34" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round"
                strokeDasharray={`${avgPct * 2.13} 213`}
                className={cn(isLow ? "text-red-500" : "text-neutral-900 dark:text-neutral-50")} />
            </svg>
            <span className={cn("absolute text-xl font-bold", isLow ? "text-red-500" : "text-neutral-900 dark:text-neutral-50")}>
              {avg.toFixed(1)}
            </span>
          </div>
          <div>
            <p className={cn("text-sm font-semibold", isLow ? "text-red-500" : "text-neutral-900 dark:text-neutral-50")}>
              {isLow ? "Low Energy Day" : "Good Day"}
            </p>
            <p className="text-xs text-neutral-400">Average out of 5</p>
            <div className="flex items-center gap-1 mt-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <span key={star} className={cn("text-sm", avg >= star ? (isLow ? "text-red-400" : "text-amber-400") : "text-neutral-200 dark:text-neutral-700")}>★</span>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {metrics.map((m) => {
            const val = values[m.key as keyof DopamineValues]
            const pct = (val / 5) * 100
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

        <button
          onClick={handleSave}
          className={cn(
            "mt-4 w-full rounded-xl py-2.5 text-sm font-semibold transition-all",
            saved
              ? "bg-emerald-500 text-white"
              : "bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-neutral-50 dark:text-neutral-900 dark:hover:bg-neutral-200"
          )}
        >
          {saved ? "Saved!" : "Save Today's Check-in"}
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
