"use client"

import { useState, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from "recharts"
import {
  TrendingUp, Target, CheckCircle2, Brain, Wallet, Archive,
  Plus, Trash2, Pencil, Download, Sparkles, ArrowUp, ArrowDown, Minus,
} from "lucide-react"
import { cn } from "@/lib/shadcn-utils"
import {
  ChartTooltip, ChartGlow,
  CHART_GRID_STYLES, CHART_AXIS_STYLES, CHART_CURSOR_STYLES,
} from "@/components/charts/chart-components"
import { format, startOfMonth, endOfMonth, subMonths, startOfQuarter, endOfQuarter, subQuarters, startOfYear, endOfYear, subYears, parseISO } from "date-fns"
import { Button } from "@/components/ui/button"
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
import type { GrowthPeriod, GrowthCategory, FutureGoal } from "@/types"

const tabs: { key: "simulator" | "archive"; label: string; icon: typeof Target }[] = [
  { key: "simulator", label: "Growth", icon: TrendingUp },
  { key: "archive", label: "Archive", icon: Archive },
]

const categoryConfig: Record<GrowthCategory, { label: string; icon: typeof Brain; color: string; hex: string }> = {
  tasks: { label: "Tasks", icon: CheckCircle2, color: "bg-neutral-700", hex: "#404040" },
  habits: { label: "Habits", icon: Target, color: "bg-neutral-500", hex: "#737373" },
  skills: { label: "Skills", icon: Sparkles, color: "bg-neutral-600", hex: "#525252" },
  dopamine: { label: "Wellness", icon: Brain, color: "bg-neutral-400", hex: "#a3a3a3" },
  finance: { label: "Finance", icon: Wallet, color: "bg-neutral-800", hex: "#262626" },
}

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
  const dateInRange = (d: string) => { const t = parseISO(d).getTime(); return t >= start && t <= end }

  const tasksInRange = tasks.filter((t) => inRange(t.createdAt) || (t.dueDate && dateInRange(t.dueDate)))
  const tasksCompleted = tasksInRange.filter((t) => t.completed).length
  const taskScore = tasksInRange.length > 0 ? Math.round((tasksCompleted / tasksInRange.length) * 100) : 0

  const habitRecords = habits.flatMap((h) => h.records.filter((r) => dateInRange(r.date)))
  const challengeDays = challenges.flatMap((c) => c.days.filter((d) => dateInRange(d.date)))
  const habitTotal = habitRecords.length + challengeDays.length
  const habitCompleted = habitRecords.filter((r) => r.completed).length + challengeDays.filter((d) => d.completed).length
  const habitScore = habitTotal > 0 ? Math.round((habitCompleted / habitTotal) * 100) : 0

  const skillsInRange = skills.filter((s) => dateInRange(s.startDate) || dateInRange(s.endDate))
  const skillsCompleted = skillsInRange.filter((s) => s.completed).length
  const avgSkillProgress = skillsInRange.length > 0
    ? Math.round(skillsInRange.reduce((s, sk) => s + sk.progress, 0) / skillsInRange.length) : 0

  const entriesInRange = entries.filter((e) => dateInRange(e.date))
  const checkInCount = entriesInRange.length

  const incomeInRange = incomes.filter((i) => dateInRange(i.date)).reduce((s, i) => s + i.amount, 0)
  const expensesInRange = expenses.filter((e) => dateInRange(e.date)).reduce((s, e) => s + e.amount, 0)
  const netCashFlow = incomeInRange - expensesInRange
  const totalInvested = sips.reduce((s, si) => s + si.investedAmount, 0) + stocks.reduce((s, st) => s + st.buyPrice * st.quantity, 0) + mutualFunds.reduce((s, mf) => s + mf.investedAmount, 0)
  const totalCurrent = sips.reduce((s, si) => s + si.currentValue, 0) + stocks.reduce((s, st) => s + st.currentPrice * st.quantity, 0) + mutualFunds.reduce((s, mf) => s + mf.currentValue, 0)
  const gainPct = totalInvested > 0 ? Math.round(((totalCurrent - totalInvested) / totalInvested) * 100) : 0
  const hasFinanceData = incomes.length > 0 || expenses.length > 0 || sips.length > 0 || stocks.length > 0 || mutualFunds.length > 0
  const financeValue = hasFinanceData ? Math.max(0, 50 + gainPct + Math.round(netCashFlow / 1000)) : 0

  return {
    tasks: { value: taskScore, label: `${tasksCompleted}/${tasksInRange.length} done` },
    habits: { value: habitScore, label: `${habitCompleted}/${habitTotal} check-ins` },
    skills: { value: avgSkillProgress, label: `${skillsCompleted} done, ${skillsInRange.length - skillsCompleted} active` },
    dopamine: { value: Math.min(100, checkInCount * 10), label: `${checkInCount} check-ins` },
    finance: { value: financeValue, label: hasFinanceData ? `₹${netCashFlow.toLocaleString()} flow` : "No data" },
  }
}

function getPeriodLabel(period: GrowthPeriod, date: Date): string {
  switch (period) {
    case "monthly": return format(date, "MMMM yyyy")
    case "quarterly": return `Q${Math.floor(date.getMonth() / 3) + 1} ${format(date, "yyyy")}`
    case "yearly": return format(date, "yyyy")
  }
}

function getPeriodKey(period: GrowthPeriod, date: Date): string {
  switch (period) {
    case "monthly": return format(date, "yyyy-MM")
    case "quarterly": return `${format(date, "yyyy")}-Q${Math.floor(date.getMonth() / 3) + 1}`
    case "yearly": return format(date, "yyyy")
  }
}

function getPreviousDate(period: GrowthPeriod, date: Date): Date {
  switch (period) {
    case "monthly": return subMonths(date, 1)
    case "quarterly": return subQuarters(date, 1)
    case "yearly": return subYears(date, 1)
  }
}

function SimulatorTab() {
  const [period, setPeriod] = useState<GrowthPeriod>("monthly")
  const [selectedDate, setSelectedDate] = useState(() => new Date())
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
      case "monthly": setSelectedDate((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1)); break
      case "quarterly": setSelectedDate((d) => new Date(d.getFullYear(), d.getMonth() + 3, 1)); break
      case "yearly": setSelectedDate((d) => new Date(d.getFullYear() + 1, 0, 1)); break
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
    if (editGoalId) updateGoal(editGoalId, goalForm)
    else addGoal({ ...goalForm, period, periodKey: getPeriodKey(period, selectedDate) })
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
    let total = 0, count = 0
    for (const cat of Object.keys(categoryConfig) as GrowthCategory[]) {
      const curr = currentMetrics[cat].value, prev = prevMetrics[cat].value
      if (prev > 0) { total += ((curr - prev) / prev) * 100; count++ }
    }
    return count > 0 ? Math.round(total / count) : 0
  }, [currentMetrics, prevMetrics])

  // Chart data
  const radarData = useMemo(() =>
    (Object.keys(categoryConfig) as GrowthCategory[]).map((cat) => ({
      category: categoryConfig[cat].label,
      current: currentMetrics[cat].value,
      previous: prevMetrics[cat].value,
      fullMark: 100,
    })),
    [currentMetrics, prevMetrics]
  )

  const barData = useMemo(() =>
    (Object.keys(categoryConfig) as GrowthCategory[]).map((cat) => ({
      name: categoryConfig[cat].label,
      current: currentMetrics[cat].value,
      previous: prevMetrics[cat].value,
      color: categoryConfig[cat].hex,
    })),
    [currentMetrics, prevMetrics]
  )

  return (
    <div className="space-y-6">
      {/* Period selector + nav */}
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
            >{p}</button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handlePrev} className="rounded-lg px-2 py-1 text-sm text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800">&larr;</button>
          <span className="min-w-[140px] text-center text-sm font-medium text-neutral-900 dark:text-neutral-50">{currentLabel}</span>
          <button onClick={handleNext} disabled={!canGoNext()} className="rounded-lg px-2 py-1 text-sm text-neutral-500 hover:bg-neutral-100 disabled:opacity-30 dark:hover:bg-neutral-800">&rarr;</button>
        </div>
      </div>

      {/* Overall Growth Banner */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          "relative overflow-hidden rounded-3xl border p-6 text-center",
          overallGrowth > 0
            ? "border-green-200 bg-gradient-to-br from-green-50 to-emerald-50/50 dark:border-green-900/40 dark:from-green-950/30 dark:to-emerald-950/20"
            : overallGrowth < 0
            ? "border-red-200 bg-gradient-to-br from-red-50 to-rose-50/50 dark:border-red-900/40 dark:from-red-950/30 dark:to-rose-950/20"
            : "border-neutral-200 bg-gradient-to-br from-neutral-50 to-white dark:border-neutral-800 dark:from-neutral-900 dark:to-neutral-900"
        )}
      >
        <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400">Overall Growth vs {prevLabel}</p>
        <div className="mt-2 flex items-center justify-center gap-2">
          {overallGrowth > 0 ? <ArrowUp className="h-5 w-5 text-green-500" /> : overallGrowth < 0 ? <ArrowDown className="h-5 w-5 text-red-500" /> : <Minus className="h-5 w-5 text-neutral-400" />}
          <span className={cn("text-4xl font-bold tracking-tight", overallGrowth > 0 ? "text-green-600 dark:text-green-400" : overallGrowth < 0 ? "text-red-500 dark:text-red-400" : "text-neutral-600 dark:text-neutral-400")}>
            {overallGrowth > 0 ? "+" : ""}{overallGrowth}%
          </span>
        </div>
      </motion.div>

      {/* Charts Row */}
      <div className="grid gap-5 lg:grid-cols-2">
        {/* Radar Chart */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="card-modern glass rounded-3xl p-5"
        >
          <h3 className="text-xs font-bold uppercase tracking-widest text-neutral-500 dark:text-neutral-400">Growth Radar</h3>
          <p className="mt-0.5 text-[11px] text-neutral-400/70 dark:text-neutral-500/70">Current vs Previous period</p>
          <div className="mt-4 h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="72%">
                <ChartGlow id="future-radar-glow" />
                <PolarGrid stroke="#a3a3a3" strokeOpacity={0.25} />
                <PolarAngleAxis dataKey="category" tick={{ fontSize: 11, fill: "#a3a3a3" }} />
                <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} axisLine={false} />
                <Radar name="Previous" dataKey="previous" stroke="#a3a3a3" fill="#a3a3a3" fillOpacity={0.12} strokeWidth={1.5} strokeDasharray="4 4" />
                <Radar name="Current" dataKey="current" stroke="#404040" fill="#404040" fillOpacity={0.22} strokeWidth={2.5} style={{ filter: "url(#future-radar-glow)" }} />
                <Tooltip content={<ChartTooltip formatter={(v) => `${v}%`} />} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Bar Chart */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card-modern glass rounded-3xl p-5"
        >
          <h3 className="text-xs font-bold uppercase tracking-widest text-neutral-500 dark:text-neutral-400">Category Comparison</h3>
          <p className="mt-0.5 text-[11px] text-neutral-400/70 dark:text-neutral-500/70">Current period breakdown</p>
          <div className="mt-4 h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} layout="vertical" margin={{ left: 0, right: 16 }}>
                <defs>
                  {barData.map((entry, i) => (
                    <linearGradient key={i} id={`futureBarGrad${i}`} x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor={entry.color} stopOpacity={0.4} />
                      <stop offset="100%" stopColor={entry.color} stopOpacity={0.95} />
                    </linearGradient>
                  ))}
                </defs>
                <XAxis type="number" domain={[0, 100]} {...CHART_AXIS_STYLES} />
                <YAxis type="category" dataKey="name" width={70} {...CHART_AXIS_STYLES} />
                <Tooltip content={<ChartTooltip formatter={(v) => `${v}%`} />} cursor={CHART_CURSOR_STYLES} />
                <Bar dataKey="current" radius={[0, 9, 9, 0]} barSize={18} name="Current">
                  {barData.map((entry, i) => (
                    <Cell key={i} fill={`url(#futureBarGrad${i})`} style={{ filter: `drop-shadow(0 4px 8px ${entry.color}33)` }} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* Category Cards — compact row */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {(Object.keys(categoryConfig) as GrowthCategory[]).map((cat, i) => {
          const cfg = categoryConfig[cat]
          const Icon = cfg.icon
          const curr = currentMetrics[cat]
          const prev = prevMetrics[cat]
          const diff = curr.value - prev.value
          return (
            <motion.div
              key={cat}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * i }}
              className="rounded-2xl border border-neutral-200/60 bg-white p-4 dark:border-neutral-800/60 dark:bg-neutral-900"
            >
              <div className="flex items-center gap-2">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-neutral-100 dark:bg-neutral-800">
                  <Icon className="h-4 w-4" style={{ color: cfg.hex }} />
                </div>
                <span className="text-xs font-semibold text-neutral-900 dark:text-neutral-50">{cfg.label}</span>
              </div>
              <div className="mt-3 flex items-end justify-between">
                <span className="text-2xl font-bold text-neutral-900 dark:text-neutral-50">
                  {curr.value}<span className="text-xs text-neutral-400 font-normal">%</span>
                </span>
                {diff !== 0 && (
                  <span className={cn("flex items-center gap-0.5 text-[11px] font-medium", diff > 0 ? "text-green-600" : "text-red-500")}>
                    {diff > 0 ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                    {diff > 0 ? "+" : ""}{diff}%
                  </span>
                )}
              </div>
              <p className="mt-1 text-[11px] text-neutral-400 dark:text-neutral-500">{curr.label}</p>
              <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
                <motion.div
                  className="h-full rounded-full"
                  style={{ backgroundColor: cfg.hex }}
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(curr.value, 100)}%` }}
                  transition={{ duration: 0.5, delay: 0.1 * i }}
                />
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Goals */}
      <div className="rounded-3xl border border-neutral-200/60 bg-white p-6 dark:border-neutral-800/60 dark:bg-neutral-900">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-50">Goals for {currentLabel}</h3>
            <p className="mt-0.5 text-[11px] text-neutral-400 dark:text-neutral-500">{periodGoals.length} goal{periodGoals.length !== 1 ? "s" : ""} set</p>
          </div>
          <Button size="sm" className="gap-1.5 rounded-xl" onClick={() => { setEditGoalId(null); setGoalForm({ title: "", category: "tasks", targetValue: 0, currentValue: 0 }); setGoalDialogOpen(true) }}>
            <Plus className="h-3.5 w-3.5" /> Add Goal
          </Button>
        </div>

        {periodGoals.length === 0 ? (
          <div className="mt-8 flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-neutral-200 py-10 dark:border-neutral-800">
            <Target className="mb-2 h-8 w-8 text-neutral-300 dark:text-neutral-600" />
            <p className="text-xs text-neutral-500 dark:text-neutral-400">No goals set for this period</p>
            <Button variant="outline" size="sm" className="mt-3 gap-1.5" onClick={() => setGoalDialogOpen(true)}>
              <Plus className="h-3.5 w-3.5" /> Add first goal
            </Button>
          </div>
        ) : (
          <div className="mt-4 space-y-2">
            {periodGoals.map((g) => {
              const curVal = currentMetrics[g.category]?.value ?? 0
              const pct = g.targetValue > 0 ? Math.min(Math.round((curVal / g.targetValue) * 100), 100) : 0
              const catCfg = categoryConfig[g.category]
              return (
                <div key={g.id} className={cn(
                  "group flex items-center gap-3 rounded-xl border p-3 transition-all",
                  g.completed
                    ? "border-green-200 bg-green-50/50 dark:border-green-900/30 dark:bg-green-950/15"
                    : "border-neutral-200/60 dark:border-neutral-800/60"
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
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={cn("text-sm font-medium", g.completed ? "text-green-700 line-through dark:text-green-300" : "text-neutral-900 dark:text-neutral-50")}>
                        {g.title}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium" style={{ backgroundColor: `${catCfg.hex}15`, color: catCfg.hex }}>
                        {catCfg.label}
                      </span>
                    </div>
                    <div className="mt-1.5 flex items-center gap-3">
                      <span className="text-[11px] text-neutral-400">{curVal}% / {g.targetValue}%</span>
                      <div className="flex-1 max-w-[140px] h-1.5 overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
                        <motion.div
                          className="h-full rounded-full"
                          style={{ backgroundColor: catCfg.hex }}
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.4 }}
                        />
                      </div>
                      <span className={cn("text-[11px] font-medium", pct >= 100 ? "text-green-600" : "text-neutral-400")}>{pct}%</span>
                    </div>
                  </div>
                  <div className="flex gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
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
      <AnimatePresence>
        {goalDialogOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
            onClick={() => setGoalDialogOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              transition={{ duration: 0.15 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm rounded-2xl border border-neutral-200 bg-white p-6 shadow-xl dark:border-neutral-800 dark:bg-neutral-900"
            >
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">{editGoalId ? "Edit" : "Add"} Goal</h3>
              <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">Set a target for {currentLabel}</p>
              <div className="mt-5 space-y-4">
                <div>
                  <Label className="text-xs font-medium text-neutral-600 dark:text-neutral-400">Title</Label>
                  <Input className="mt-1.5" value={goalForm.title} onChange={(e) => setGoalForm({ ...goalForm, title: e.target.value })} placeholder="e.g. Complete 80% of tasks" autoFocus />
                </div>
                <div>
                  <Label className="text-xs font-medium text-neutral-600 dark:text-neutral-400">Category</Label>
                  <Select value={goalForm.category} onValueChange={(v) => setGoalForm({ ...goalForm, category: v as GrowthCategory })}>
                    <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {(Object.keys(categoryConfig) as GrowthCategory[]).map((c) => (
                        <SelectItem key={c} value={c}>{categoryConfig[c].label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs font-medium text-neutral-600 dark:text-neutral-400">Target (%)</Label>
                  <Input className="mt-1.5" type="number" min={0} max={100} value={goalForm.targetValue || ""} onChange={(e) => setGoalForm({ ...goalForm, targetValue: Number(e.target.value) })} />
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => setGoalDialogOpen(false)}>Cancel</Button>
                <Button size="sm" disabled={!goalForm.title.trim() || !goalForm.targetValue} onClick={handleGoalSubmit}>
                  {editGoalId ? "Save" : "Add Goal"}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function ArchiveTab() {
  const { goals, clearAll } = useFutureStore()

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
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={handleExport} className="gap-2">
          <Download className="h-3.5 w-3.5" /> Export .xlsx
        </Button>
        <Button variant="outline" size="sm" onClick={clearAll} className="gap-2 text-red-500 hover:text-red-600">
          <Trash2 className="h-3.5 w-3.5" /> Clear All
        </Button>
      </div>
      {goals.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-neutral-200 py-16 dark:border-neutral-800">
          <Archive className="mb-3 h-10 w-10 text-neutral-300 dark:text-neutral-600" />
          <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">No goals archived</p>
        </div>
      ) : (
        <div className="rounded-3xl border border-neutral-200/60 bg-white p-5 dark:border-neutral-800/60 dark:bg-neutral-900">
          <div className="space-y-2">
            {goals.map((g) => {
              const catCfg = categoryConfig[g.category]
              return (
                <div key={g.id} className="flex items-center gap-3 rounded-xl border border-neutral-200/60 p-3 dark:border-neutral-800/60">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-neutral-100 dark:bg-neutral-800">
                    <catCfg.icon className="h-4 w-4" style={{ color: catCfg.hex }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className={cn("text-sm font-medium", g.completed ? "text-green-700 line-through dark:text-green-300" : "text-neutral-900 dark:text-neutral-50")}>
                      {g.title}
                    </span>
                    <p className="text-[11px] text-neutral-400">{g.periodKey} &middot; Target: {g.targetValue}%</p>
                  </div>
                  <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium", g.completed ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" : "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400")}>
                    {g.completed ? "Done" : "Active"}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export function FuturePanel() {
  const [tab, setTab] = useState<"simulator" | "archive">("simulator")

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">
          Future Self
        </h1>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          Track your growth across all areas of life
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
                "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 whitespace-nowrap",
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
          {tab === "archive" && <ArchiveTab />}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
