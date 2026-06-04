"use client"

import { useMemo, useState } from "react"
import { motion } from "framer-motion"
import { FileDown, Trash2, BarChart3, Filter, List, Brain } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/shadcn-utils"
import { useHabitStore } from "@/store/use-habit-store"
import { useDopamineStore } from "@/store/use-dopamine-store"
import { format, parseISO } from "date-fns"
import * as XLSX from "xlsx"

const subTabs = [
  { key: "habits", label: "Habits", icon: List },
  { key: "dopamine", label: "Dopamine", icon: Brain },
] as const

export function HabitArchiveView() {
  const [subTab, setSubTab] = useState<"habits" | "dopamine">("habits")

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-neutral-200/60 bg-white p-5 dark:border-neutral-800/60 dark:bg-neutral-950"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-neutral-500" />
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">Archive</h3>
        </div>
        <div className="flex gap-1.5 rounded-xl bg-neutral-100/80 p-1 dark:bg-neutral-800/40">
          {subTabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setSubTab(t.key)}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all",
                subTab === t.key
                  ? "bg-white text-neutral-900 shadow-sm dark:bg-neutral-900 dark:text-neutral-50"
                  : "text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
              )}
            >
              <t.icon className="h-3 w-3" />{t.label}
            </button>
          ))}
        </div>
      </div>

      {subTab === "habits" && <HabitsArchive />}
      {subTab === "dopamine" && <DopamineArchive />}
    </motion.div>
  )
}

function HabitsArchive() {
  const { habits } = useHabitStore()
  const [filterHabitId, setFilterHabitId] = useState<string>("all")

  const allRecords = useMemo(() => {
    const records: { habitName: string; habitCategory: string; date: string; completed: string }[] = []
    const target = filterHabitId === "all" ? habits : habits.filter((h) => h.id === filterHabitId)
    for (const h of target) {
      for (const r of h.records) {
        records.push({ habitName: h.name, habitCategory: h.category, date: r.date, completed: r.completed ? "Yes" : "No" })
      }
    }
    return records.sort((a, b) => b.date.localeCompare(a.date))
  }, [habits, filterHabitId])

  const stats = useMemo(() => habits.map((h) => {
    const done = h.records.filter((r) => r.completed).length
    return { id: h.id, name: h.name, total: h.records.length, completed: done, rate: h.records.length ? Math.round((done / h.records.length) * 100) : 0 }
  }), [habits])

  const handleExport = () => {
    const ws = XLSX.utils.json_to_sheet(allRecords)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Habits")
    XLSX.writeFile(wb, `habit-archive-${format(new Date(), "yyyy-MM-dd")}.xlsx`)
  }

  const handleClean = () => {
    if (window.confirm("Clear all habit records? This cannot be undone.")) {
      const { habits: h, updateHabit } = useHabitStore.getState()
      h.forEach((x) => updateHabit(x.id, { records: [] }))
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <Select value={filterHabitId} onValueChange={setFilterHabitId}>
          <SelectTrigger aria-label="Filter by habit" className="h-8 w-40 text-xs rounded-xl">
            <Filter className="h-3 w-3 mr-1" /><SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Habits</SelectItem>
            {habits.map((h) => <SelectItem key={h.id} value={h.id}>{h.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" className="h-8 gap-1.5 rounded-xl text-xs" onClick={handleExport}>
            <FileDown className="h-3.5 w-3.5" />Export
          </Button>
          <Button size="sm" variant="outline" className="h-8 gap-1.5 rounded-xl text-xs text-red-500 border-red-200 hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-950" onClick={handleClean}>
            <Trash2 className="h-3.5 w-3.5" />Clean
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        {stats.map((s) => (
          <div key={s.id} className="rounded-xl bg-neutral-50 p-3 dark:bg-neutral-900">
            <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-50 truncate">{s.name}</p>
            <p className="text-lg font-bold text-neutral-900 dark:text-neutral-50 mt-1">{s.completed}/{s.total}</p>
            <Progress value={s.rate} className="h-1.5 mt-1.5" />
            <p className="text-[10px] text-neutral-400 mt-1">{s.rate}%</p>
          </div>
        ))}
      </div>

      <div className="max-h-96 overflow-y-auto overflow-x-auto">
        <div className="hidden sm:grid sm:grid-cols-4 gap-2 text-[10px] font-semibold text-neutral-400 uppercase tracking-wider px-2 py-1.5 border-b border-neutral-100 dark:border-neutral-800">
          <span>Date</span><span>Habit</span><span>Category</span><span className="text-center">Status</span>
        </div>
        {allRecords.length === 0 ? (
          <div className="flex items-center justify-center py-12 text-sm text-neutral-400">No habit records</div>
        ) : (
          <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
            {allRecords.map((r, i) => (
              <div key={i} className="grid grid-cols-2 sm:grid-cols-4 gap-2 px-2 py-2 text-xs text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-900/50">
                <span className="font-medium text-neutral-800 dark:text-neutral-200">{format(parseISO(r.date), "MMM d, yyyy")}</span>
                <span className="hidden sm:inline">{r.habitName}</span>
                <span className="capitalize hidden sm:inline">{r.habitCategory}</span>
                <span className={`text-right sm:text-center font-medium ${r.completed === "Yes" ? "text-emerald-600" : "text-red-400"}`}>{r.completed === "Yes" ? "✓" : "✗"}</span>
              </div>
            ))}
          </div>
        )}
      </div>
      <p className="text-[10px] text-neutral-400 mt-3 text-right">{allRecords.length} records</p>
    </div>
  )
}

function DopamineArchive() {
  const { getHistory, clearAll } = useDopamineStore()
  const entries = getHistory()

  const stats = useMemo(() => {
    if (entries.length === 0) return null
    const avg = entries.reduce((s, e) => s + e.average, 0) / entries.length
    return {
      total: entries.length,
      average: Math.round(avg * 10) / 10,
      best: Math.max(...entries.map((e) => e.average)),
      worst: Math.min(...entries.map((e) => e.average)),
    }
  }, [entries.length])

  const handleExport = () => {
    const data = entries.map((e) => ({
      date: e.date,
      mood: e.mood,
      energy: e.energy,
      motivation: e.motivation,
      focus: e.focus,
      stress: e.stress,
      sleep: e.sleep,
      average: e.average,
    }))
    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Dopamine")
    XLSX.writeFile(wb, `dopamine-archive-${format(new Date(), "yyyy-MM-dd")}.xlsx`)
  }

  const handleClean = () => {
    if (window.confirm("Clear all dopamine check-in records? This cannot be undone.")) {
      clearAll()
    }
  }

  const metricLabels: Record<string, string> = {
    mood: "Mood", energy: "Energy", motivation: "Motivation", focus: "Focus", stress: "Stress", sleep: "Sleep",
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div />
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" className="h-8 gap-1.5 rounded-xl text-xs" onClick={handleExport}>
            <FileDown className="h-3.5 w-3.5" />Export
          </Button>
          <Button size="sm" variant="outline" className="h-8 gap-1.5 rounded-xl text-xs text-red-500 border-red-200 hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-950" onClick={handleClean}>
            <Trash2 className="h-3.5 w-3.5" />Clean
          </Button>
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-4 gap-3 mb-5">
          <div className="rounded-xl bg-neutral-50 p-3 dark:bg-neutral-900">
            <p className="text-lg font-bold text-neutral-900 dark:text-neutral-50">{stats.total}</p>
            <p className="text-[10px] text-neutral-400">Check-ins</p>
          </div>
          <div className="rounded-xl bg-neutral-50 p-3 dark:bg-neutral-900">
            <p className="text-lg font-bold text-neutral-900 dark:text-neutral-50">{stats.average}</p>
            <p className="text-[10px] text-neutral-400">Avg Score</p>
          </div>
          <div className="rounded-xl bg-neutral-50 p-3 dark:bg-neutral-900">
            <p className="text-lg font-bold text-emerald-600">{stats.best}</p>
            <p className="text-[10px] text-neutral-400">Best</p>
          </div>
          <div className="rounded-xl bg-neutral-50 p-3 dark:bg-neutral-900">
            <p className="text-lg font-bold text-red-500">{stats.worst}</p>
            <p className="text-[10px] text-neutral-400">Worst</p>
          </div>
        </div>
      )}

      <div className="max-h-96 overflow-y-auto overflow-x-auto">
        <div className="grid grid-cols-8 gap-1 text-[10px] font-semibold text-neutral-400 uppercase tracking-wider px-2 py-1.5 border-b border-neutral-100 dark:border-neutral-800 min-w-[500px]">
          <span>Date</span>
          {["mood", "energy", "motivation", "focus", "stress", "sleep"].map((k) => (
            <span key={k} className="text-center">{metricLabels[k]}</span>
          ))}
          <span className="text-center">Avg</span>
        </div>
        {entries.length === 0 ? (
          <div className="flex items-center justify-center py-12 text-sm text-neutral-400">No dopamine check-ins yet</div>
        ) : (
          <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
            {entries.map((e) => (
              <div key={e.id} className="grid grid-cols-8 gap-1 px-2 py-2 text-xs text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-900/50">
                <span>{format(parseISO(e.date), "MMM d")}</span>
                {["mood", "energy", "motivation", "focus", "stress", "sleep"].map((k) => {
                  const v = e[k as keyof typeof e] as number
                  return <span key={k} className={`text-center font-medium ${v >= 4 ? "text-emerald-600" : v >= 2 ? "text-neutral-600 dark:text-neutral-400" : "text-red-400"}`}>{v}</span>
                })}
                <span className="text-center font-semibold text-neutral-800 dark:text-neutral-200">{e.average.toFixed(1)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
      <p className="text-[10px] text-neutral-400 mt-3 text-right">{entries.length} check-ins</p>
    </div>
  )
}
