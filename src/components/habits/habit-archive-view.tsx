"use client"

import { useMemo, useState } from "react"
import { motion } from "framer-motion"
import { FileDown, Trash2, BarChart3, Filter, List, Brain, Moon, Target } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/shadcn-utils"
import { useHabitStore } from "@/store/use-habit-store"
import { useDopamineStore } from "@/store/use-dopamine-store"
import { useSleepStore } from "@/store/use-sleep-store"
import { useChallengeStore } from "@/store/use-challenge-store"
import { format, parseISO } from "date-fns"
import * as XLSX from "xlsx"

const subTabs = [
  { key: "habits", label: "Habits", icon: List },
  { key: "dopamine", label: "Dopamine", icon: Brain },
  { key: "sleep", label: "Sleep", icon: Moon },
  { key: "challenges", label: "Challenges", icon: Target },
] as const

export function HabitArchiveView() {
  const [subTab, setSubTab] = useState<"habits" | "dopamine" | "sleep" | "challenges">("habits")

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      className="card-modern glass rounded-2xl p-5"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-neutral-500" />
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">Archive</h3>
        </div>
        <div className="flex gap-1.5 overflow-x-auto rounded-xl bg-neutral-100/80 p-1 dark:bg-neutral-800/40">
          {subTabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setSubTab(t.key)}
              className={cn(
                "flex min-h-10 items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium whitespace-nowrap transition-all shrink-0",
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
      {subTab === "sleep" && <SleepArchive />}
      {subTab === "challenges" && <ChallengeArchive />}
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
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <Select value={filterHabitId} onValueChange={setFilterHabitId}>
          <SelectTrigger aria-label="Filter by habit" className="h-9 w-full rounded-xl text-xs sm:w-44">
            <Filter className="h-3 w-3 mr-1" /><SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Habits</SelectItem>
            {habits.map((h) => <SelectItem key={h.id} value={h.id}>{h.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" className="h-9 gap-1.5 rounded-xl px-3 text-xs" onClick={handleExport}>
            <FileDown className="h-3.5 w-3.5" />Export
          </Button>
          <Button size="sm" variant="outline" className="h-9 gap-1.5 rounded-xl px-3 text-xs text-red-500 border-red-200 hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-950" onClick={handleClean}>
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
              <div key={i} className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-2 gap-y-0.5 px-2 py-2 text-xs text-neutral-600 sm:grid-cols-4 sm:gap-2 hover:bg-neutral-50 dark:text-neutral-400 dark:hover:bg-neutral-900/50">
                <div className="min-w-0">
                  <span className="block font-medium text-neutral-800 dark:text-neutral-200">{format(parseISO(r.date), "MMM d, yyyy")}</span>
                  <span className="block truncate text-[11px] text-neutral-400 sm:hidden">
                    {r.habitName} <span className="capitalize">· {r.habitCategory}</span>
                  </span>
                </div>
                <span className="hidden sm:inline">{r.habitName}</span>
                <span className="hidden capitalize sm:inline">{r.habitCategory}</span>
                <span className={`text-right font-medium sm:text-center ${r.completed === "Yes" ? "text-emerald-600" : "text-red-400"}`}>{r.completed === "Yes" ? "✓" : "✗"}</span>
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
  const { entries, clearAll } = useDopamineStore()

  const handleExport = () => {
    const data = entries.map((e) => ({ date: e.date }))
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

  const sorted = [...entries].sort((a, b) => b.date.localeCompare(a.date))

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div />
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" className="h-9 gap-1.5 rounded-xl px-3 text-xs" onClick={handleExport}>
            <FileDown className="h-3.5 w-3.5" />Export
          </Button>
          <Button size="sm" variant="outline" className="h-9 gap-1.5 rounded-xl px-3 text-xs text-red-500 border-red-200 hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-950" onClick={handleClean}>
            <Trash2 className="h-3.5 w-3.5" />Clean
          </Button>
        </div>
      </div>

      <div className="rounded-xl bg-neutral-50 p-3 dark:bg-neutral-900 mb-4">
        <p className="text-lg font-bold text-neutral-900 dark:text-neutral-50">{entries.length}</p>
        <p className="text-[10px] text-neutral-400">Total check-ins</p>
      </div>

      <div className="max-h-96 overflow-y-auto">
        {sorted.length === 0 ? (
          <div className="flex items-center justify-center py-12 text-sm text-neutral-400">No check-ins yet</div>
        ) : (
          <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
            {sorted.map((e) => (
              <div key={e.id} className="flex items-center gap-3 px-2 py-2 text-xs text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-900/50">
                <span className="font-medium text-neutral-800 dark:text-neutral-200">{format(parseISO(e.date), "EEE, MMM d, yyyy")}</span>
                <span className="ml-auto text-emerald-600 font-medium">✓ Checked in</span>
              </div>
            ))}
          </div>
        )}
      </div>
      <p className="text-[10px] text-neutral-400 mt-3 text-right">{entries.length} records</p>
    </div>
  )
}

function SleepArchive() {
  const { entries, getStats, deleteEntry } = useSleepStore()

  const handleExport = () => {
    const data = entries.map((e) => ({
      Date: e.date,
      Bedtime: e.bedtime,
      Wake: e.wakeTime,
      Hours: e.hours,
      Quality: `${e.quality}/5`,
      Notes: e.notes || "",
    }))
    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Sleep")
    XLSX.writeFile(wb, `sleep-archive-${format(new Date(), "yyyy-MM-dd")}.xlsx`)
  }

  const handleClean = () => {
    if (window.confirm("Clear all sleep records? This cannot be undone.")) {
      const store = useSleepStore.getState()
      store.entries.forEach((e) => deleteEntry(e.id))
    }
  }

  const stats = getStats()
  const sorted = [...entries].sort((a, b) => b.date.localeCompare(a.date))

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" className="h-9 gap-1.5 rounded-xl px-3 text-xs" onClick={handleExport}>
            <FileDown className="h-3.5 w-3.5" />Export
          </Button>
          <Button size="sm" variant="outline" className="h-9 gap-1.5 rounded-xl px-3 text-xs text-red-500 border-red-200 hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-950" onClick={handleClean}>
            <Trash2 className="h-3.5 w-3.5" />Clean
          </Button>
        </div>
      </div>

      <div className="mb-5 grid grid-cols-3 gap-3">
        <div className="min-w-0 rounded-xl bg-neutral-50 p-3 dark:bg-neutral-900">
          <p className="truncate text-lg font-bold text-neutral-900 dark:text-neutral-50">{stats.avgHours || 0}h</p>
          <p className="truncate text-[10px] text-neutral-400">Avg hrs (30d)</p>
        </div>
        <div className="min-w-0 rounded-xl bg-neutral-50 p-3 dark:bg-neutral-900">
          <p className="truncate text-lg font-bold text-neutral-900 dark:text-neutral-50">{stats.avgQuality || 0}/5</p>
          <p className="truncate text-[10px] text-neutral-400">Avg quality</p>
        </div>
        <div className="min-w-0 rounded-xl bg-neutral-50 p-3 dark:bg-neutral-900">
          <p className="truncate text-lg font-bold text-neutral-900 dark:text-neutral-50">{entries.length}</p>
          <p className="truncate text-[10px] text-neutral-400">Nights</p>
        </div>
      </div>

      <div className="max-h-96 overflow-y-auto">
        {sorted.length === 0 ? (
          <div className="flex items-center justify-center py-12 text-sm text-neutral-400">No sleep records yet</div>
        ) : (
          <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
            {sorted.map((e) => (
              <div key={e.id} className="flex items-center gap-3 px-2 py-2 text-xs text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-900/50">
                <span className="font-medium text-neutral-800 dark:text-neutral-200">{format(parseISO(e.date), "EEE, MMM d, yyyy")}</span>
                <span className="ml-auto inline-flex items-center gap-2">
                  <span className="text-neutral-400">{e.bedtime} → {e.wakeTime}</span>
                  <span className="font-semibold text-blue-600 dark:text-blue-400">{e.hours}h</span>
                  <span className="hidden sm:inline text-amber-500">{"★".repeat(e.quality)}{"☆".repeat(5 - e.quality)}</span>
                  {e.notes && <span className="hidden md:inline text-neutral-400">{e.notes}</span>}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
      <p className="text-[10px] text-neutral-400 mt-3 text-right">{entries.length} records</p>
    </div>
  )
}

function ChallengeArchive() {
  const { challenges, deleteChallenge, getProgress } = useChallengeStore()

  const handleExport = () => {
    const rows: { Challenge: string; Type: string; Day: number; Date: string; Completed: string; Note: string }[] = []
    for (const c of challenges) {
      for (const d of c.days) {
        rows.push({ Challenge: c.title, Type: `${c.type}-day`, Day: d.day, Date: d.date, Completed: d.completed ? "Yes" : "No", Note: d.note || "" })
      }
    }
    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Challenges")
    XLSX.writeFile(wb, `challenges-archive-${format(new Date(), "yyyy-MM-dd")}.xlsx`)
  }

  const handleClean = () => {
    if (window.confirm("Delete all challenges? This cannot be undone.")) {
      const store = useChallengeStore.getState()
      store.challenges.forEach((c) => deleteChallenge(c.id))
    }
  }

  if (challenges.length === 0) {
    return (
      <div>
        <div className="flex items-center justify-between mb-4">
          <div />
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" className="h-9 gap-1.5 rounded-xl px-3 text-xs" onClick={handleExport} disabled>
              <FileDown className="h-3.5 w-3.5" />Export
            </Button>
          </div>
        </div>
        <div className="flex items-center justify-center py-12 text-sm text-neutral-400">No challenges yet</div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div />
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" className="h-9 gap-1.5 rounded-xl px-3 text-xs" onClick={handleExport}>
            <FileDown className="h-3.5 w-3.5" />Export
          </Button>
          <Button size="sm" variant="outline" className="h-9 gap-1.5 rounded-xl px-3 text-xs text-red-500 border-red-200 hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-950" onClick={handleClean}>
            <Trash2 className="h-3.5 w-3.5" />Clean
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {challenges.map((c) => {
          const done = c.days.filter((d) => d.completed).length
          const pct = getProgress(c.id)
          return (
            <div key={c.id} className="rounded-xl border border-neutral-200/60 bg-white p-3.5 dark:border-neutral-800/60 dark:bg-neutral-900">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">{c.title}</span>
                <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-bold text-violet-600 dark:bg-violet-950/40 dark:text-violet-400">{c.type}-day</span>
                {c.joined && <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">Joined</span>}
                <span className="ml-auto text-xs text-neutral-400">{format(parseISO(c.startDate), "MMM d")} → {format(parseISO(c.endDate), "MMM d, yyyy")}</span>
              </div>
              <div className="mt-2 flex items-center gap-3">
                <Progress value={pct} className="h-1.5" />
                <span className="shrink-0 text-[10px] font-semibold text-neutral-500">{done}/{c.days.length} · {pct}%</span>
              </div>
              <div className="mt-2 flex flex-wrap gap-1">
                {c.days.map((d) => (
                  <span
                    key={d.day}
                    title={`Day ${d.day} · ${d.date}${d.note ? ` · ${d.note}` : ""}`}
                    className={cn(
                      "flex h-5 w-5 items-center justify-center rounded-md text-[9px] font-bold",
                      d.completed ? "bg-green-500 text-white" : "bg-neutral-100 text-neutral-400 dark:bg-neutral-800"
                    )}
                  >
                    {d.day}
                  </span>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
