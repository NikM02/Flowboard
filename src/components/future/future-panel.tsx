"use client"

import { useState, useMemo, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  TrendingUp, Target, CheckCircle2, Brain, Wallet, Archive, CalendarDays,
  Plus, Trash2, Pencil, Download, Sparkles, ArrowUp, ArrowDown, Minus,
} from "lucide-react"
import { cn } from "@/lib/shadcn-utils"
import { format, startOfMonth, endOfMonth, subMonths, startOfQuarter, endOfQuarter, subQuarters, startOfYear, endOfYear, subYears, isWithinInterval, parseISO } from "date-fns"
import { Button } from "@/components/ui/button"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { useTaskStore } from "@/store/use-task-store"
import { useHabitStore } from "@/store/use-habit-store"
import { useChallengeStore } from "@/store/use-challenge-store"
import { useDopamineStore } from "@/store/use-dopamine-store"
import { useSkillStore } from "@/store/use-skill-store"
import { useFinanceStore } from "@/store/use-finance-store"
import { useFutureStore } from "@/store/use-future-store"
import { CalendarTab } from "./future-calendar-tab"
import type { GrowthPeriod, GrowthCategory, FutureGoal } from "@/types"

const tabs: { key: "simulator" | "calendar" | "archive"; label: string; icon: typeof Target }[] = [
  { key: "simulator", label: "Growth", icon: TrendingUp },
  { key: "calendar", label: "Calendar", icon: CalendarDays },
  { key: "archive", label: "Archive", icon: Archive },
]

const categoryConfig: Record<GrowthCategory, { label: string; icon: typeof Brain; color: string }> = {
  tasks: { label: "Tasks", icon: CheckCircle2, color: "bg-blue-500" },
  habits: { label: "Habits", icon: Target, color: "bg-orange-500" },
  skills: { label: "Skills", icon: Sparkles, color: "bg-purple-500" },
  dopamine: { label: "Wellness", icon: Brain, color: "bg-emerald-500" },
  finance: { label: "Finance", icon: Wallet, color: "bg-rose-500" },
}

// ─── Growth Computation ───────────────────────────────────

type PeriodMetrics = Record<GrowthCategory, { value: number; label: string }>

function getPeriodRange(period: GrowthPeriod, date: Date): { start: Date; end: Date } {
  switch (period) {
    case "monthly":
      return { start: startOfMonth(date), end: endOfMonth(date) }
    case "quarterly":
      return { start: startOfQuarter(date), end: endOfQuarter(date) }
    case "yearly":
      return { start: startOfYear(date), end: endOfYear(date) }
  }
}

function computeMetrics(period: GrowthPeriod, date: Date): PeriodMetrics {
  const range = getPeriodRange(period, date)
  const { tasks } = useTaskStore.getState()
  const { habits } = useHabitStore.getState()
  const { challenges } = useChallengeStore.getState()
  const { entries } = useDopamineStore.getState()
  const { skills } = useSkillStore.getState()
  const { incomes, expenses, sips, stocks, mutualFunds } = useFinanceStore.getState()

  const start = range.start.getTime()
  const end = range.end.getTime()

  const inRange = (ts: number) => ts >= start && ts <= end
  const dateInRange = (d: string) => {
    const t = parseISO(d).getTime()
    return t >= start && t <= end
  }

  // Tasks
  const tasksInRange = tasks.filter((t) => inRange(t.createdAt) || (t.dueDate && dateInRange(t.dueDate)))
  const tasksCompleted = tasksInRange.filter((t) => t.completed).length
  const taskScore = tasksInRange.length > 0 ? Math.round((tasksCompleted / tasksInRange.length) * 100) : 0

  // Habits
  const habitRecordsInRange = habits.flatMap((h) =>
    h.records.filter((r) => dateInRange(r.date))
  )
  const habitCompleted = habitRecordsInRange.filter((r) => r.completed).length
  const habitTotal = habitRecordsInRange.length
  const habitScore = habitTotal > 0 ? Math.round((habitCompleted / habitTotal) * 100) : 0

  // Challenges
  const challengeDaysInRange = challenges.flatMap((c) =>
    c.days.filter((d) => dateInRange(d.date))
  )
  const challengeCompleted = challengeDaysInRange.filter((d) => d.completed).length
  const challengeTotal = challengeDaysInRange.length
  const challengeScore = challengeTotal > 0 ? Math.round((challengeCompleted / challengeTotal) * 100) : 0

  // Combine habits + challenges into "habits"
  const combinedHabitTotal = habitTotal + challengeTotal
  const combinedHabitCompleted = habitCompleted + challengeCompleted
  const finalHabitScore = combinedHabitTotal > 0 ? Math.round((combinedHabitCompleted / combinedHabitTotal) * 100) : 0

  // Skills
  const skillsInRange = skills.filter((s) => dateInRange(s.startDate) || dateInRange(s.endDate))
  const skillsCompleted = skillsInRange.filter((s) => s.completed).length
  const avgSkillProgress = skillsInRange.length > 0
    ? Math.round(skillsInRange.reduce((s, sk) => s + sk.progress, 0) / skillsInRange.length)
    : 0

  // Dopamine / Wellness
  const entriesInRange = entries.filter((e) => dateInRange(e.date))
  const avgWellness = entriesInRange.length > 0
    ? Math.round((entriesInRange.reduce((s, e) => s + e.average, 0) / entriesInRange.length) * 10) / 10
    : 0

  // Finance
  const incomeInRange = incomes.filter((i) => dateInRange(i.date)).reduce((s, i) => s + i.amount, 0)
  const expensesInRange = expenses.filter((e) => dateInRange(e.date)).reduce((s, e) => s + e.amount, 0)
  const netCashFlow = incomeInRange - expensesInRange
  const sipInvested = sips.reduce((s, si) => s + si.investedAmount, 0)
  const sipCurrent = sips.reduce((s, si) => s + si.currentValue, 0)
  const stockInvested = stocks.reduce((s, st) => s + st.buyPrice * st.quantity, 0)
  const stockCurrent = stocks.reduce((s, st) => s + st.currentPrice * st.quantity, 0)
  const mfInvested = mutualFunds.reduce((s, mf) => s + mf.investedAmount, 0)
  const mfCurrent = mutualFunds.reduce((s, mf) => s + mf.currentValue, 0)
  const totalCurrent = sipCurrent + stockCurrent + mfCurrent
  const totalInvested = sipInvested + stockInvested + mfInvested
  const gainPct = totalInvested > 0 ? Math.round(((totalCurrent - totalInvested) / totalInvested) * 100) : 0

  const hasFinanceData = incomes.length > 0 || expenses.length > 0 || sips.length > 0 || stocks.length > 0 || mutualFunds.length > 0
  const financeValue = hasFinanceData ? Math.max(0, 50 + gainPct + Math.round(netCashFlow / 1000)) : 0

  return {
    tasks: { value: taskScore, label: `${tasksCompleted}/${tasksInRange.length} tasks` },
    habits: { value: finalHabitScore, label: `${combinedHabitCompleted}/${combinedHabitTotal} check-ins` },
    skills: { value: avgSkillProgress, label: `${skillsCompleted} completed, ${skillsInRange.length - skillsCompleted} active` },
    dopamine: { value: Math.round(avgWellness * 20), label: `${entriesInRange.length} entries, avg ${avgWellness}/5` },
    finance: { value: financeValue, label: hasFinanceData ? `₹${netCashFlow.toLocaleString()} cash flow` : "No data" },
  }
}

function getPeriodLabel(period: GrowthPeriod, date: Date): string {
  switch (period) {
    case "monthly":
      return format(date, "MMMM yyyy")
    case "quarterly":
      const q = Math.floor(date.getMonth() / 3) + 1
      return `Q${q} ${format(date, "yyyy")}`
    case "yearly":
      return format(date, "yyyy")
  }
}

function getPeriodKey(period: GrowthPeriod, date: Date): string {
  switch (period) {
    case "monthly":
      return format(date, "yyyy-MM")
    case "quarterly":
      return `${format(date, "yyyy")}-Q${Math.floor(date.getMonth() / 3) + 1}`
    case "yearly":
      return format(date, "yyyy")
  }
}

function getPreviousDate(period: GrowthPeriod, date: Date): Date {
  switch (period) {
    case "monthly":
      return subMonths(date, 1)
    case "quarterly":
      return subQuarters(date, 1)
    case "yearly":
      return subYears(date, 1)
  }
}

// ─── Growth Simulator Tab ─────────────────────────────────

function SimulatorTab() {
  const [period, setPeriod] = useState<GrowthPeriod>("monthly")
  const [selectedDate, setSelectedDate] = useState(new Date())

  useEffect(() => {
    setSelectedDate(new Date())
  }, [])
  const [goalDialogOpen, setGoalDialogOpen] = useState(false)
  const [editGoalId, setEditGoalId] = useState<string | null>(null)
  const [goalForm, setGoalForm] = useState({ title: "", category: "tasks" as GrowthCategory, targetValue: 0, currentValue: 0 })

  const goals = useFutureStore((s) => s.goals)
  const { addGoal, updateGoal, deleteGoal, toggleGoalComplete } = useFutureStore()

  const currentMetrics = useMemo(() => computeMetrics(period, selectedDate), [period, selectedDate])
  const prevDate = getPreviousDate(period, selectedDate)
  const prevMetrics = useMemo(() => computeMetrics(period, prevDate), [period, prevDate])
  const currentLabel = getPeriodLabel(period, selectedDate)
  const prevLabel = getPeriodLabel(period, prevDate)

  const periodGoals = goals.filter((g) => g.period === period && g.periodKey === getPeriodKey(period, selectedDate))

  const handlePrev = () => setSelectedDate(getPreviousDate(period, selectedDate))
  const handleNext = () => {
    switch (period) {
      case "monthly":
        setSelectedDate((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1))
        break
      case "quarterly":
        setSelectedDate((d) => new Date(d.getFullYear(), d.getMonth() + 3, 1))
        break
      case "yearly":
        setSelectedDate((d) => new Date(d.getFullYear() + 1, 0, 1))
        break
    }
  }

  const canGoNext = () => {
    const next = (() => {
      switch (period) {
        case "monthly": return new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 1)
        case "quarterly": return new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 3, 1)
        case "yearly": return new Date(selectedDate.getFullYear() + 1, 0, 1)
      }
    })()
    return next <= new Date()
  }

  const handleGoalSubmit = () => {
    if (!goalForm.title.trim() || !goalForm.targetValue) return
    if (editGoalId) {
      updateGoal(editGoalId, goalForm)
    } else {
      addGoal({ ...goalForm, period, periodKey: getPeriodKey(period, selectedDate) })
    }
    setGoalForm({ title: "", category: "tasks", targetValue: 0, currentValue: 0 })
    setEditGoalId(null)
    setGoalDialogOpen(false)
  }

  const openGoalEdit = (g: FutureGoal) => {
    setEditGoalId(g.id)
    setGoalForm({ title: g.title, category: g.category, targetValue: g.targetValue, currentValue: g.currentValue })
    setGoalDialogOpen(true)
  }

  const overallGrowth = useMemo(() => {
    let total = 0
    let count = 0
    for (const cat of Object.keys(categoryConfig) as GrowthCategory[]) {
      const curr = currentMetrics[cat].value
      const prev = prevMetrics[cat].value
      if (prev > 0) {
        total += ((curr - prev) / prev) * 100
        count++
      }
    }
    return count > 0 ? Math.round(total / count) : 0
  }, [currentMetrics, prevMetrics])

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1 rounded-xl bg-neutral-100 p-1 dark:bg-neutral-800">
          {(["monthly", "quarterly", "yearly"] as const).map((p) => (
            <button
              key={p}
              onClick={() => { setPeriod(p); setSelectedDate(new Date()) }}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-medium transition-all capitalize",
                period === p
                  ? "bg-white text-neutral-900 shadow-sm dark:bg-neutral-900 dark:text-neutral-50"
                  : "text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
              )}
            >
              {p}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button onClick={handlePrev} className="rounded-lg px-2 py-1 text-sm text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800">&larr;</button>
          <span className="min-w-[140px] text-center text-sm font-medium text-neutral-900 dark:text-neutral-50">{currentLabel}</span>
          <button onClick={handleNext} disabled={!canGoNext()} className="rounded-lg px-2 py-1 text-sm text-neutral-500 hover:bg-neutral-100 disabled:opacity-30 dark:hover:bg-neutral-800">&rarr;</button>
        </div>
      </div>

      {/* Overall Growth Banner */}
      <div className={cn(
        "rounded-2xl border p-5 text-center",
        overallGrowth > 0
          ? "border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/30"
          : overallGrowth < 0
          ? "border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/30"
          : "border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900"
      )}>
        <p className="text-xs text-neutral-500 mb-1">Overall Growth vs {prevLabel}</p>
        <div className="flex items-center justify-center gap-2">
          {overallGrowth > 0 ? <ArrowUp className="h-5 w-5 text-green-500" /> : overallGrowth < 0 ? <ArrowDown className="h-5 w-5 text-red-500" /> : <Minus className="h-5 w-5 text-neutral-400" />}
          <span className={cn("text-3xl font-bold", overallGrowth > 0 ? "text-green-600" : overallGrowth < 0 ? "text-red-500" : "text-neutral-600")}>
            {overallGrowth > 0 ? "+" : ""}{overallGrowth}%
          </span>
        </div>
      </div>

      {/* Category Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {(Object.keys(categoryConfig) as GrowthCategory[]).map((cat) => {
          const cfg = categoryConfig[cat]
          const Icon = cfg.icon
          const curr = currentMetrics[cat]
          const prev = prevMetrics[cat]
          const diff = curr.value - prev.value
          const diffPct = prev.value > 0 ? Math.round((diff / prev.value) * 100) : 0
          return (
            <motion.div
              key={cat}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900"
            >
              <div className="flex items-center gap-2 mb-3">
                <div className={cn("flex h-7 w-7 items-center justify-center rounded-lg", cfg.color.replace("bg-", "bg-").replace("500", "100"), "text-" + cfg.color.match(/bg-(\w+)-/)?.[1])}>
                  <Icon className="h-3.5 w-3.5" />
                </div>
                <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">{cfg.label}</h3>
              </div>

              {/* Current period */}
              <div className="mb-3">
                <div className="flex items-end justify-between">
                  <span className="text-2xl font-bold text-neutral-900 dark:text-neutral-50">{curr.value}<span className="text-xs text-neutral-400 font-normal">%</span></span>
                  <div className="flex items-center gap-1 text-xs">
                    <span className={cn(diff > 0 ? "text-green-600" : diff < 0 ? "text-red-500" : "text-neutral-400")}>
                      {diff > 0 ? "+" : ""}{diffPct}%
                    </span>
                    {diff > 0 ? <ArrowUp className="h-3 w-3 text-green-500" /> : diff < 0 ? <ArrowDown className="h-3 w-3 text-red-500" /> : null}
                  </div>
                </div>
                <p className="text-xs text-neutral-500 mt-0.5">{curr.label}</p>
              </div>

              {/* Progress bar to target (goal if set, otherwise 100%) */}
              <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
                <motion.div
                  className={cn("absolute inset-y-0 left-0 rounded-full", curr.value >= 80 ? "bg-green-500" : curr.value >= 50 ? "bg-amber-500" : "bg-red-500")}
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(curr.value, 100)}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>

              {/* Previous period comparison */}
              <p className="text-xs text-neutral-400 mt-2">
                {prevLabel}: <span className="font-medium text-neutral-600 dark:text-neutral-300">{prev.value}%</span> &middot; {prev.label}
              </p>
            </motion.div>
          )
        })}
      </div>

      {/* Future Goals */}
      <div className="rounded-2xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-neutral-900 dark:text-neutral-50">Future Self Goals</h3>
            <p className="text-xs text-neutral-500">Set targets for {currentLabel}</p>
          </div>
          <Button size="sm" onClick={() => { setEditGoalId(null); setGoalForm({ title: "", category: "tasks", targetValue: 0, currentValue: 0 }); setGoalDialogOpen(true) }} className="gap-2">
            <Plus className="h-3.5 w-3.5" /> Add Goal
          </Button>
        </div>
        {periodGoals.length === 0 ? (
          <p className="text-sm text-neutral-400 text-center py-6">No goals set for this period. Add a goal to track your future self targets.</p>
        ) : (
          <div className="space-y-2">
            {periodGoals.map((g) => {
              const curVal = currentMetrics[g.category]?.value ?? 0
              const pct = g.targetValue > 0 ? Math.min(Math.round((curVal / g.targetValue) * 100), 100) : 0
              return (
                <div key={g.id} className={cn(
                  "flex items-center gap-3 rounded-xl border p-3 transition-all",
                  g.completed
                    ? "border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/30"
                    : "border-neutral-200 dark:border-neutral-800"
                )}>
                  <button
                    onClick={() => toggleGoalComplete(g.id)}
                    className={cn(
                      "shrink-0 rounded-full border-2 w-5 h-5 flex items-center justify-center transition-all",
                      g.completed ? "border-green-500 bg-green-500" : "border-neutral-300 dark:border-neutral-600"
                    )}
                  >
                    {g.completed && <CheckCircle2 className="h-3 w-3 text-white" />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={cn("text-sm font-medium", g.completed ? "text-green-700 line-through dark:text-green-300" : "text-neutral-900 dark:text-neutral-50")}>
                        {g.title}
                      </span>
                      <span className={cn("text-xs rounded px-1.5 py-0.5 font-medium", g.completed ? "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300" : "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400")}>
                        {categoryConfig[g.category].label}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-neutral-500">Target: {g.targetValue}%</span>
                      <span className="text-xs text-neutral-300">|</span>
                      <span className="text-xs text-neutral-500">Current: {curVal}%</span>
                      <div className="flex-1 max-w-[120px]">
                        <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
                          <motion.div
                            className={cn("absolute inset-y-0 left-0 rounded-full", pct >= 100 ? "bg-green-500" : "bg-neutral-900 dark:bg-neutral-50")}
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ duration: 0.4 }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => openGoalEdit(g)} className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 dark:hover:bg-neutral-800">
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => deleteGoal(g.id)} className="rounded-lg p-1.5 text-neutral-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/50">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Goal Dialog */}
      <Dialog open={goalDialogOpen} onOpenChange={setGoalDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{editGoalId ? "Edit" : "Add"} Goal</DialogTitle>
            <DialogDescription>Set a target for your future self</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="goal-title">Title</Label>
              <Input id="goal-title" value={goalForm.title} onChange={(e) => setGoalForm({ ...goalForm, title: e.target.value })} placeholder="e.g. Complete 80% of tasks" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="goal-category">Category</Label>
              <Select value={goalForm.category} onValueChange={(v) => setGoalForm({ ...goalForm, category: v as GrowthCategory })}>
                <SelectTrigger id="goal-category"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(categoryConfig) as GrowthCategory[]).map((c) => (
                    <SelectItem key={c} value={c}>{categoryConfig[c].label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="goal-target">Target value (%)</Label>
              <Input id="goal-target" type="number" min={0} max={100} value={goalForm.targetValue || ""} onChange={(e) => setGoalForm({ ...goalForm, targetValue: Number(e.target.value) })} />
            </div>
            <Button className="w-full" onClick={handleGoalSubmit} disabled={!goalForm.title.trim() || !goalForm.targetValue}>
              {editGoalId ? "Save Goal" : "Add Goal"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ─── Archive Tab ──────────────────────────────────────────

function ArchiveTab() {
  const { goals, clearAll } = useFutureStore()
  const [subTab, setSubTab] = useState<"goals" | "snapshots">("goals")

  const handleExport = async () => {
    const data = goals.map((g) => ({
      Title: g.title,
      Category: categoryConfig[g.category].label,
      Period: g.period,
      "Period Key": g.periodKey,
      "Target (%)": g.targetValue,
      Completed: g.completed ? "Yes" : "No",
    }))
    const XLSX = await import("xlsx")
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data), "Goals")
    XLSX.writeFile(wb, "future-self-goals.xlsx")
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2 border-b border-neutral-200 dark:border-neutral-800">
        {(["goals", "snapshots"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setSubTab(t)}
            className={cn(
              "pb-2 text-sm font-medium transition-colors border-b-2 -mb-[1px] capitalize",
              subTab === t
                ? "border-neutral-900 text-neutral-900 dark:border-neutral-50 dark:text-neutral-50"
                : "border-transparent text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {subTab === "goals" ? (
        <div className="space-y-3">
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleExport} className="gap-2">
              <Download className="h-3.5 w-3.5" /> Export .xlsx
            </Button>
            <Button variant="outline" size="sm" onClick={clearAll} className="gap-2 text-red-500 hover:text-red-600">
              <Trash2 className="h-3.5 w-3.5" /> Clear All
            </Button>
          </div>
          {goals.length === 0 ? (
            <p className="text-sm text-neutral-400 py-8 text-center">No goals archived</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-neutral-200 dark:border-neutral-800 text-left text-xs text-neutral-500">
                    <th className="pb-2 font-medium">Title</th>
                    <th className="pb-2 font-medium">Category</th>
                    <th className="pb-2 font-medium">Period</th>
                    <th className="pb-2 font-medium">Target</th>
                    <th className="pb-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {goals.map((g) => (
                    <tr key={g.id} className="border-b border-neutral-100 dark:border-neutral-800/50">
                      <td className="py-2 font-medium text-neutral-900 dark:text-neutral-50">{g.title}</td>
                      <td className="py-2"><span className="rounded bg-neutral-100 px-2 py-0.5 text-xs dark:bg-neutral-800">{categoryConfig[g.category].label}</span></td>
                      <td className="py-2 text-neutral-500">{g.periodKey}</td>
                      <td className="py-2 text-neutral-500">{g.targetValue}%</td>
                      <td className="py-2">
                        <span className={cn("rounded px-2 py-0.5 text-xs font-medium", g.completed ? "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300" : "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400")}>
                          {g.completed ? "Done" : "Active"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-neutral-200 py-16 dark:border-neutral-800">
          <Sparkles className="mb-3 h-10 w-10 text-neutral-300 dark:text-neutral-600" />
          <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Growth snapshots coming soon</p>
          <p className="text-xs text-neutral-400 mt-1">Auto-snapshots will be saved each period</p>
        </div>
      )}
    </div>
  )
}

// ─── Main Panel ───────────────────────────────────────────

export function FuturePanel() {
  const [tab, setTab] = useState<"simulator" | "calendar" | "archive">("simulator")

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">
          Future Self
        </h1>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          Compare your growth across all areas — monthly, quarterly, and yearly
        </p>
      </div>

      <div className="mb-6 flex gap-1 rounded-xl bg-neutral-100 p-1 dark:bg-neutral-800 overflow-x-auto">
        {tabs.map((t) => {
          const Icon = t.icon
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200",
                tab === t.key
                  ? "bg-white text-neutral-900 shadow-sm dark:bg-neutral-900 dark:text-neutral-50"
                  : "text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
              )}
            >
              <Icon className="h-4 w-4" />
              {t.label}
            </button>
          )
        })}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
        >
          {tab === "simulator" && <SimulatorTab />}
          {tab === "calendar" && <CalendarTab />}
          {tab === "archive" && <ArchiveTab />}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
