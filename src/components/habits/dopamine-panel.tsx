"use client"

import { useState, useMemo } from "react"
import { motion } from "framer-motion"
import { Check } from "lucide-react"
import { cn } from "@/lib/shadcn-utils"
import { useDopamineStore } from "@/store/use-dopamine-store"
import { format, startOfWeek, endOfWeek, eachDayOfInterval } from "date-fns"

type MetricKey = "mood" | "energy" | "motivation" | "focus" | "stress" | "sleep"

type MetricConfig = {
  key: MetricKey
  label: string
  emojis: string[]
  colors: string[]
}

const metrics: MetricConfig[] = [
  { key: "mood", label: "Mood", emojis: ["😞", "😟", "😐", "🙂", "😄"], colors: ["text-red-500", "text-orange-500", "text-yellow-500", "text-lime-500", "text-emerald-500"] },
  { key: "energy", label: "Energy", emojis: ["🪫", "😴", "🙂", "💪", "⚡"], colors: ["text-red-500", "text-orange-500", "text-yellow-500", "text-lime-500", "text-emerald-500"] },
  { key: "motivation", label: "Drive", emojis: ["📉", "😑", "🤔", "🎯", "🔥"], colors: ["text-red-500", "text-orange-500", "text-yellow-500", "text-lime-500", "text-emerald-500"] },
  { key: "focus", label: "Focus", emojis: ["🌫️", "😵", "🙂", "🧠", "⚡"], colors: ["text-red-500", "text-orange-500", "text-yellow-500", "text-lime-500", "text-emerald-500"] },
  { key: "stress", label: "Stress", emojis: ["🧘", "😌", "😐", "😟", "😰"], colors: ["text-emerald-500", "text-lime-500", "text-yellow-500", "text-orange-500", "text-red-500"] },
  { key: "sleep", label: "Sleep", emojis: ["😵", "😴", "🙂", "😊", "💤"], colors: ["text-red-500", "text-orange-500", "text-yellow-500", "text-lime-500", "text-emerald-500"] },
]

type DopamineValues = Record<MetricKey, number>

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

  const setMetric = (key: MetricKey, val: number) => {
    setValues((p) => ({ ...p, [key]: val }))
  }

  const avg = (values.mood + values.energy + values.motivation + values.focus + values.stress + values.sleep) / 6
  const avgPct = (avg / 5) * 100

  const handleSave = () => {
    saveToday(values)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const history = [...entries].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 14)

  return (
    <div className="space-y-4">
      {/* Week Selector */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex gap-1.5 overflow-x-auto rounded-2xl bg-neutral-100/80 p-1.5 dark:bg-neutral-800/40"
      >
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
                "flex flex-col items-center gap-0.5 rounded-xl px-2 sm:px-3 py-1.5 transition-all shrink-0 min-w-[38px]",
                isSelected
                  ? "bg-white text-neutral-900 shadow-sm dark:bg-neutral-900 dark:text-neutral-50"
                  : "text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
              )}
            >
              <span className="text-[10px] font-medium uppercase">{format(d, "EEE")[0]}</span>
              <span className="text-xs font-semibold">{format(d, "d")}</span>
              {entry ? (
                <div className={cn(
                  "h-1 w-1 rounded-full",
                  entry.average >= 4 ? "bg-emerald-500" : entry.average >= 2.5 ? "bg-amber-500" : "bg-red-500"
                )} />
              ) : (
                isToday && <div className="h-1 w-1 rounded-full bg-amber-400 animate-pulse" />
              )}
            </button>
          )
        })}
      </motion.div>

      {/* Main Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="rounded-2xl border border-neutral-200/60 bg-white p-4 sm:p-5 dark:border-neutral-800/60 dark:bg-neutral-950"
      >
        {/* Header with average */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">
              {format(new Date(selectedDate), "EEE, MMM d")}
              {selectedDate === today && (
                <span className="ml-2 inline-flex items-center rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                  Today
                </span>
              )}
            </h3>
            {selectedEntry && (
              <p className="mt-0.5 text-xs text-neutral-400">
                Last checked in
              </p>
            )}
          </div>
          <div className="relative flex h-14 w-14 items-center justify-center">
            <svg className="h-14 w-14 -rotate-90" viewBox="0 0 56 56">
              <circle cx="28" cy="28" r="24" fill="none" stroke="#e5e5e5" strokeWidth="3" className="dark:stroke-neutral-800" />
              <circle
                cx="28" cy="28" r="24" fill="none"
                stroke="currentColor" strokeWidth="3" strokeLinecap="round"
                strokeDasharray={`${avgPct * 1.508} 150.8`}
                className={cn(avg >= 3.5 ? "text-emerald-500" : avg >= 2.5 ? "text-amber-500" : "text-red-500")}
              />
            </svg>
            <span className="absolute text-base font-bold text-neutral-900 dark:text-neutral-50">
              {avg.toFixed(1)}
            </span>
          </div>
        </div>

        {/* Emoji Metrics */}
        <div className="space-y-3">
          {metrics.map((m) => {
            const val = values[m.key]
            return (
              <div key={m.key}>
                <span className="mb-1.5 block text-[11px] font-medium text-neutral-500 dark:text-neutral-400">
                  {m.label}
                </span>
                <div className="flex gap-1.5">
                  {m.emojis.map((emoji, i) => {
                    const score = i + 1
                    const isActive = score === val
                    return (
                      <button
                        key={i}
                        onClick={() => setMetric(m.key, score)}
                        className={cn(
                          "flex flex-1 items-center justify-center rounded-xl py-2.5 text-lg transition-all",
                          isActive
                            ? "bg-neutral-900 shadow-sm scale-105 dark:bg-neutral-50 dark:text-neutral-900"
                            : "bg-neutral-50 hover:bg-neutral-100 dark:bg-neutral-900 dark:hover:bg-neutral-800"
                        )}
                        title={`${m.label}: ${score}/5`}
                      >
                        <span className={cn("transition-transform", isActive && "scale-110")}>
                          {emoji}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>

        {/* Save */}
        <button
          onClick={handleSave}
          className={cn(
            "mt-5 w-full flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition-all",
            saved
              ? "bg-emerald-500 text-white"
              : "bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-neutral-50 dark:text-neutral-900 dark:hover:bg-neutral-200"
          )}
        >
          {saved ? (
            <>
              <Check className="h-4 w-4" />
              Saved!
            </>
          ) : (
            "Save Check-in"
          )}
        </button>
      </motion.div>

      {/* Recent History */}
      {history.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl border border-neutral-200/60 bg-white p-4 sm:p-5 dark:border-neutral-800/60 dark:bg-neutral-950"
        >
          <h3 className="mb-3 text-sm font-semibold text-neutral-900 dark:text-neutral-50">Recent</h3>
          <div className="space-y-1.5">
            {history.map((entry) => {
              const low = entry.average < 2.5
              return (
                <div key={entry.id} className="flex items-center gap-3 rounded-xl px-3 py-2 hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors">
                  <span className="text-[11px] font-medium text-neutral-500 w-16 shrink-0 dark:text-neutral-400">
                    {format(new Date(entry.date), "EEE d")}
                  </span>
                  <div className="flex gap-1 flex-1">
                    {metrics.map((m) => {
                      const v = entry[m.key as MetricKey]
                      return (
                        <span key={m.key} className="text-sm" title={`${m.label}: ${v}/5`}>
                          {m.emojis[v - 1]}
                        </span>
                      )
                    })}
                  </div>
                  <span className={cn(
                    "text-xs font-bold w-6 text-right shrink-0",
                    low ? "text-red-500" : entry.average >= 4 ? "text-emerald-500" : "text-neutral-500 dark:text-neutral-400"
                  )}>
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
