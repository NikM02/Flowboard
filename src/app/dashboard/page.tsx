"use client"

import { useMemo, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import {
  Compass, Heart, Wallet, TrendingUp, BookOpen,
  CheckCircle2, Circle, Flame, ArrowUpRight, ArrowDownRight,
  AlertTriangle, ChevronDown, ChevronRight,
  Plus, Minus, Check, Calendar, Trophy, Zap, Bell, BellOff,
} from "lucide-react"
import {
  PieChart, Pie, Cell, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend,
} from "recharts"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import {
  ChartTooltip, ChartGradients, ChartGlow,
  CHART_GRID_STYLES, CHART_AXIS_STYLES, CHART_CURSOR_STYLES,
} from "@/components/charts/chart-components"
import { useNorthStarStore } from "@/store/use-north-star-store"
import { useTaskStore } from "@/store/use-task-store"
import { useHabitStore } from "@/store/use-habit-store"
import { useChallengeStore } from "@/store/use-challenge-store"
import { useFinanceStore } from "@/store/use-finance-store"
import { useContentStore } from "@/store/use-content-store"
import { format } from "date-fns"
import { cn } from "@/lib/shadcn-utils"
import type { Task } from "@/types"

function Card({ children, className, delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
      className={cn(
        "card-modern card-hover glass animate-fade-in relative overflow-hidden rounded-2xl p-4 sm:p-5",
        className
      )}
      style={{ animationDelay: `${delay * 1000}ms` }}
    >
      {children}
    </motion.div>
  )
}

function CardHeader({ icon: Icon, label, color = "text-neutral-500" }: { icon: typeof Compass; label: string; color?: string }) {
  return (
    <div className="mb-3 flex items-center gap-2">
      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500/10">
        <Icon className={cn("h-3.5 w-3.5", color)} />
      </div>
      <h3 className="text-[13px] font-bold tracking-tight text-neutral-900 dark:text-neutral-50">{label}</h3>
    </div>
  )
}

/* ── Mission ─────────────────────────────────────────── */
function MissionSection() {
  const mission = useNorthStarStore((s) => s.mission)

  return (
    <Card delay={0} className="border-neutral-200/40 bg-gradient-to-br from-neutral-50 via-white to-neutral-50 dark:from-neutral-900 dark:via-neutral-900 dark:to-neutral-950 overflow-hidden relative">
      <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-neutral-900/[0.03] dark:bg-neutral-50/[0.03]" />
      <div className="flex items-start gap-3 relative">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-neutral-900 dark:bg-neutral-50">
          <Compass className="h-4 w-4 text-white dark:text-neutral-900" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 mb-1">Mission</p>
          {mission ? (
            <p className="text-sm leading-relaxed text-neutral-700 dark:text-neutral-300 line-clamp-2 italic">
              &ldquo;{mission}&rdquo;
            </p>
          ) : (
            <Link href="/north-star" className="text-xs text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors">
              Set your mission in North Star →
            </Link>
          )}
        </div>
      </div>
    </Card>
  )
}

/* ── High Priority Tasks (interactive) ───────────────── */
function HighPriorityTasks() {
  const tasks = useTaskStore((s) => s.tasks)
  const updateTask = useTaskStore((s) => s.updateTask)
  const [expanded, setExpanded] = useState<string | null>(null)

  const highTasks = useMemo(
    () => tasks.filter((t) => t.priority === "high" && !t.completed).slice(0, 6),
    [tasks]
  )

  const handleComplete = (t: Task) => {
    updateTask(t.id, { completed: true, progress: 100 })
  }

  const adjustProgress = (t: Task, delta: number) => {
    const step = 25
    let next = Math.round(t.progress / step) * step + delta
    next = Math.max(0, Math.min(100, next))
    if (next >= 100) updateTask(t.id, { progress: 100, completed: true })
    else updateTask(t.id, { progress: next, completed: false })
  }

  const toggleReminder = (t: Task) => {
    if (t.reminder) {
      updateTask(t.id, { reminder: null })
    } else {
      let reminderDate: Date
      if (t.dueDate) {
        const due = new Date(t.dueDate)
        reminderDate = new Date(due.getTime() - 60 * 60 * 1000)
        if (reminderDate < new Date()) {
          reminderDate = new Date()
          reminderDate.setMinutes(reminderDate.getMinutes() + 5)
        }
      } else {
        reminderDate = new Date()
        reminderDate.setHours(reminderDate.getHours() + 1)
      }
      updateTask(t.id, { reminder: reminderDate.toISOString() })
    }
  }

  return (
    <Card delay={0.05}>
      <CardHeader icon={AlertTriangle} label="High Priority" color="text-red-500" />
      {highTasks.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-6 text-neutral-400">
          <CheckCircle2 className="h-8 w-8 text-emerald-400" />
          <p className="text-xs">All clear! No high priority tasks.</p>
        </div>
      ) : (
        <div className="space-y-1.5">
          <AnimatePresence>
            {highTasks.map((t) => {
              const isExpanded = expanded === t.id
              return (
                <motion.div
                  key={t.id}
                  layout
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 8, height: 0 }}
                  className="rounded-xl border border-neutral-100 bg-neutral-50/50 dark:border-neutral-800 dark:bg-neutral-800/30 overflow-hidden"
                >
                  <div className="flex items-center gap-2.5 px-3 py-2.5">
                    <button onClick={() => handleComplete(t)} className="shrink-0">
                      <Circle className="h-4 w-4 text-red-400 hover:text-emerald-500 transition-colors" />
                    </button>
                    <div className="min-w-0 flex-1 cursor-pointer" onClick={() => setExpanded(isExpanded ? null : t.id)}>
                      <p className="text-sm font-medium text-neutral-900 truncate dark:text-neutral-50">{t.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {t.project && <span className="text-[10px] text-neutral-400">{t.project}</span>}
                        {t.dueDate && (
                          <span className="flex items-center gap-0.5 text-[10px] text-neutral-400">
                            <Calendar className="h-2.5 w-2.5" /> {format(new Date(t.dueDate), "MMM d")}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => toggleReminder(t)}
                        className={cn(
                          "flex h-5 w-5 items-center justify-center rounded-md transition-all",
                          t.reminder
                            ? "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400"
                            : "border border-neutral-200 text-neutral-400 hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-700"
                        )}
                        title={t.reminder ? "Reminder set" : "Remind me 1h before due"}
                      >
                        {t.reminder ? <Bell className="h-3 w-3" /> : <BellOff className="h-3 w-3" />}
                      </button>
                      <button onClick={() => adjustProgress(t, -25)} disabled={t.progress <= 0}
                        className="flex h-5 w-5 items-center justify-center rounded-md border border-neutral-200 text-neutral-400 hover:bg-neutral-100 disabled:opacity-20 dark:border-neutral-700 dark:hover:bg-neutral-700">
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="min-w-[28px] text-center text-[10px] font-bold text-neutral-600 dark:text-neutral-400">{t.progress}%</span>
                      <button onClick={() => adjustProgress(t, 25)} disabled={t.progress >= 100}
                        className="flex h-5 w-5 items-center justify-center rounded-md border border-neutral-200 text-neutral-400 hover:bg-neutral-100 disabled:opacity-20 dark:border-neutral-700 dark:hover:bg-neutral-700">
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                    <button onClick={() => setExpanded(isExpanded ? null : t.id)} className="shrink-0 text-neutral-300 dark:text-neutral-600">
                      {isExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                    </button>
                  </div>

                  <div className="h-0.5 w-full bg-neutral-100 dark:bg-neutral-800">
                    <motion.div
                      className={cn("h-full rounded-full", t.progress >= 100 ? "bg-emerald-500" : t.progress >= 50 ? "bg-blue-500" : "bg-red-500")}
                      animate={{ width: `${t.progress}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>

                  <AnimatePresence>
                    {isExpanded && t.subtasks.length > 0 && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="space-y-1 px-3 pb-2.5 pt-1">
                          {t.subtasks.map((sub) => (
                            <button
                              key={sub.id}
                              onClick={() => {
                                const newSubs = t.subtasks.map((s) => s.id === sub.id ? { ...s, completed: !s.completed } : s)
                                const done = newSubs.filter((s) => s.completed).length
                                const pct = newSubs.length > 0 ? Math.round((done / newSubs.length) * 100) : 0
                                updateTask(t.id, { subtasks: newSubs, progress: pct, completed: pct >= 100 })
                              }}
                              className="flex w-full items-center gap-2 rounded-lg px-2 py-1 text-left hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                            >
                              {sub.completed ? (
                                <CheckCircle2 className="h-3 w-3 shrink-0 text-emerald-500" />
                              ) : (
                                <Circle className="h-3 w-3 shrink-0 text-neutral-300 dark:text-neutral-600" />
                              )}
                              <span className={cn("text-xs", sub.completed ? "text-neutral-400 line-through" : "text-neutral-600 dark:text-neutral-400")}>
                                {sub.title}
                              </span>
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      )}
    </Card>
  )
}

/* ── Habits & Challenges (interactive) ───────────────── */
function HabitsChallengesSection() {
  const habits = useHabitStore((s) => s.habits)
  const toggleDay = useHabitStore((s) => s.toggleDay)
  const getStreak = useHabitStore((s) => s.getStreak)
  const challenges = useChallengeStore((s) => s.challenges)
  const toggleDayC = useChallengeStore((s) => s.toggleDay)
  const getProgress = useChallengeStore((s) => s.getProgress)

  const today = format(new Date(), "yyyy-MM-dd")
  const todayCompleted = habits.filter((h) => h.records.find((r) => r.date === today)?.completed).length
  const bestStreak = Math.max(...habits.map((h) => getStreak(h.id)), 0)

  const activeChallenges = useMemo(() =>
    challenges.filter((c) => c.joined && c.days.some((d) => !d.completed)).slice(0, 3),
  [challenges])

  const todayChallengeDays = useMemo(() => {
    return activeChallenges.map((c) => {
      const todayDay = c.days.find((d) => d.date === today)
      return { challenge: c, todayDay }
    })
  }, [activeChallenges, today])

  return (
    <Card delay={0.1}>
      <CardHeader icon={Heart} label="Health Today" color="text-rose-500" />

      {habits.length > 0 && (
        <div className="mb-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400">Habits</span>
            <div className="flex items-center gap-2 text-[10px] text-neutral-400">
              <span>{todayCompleted}/{habits.length} done</span>
              {bestStreak > 0 && (
                <span className="flex items-center gap-0.5">
                  <Flame className="h-2.5 w-2.5 text-amber-500" /> {bestStreak}d
                </span>
              )}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {habits.slice(0, 6).map((h) => {
              const done = h.records.find((r) => r.date === today)?.completed ?? false
              return (
                <button
                  key={h.id}
                  onClick={() => toggleDay(h.id, today)}
                  className={cn(
                    "flex items-center gap-2 rounded-xl px-2.5 py-2 text-left transition-all",
                    done
                      ? "bg-emerald-50 dark:bg-emerald-950/20"
                      : "bg-neutral-50 hover:bg-neutral-100 dark:bg-neutral-800 dark:hover:bg-neutral-700"
                  )}
                >
                  <div className={cn(
                    "flex h-5 w-5 shrink-0 items-center justify-center rounded-md transition-all",
                    done ? "bg-emerald-500 text-white" : "border border-neutral-300 dark:border-neutral-600"
                  )}>
                    {done && <Check className="h-3 w-3" />}
                  </div>
                  <span className={cn("text-xs font-medium truncate", done ? "text-emerald-700 dark:text-emerald-400" : "text-neutral-700 dark:text-neutral-300")}>
                    {h.name}
                  </span>
                </button>
              )
            })}
          </div>
          {habits.length > 6 && (
            <Link href="/habits" className="mt-2 flex items-center justify-center gap-1 text-[10px] text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300">
              +{habits.length - 6} more
            </Link>
          )}
        </div>
      )}

      {todayChallengeDays.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400">Active Challenges</span>
          </div>
          <div className="space-y-1.5">
            {todayChallengeDays.map(({ challenge: c, todayDay }) => {
              const progress = getProgress(c.id)
              const isTodayDone = todayDay?.completed ?? false
              return (
                <div key={c.id} className="flex items-center gap-2.5 rounded-xl bg-neutral-50 px-3 py-2 dark:bg-neutral-800/50">
                  <button
                    onClick={() => {
                      if (todayDay) toggleDayC(c.id, todayDay.day)
                    }}
                    disabled={!todayDay}
                    className={cn(
                      "flex h-5 w-5 shrink-0 items-center justify-center rounded-md transition-all",
                      isTodayDone ? "bg-purple-500 text-white" : "border border-neutral-300 dark:border-neutral-600",
                      !todayDay && "opacity-30"
                    )}
                  >
                    {isTodayDone && <Check className="h-3 w-3" />}
                  </button>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <Trophy className="h-3 w-3 text-purple-500 shrink-0" />
                      <span className="text-xs font-medium text-neutral-700 truncate dark:text-neutral-300">{c.title}</span>
                    </div>
                    <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-700">
                      <div className="h-full rounded-full bg-purple-500 transition-all" style={{ width: `${progress}%` }} />
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-neutral-400 shrink-0">{progress}%</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {habits.length === 0 && challenges.length === 0 && (
        <Link href="/habits" className="flex flex-col items-center gap-2 py-6 text-neutral-400">
          <Zap className="h-8 w-8" />
          <p className="text-xs">Start tracking your health</p>
        </Link>
      )}
    </Card>
  )
}

/* ── Cash Flow (interactive) ─────────────────────────── */
function FinanceSection() {
  const incomes = useFinanceStore((s) => s.incomes)
  const expenses = useFinanceStore((s) => s.expenses)

  const { totalIncome, totalExpenses, net, monthlyData, recentExpenses } = useMemo(() => {
    const ti = incomes.reduce((s, i) => s + i.amount, 0)
    const te = expenses.reduce((s, e) => s + e.amount, 0)
    const n = ti - te

    const monthMap: Record<string, { income: number; expense: number }> = {}
    for (const i of incomes) {
      const m = i.date.slice(0, 7)
      if (!monthMap[m]) monthMap[m] = { income: 0, expense: 0 }
      monthMap[m].income += i.amount
    }
    for (const e of expenses) {
      const m = e.date.slice(0, 7)
      if (!monthMap[m]) monthMap[m] = { income: 0, expense: 0 }
      monthMap[m].expense += e.amount
    }
    const md = Object.entries(monthMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([month, v]) => ({ month: month.slice(5), income: v.income, expense: v.expense }))

    const re = [...expenses].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 3)

    return { totalIncome: ti, totalExpenses: te, net: n, monthlyData: md, recentExpenses: re }
  }, [incomes, expenses])

  const isPositive = net >= 0

  return (
    <Card delay={0.15}>
      <CardHeader icon={Wallet} label="Cash Flow" color="text-emerald-500" />
      <div className="flex items-baseline gap-2 mb-1">
        <span className={cn("text-2xl font-bold tracking-tight", isPositive ? "text-emerald-600 dark:text-emerald-400" : "text-red-500")}>
          {isPositive ? "+" : ""}₹{net.toLocaleString("en-IN")}
        </span>
      </div>
      <div className="flex gap-4 mb-4 text-xs">
        <div className="flex items-center gap-1.5">
          <div className="flex h-5 w-5 items-center justify-center rounded-md bg-emerald-100 dark:bg-emerald-900/30">
            <ArrowUpRight className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
          </div>
          <span className="text-neutral-500">₹{totalIncome.toLocaleString("en-IN")}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="flex h-5 w-5 items-center justify-center rounded-md bg-red-100 dark:bg-red-900/30">
            <ArrowDownRight className="h-3 w-3 text-red-600 dark:text-red-400" />
          </div>
          <span className="text-neutral-500">₹{totalExpenses.toLocaleString("en-IN")}</span>
        </div>
      </div>

      {monthlyData.length > 0 && (
        <div className="h-32 mb-3">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyData} barGap={4}>
              <ChartGradients ids={["dash-income", "dash-expense"]} />
              <CartesianGrid {...CHART_GRID_STYLES} />
              <XAxis dataKey="month" {...CHART_AXIS_STYLES} />
              <YAxis hide />
              <Tooltip content={<ChartTooltip formatter={(v) => `₹${Number(v).toLocaleString("en-IN")}`} />} cursor={CHART_CURSOR_STYLES} />
              <Bar dataKey="income" fill="url(#dash-income)" radius={[6, 6, 2, 2]} barSize={14} name="Income" />
              <Bar dataKey="expense" fill="url(#dash-expense)" radius={[6, 6, 2, 2]} barSize={14} name="Expense" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {recentExpenses.length > 0 && (
        <div className="space-y-1">
          <span className="text-[10px] font-medium text-neutral-400">Recent</span>
          {recentExpenses.map((e) => (
            <div key={e.id} className="flex items-center justify-between rounded-lg px-2 py-1.5 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">
              <span className="text-xs text-neutral-600 truncate dark:text-neutral-400">{e.description}</span>
              <span className="text-xs font-medium text-red-500 shrink-0 ml-2">-₹{e.amount.toLocaleString("en-IN")}</span>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}

/* ── Investments ─────────────────────────────────────── */
function InvestmentsSection() {
  const sips = useFinanceStore((s) => s.sips)
  const stocks = useFinanceStore((s) => s.stocks)
  const mutualFunds = useFinanceStore((s) => s.mutualFunds)

  const { totalCurrent, totalGain, totalGainPct, allocationData } = useMemo(() => {
    const sipInv = sips.reduce((s, i) => s + i.investedAmount, 0)
    const sipCur = sips.reduce((s, i) => s + i.currentValue, 0)
    const stockInv = stocks.reduce((s, i) => s + i.buyPrice * i.quantity, 0)
    const stockCur = stocks.reduce((s, i) => s + i.currentPrice * i.quantity, 0)
    const mfInv = mutualFunds.reduce((s, i) => s + i.investedAmount, 0)
    const mfCur = mutualFunds.reduce((s, i) => s + i.currentValue, 0)

    const ti = sipInv + stockInv + mfInv
    const tc = sipCur + stockCur + mfCur
    const tg = tc - ti
    const tp = ti > 0 ? Math.round((tg / ti) * 100) : 0

    const alloc = [
      { name: "Stocks", value: stockCur, color: "#3b82f6" },
      { name: "Mutual Funds", value: mfCur, color: "#a855f7" },
      { name: "SIPs", value: sipCur, color: "#10b981" },
    ].filter((d) => d.value > 0)

    return { totalCurrent: tc, totalGain: tg, totalGainPct: tp, allocationData: alloc }
  }, [sips, stocks, mutualFunds])

  const isGain = totalGain >= 0
  const topStocks = useMemo(() =>
    stocks.slice(0, 3).map((s) => ({
      name: s.name,
      gain: (s.currentPrice * s.quantity) - (s.buyPrice * s.quantity),
      pct: s.buyPrice > 0 ? Math.round(((s.currentPrice - s.buyPrice) / s.buyPrice) * 100) : 0,
    })),
  [stocks])

  return (
    <Card delay={0.2}>
      <CardHeader icon={TrendingUp} label="Investments" color="text-blue-500" />
      <div className="flex items-center gap-3 mb-3">
        {allocationData.length > 0 && (
          <div className="relative h-14 w-14 shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <ChartGlow id="dash-alloc-glow" />
                <Pie
                  data={allocationData}
                  cx="50%"
                  cy="50%"
                  innerRadius={16}
                  outerRadius={25}
                  dataKey="value"
                  stroke="none"
                  paddingAngle={4}
                  cornerRadius={4}
                >
                  {allocationData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} style={{ filter: "url(#dash-alloc-glow)" }} />
                  ))}
                </Pie>
                <Tooltip content={<ChartTooltip formatter={(v) => `₹${Number(v).toLocaleString("en-IN")}`} />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
        <div>
          <span className={cn("text-xl font-bold tracking-tight", isGain ? "text-emerald-600 dark:text-emerald-400" : "text-red-500")}>
            {isGain ? "+" : ""}₹{totalGain.toLocaleString("en-IN")}
          </span>
          <p className="text-[11px] text-neutral-400">
            {isGain ? "+" : ""}{totalGainPct}% · ₹{totalCurrent.toLocaleString("en-IN")}
          </p>
        </div>
      </div>

      {allocationData.length > 0 && (
        <div className="flex gap-3 mb-3">
          {allocationData.map((d) => (
            <div key={d.name} className="flex items-center gap-1.5 text-[10px] text-neutral-500">
              <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
              {d.name}
            </div>
          ))}
        </div>
      )}

      {topStocks.length > 0 && (
        <div className="space-y-1">
          <span className="text-[10px] font-medium text-neutral-400">Top Stocks</span>
          {topStocks.map((s) => (
            <div key={s.name} className="flex items-center justify-between rounded-lg px-2 py-1.5 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">
              <span className="text-xs text-neutral-600 truncate dark:text-neutral-400">{s.name}</span>
              <span className={cn("text-xs font-medium shrink-0 ml-2", s.gain >= 0 ? "text-emerald-500" : "text-red-500")}>
                {s.gain >= 0 ? "+" : ""}{s.pct}%
              </span>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}

/* ── Content Pipeline (interactive) ──────────────────── */
function ContentSection() {
  const items = useContentStore((s) => s.items)
  const moveItem = useContentStore((s) => s.moveItem)

  const activeItems = useMemo(
    () => items.filter((i) => i.status !== "published").slice(0, 4),
    [items]
  )

  const statusColors: Record<string, { bg: string; text: string; next: string }> = {
    ideas: { bg: "bg-yellow-100 dark:bg-yellow-900/30", text: "text-yellow-700 dark:text-yellow-400", next: "scripts" },
    scripts: { bg: "bg-blue-100 dark:bg-blue-900/30", text: "text-blue-700 dark:text-blue-400", next: "filming" },
    filming: { bg: "bg-purple-100 dark:bg-purple-900/30", text: "text-purple-700 dark:text-purple-400", next: "editing" },
    editing: { bg: "bg-orange-100 dark:bg-orange-900/30", text: "text-orange-700 dark:text-orange-400", next: "published" },
  }

  return (
    <Card delay={0.25}>
      <CardHeader icon={BookOpen} label="Content Pipeline" color="text-violet-500" />
      {activeItems.length === 0 ? (
        <Link href="/content-hub" className="flex flex-col items-center gap-2 py-6 text-neutral-400">
          <BookOpen className="h-8 w-8" />
          <p className="text-xs">Start your content pipeline</p>
        </Link>
      ) : (
        <div className="space-y-2">
          {activeItems.map((item) => {
            const done = item.subtasks.filter((s) => s.completed).length
            const total = item.subtasks.length
            const pct = total > 0 ? Math.round((done / total) * 100) : 0
            const sc = statusColors[item.status]
            const nextStatus = sc?.next

            return (
              <div key={item.id} className="rounded-xl border border-neutral-100 bg-neutral-50/50 p-3 dark:border-neutral-800 dark:bg-neutral-800/30">
                <div className="flex items-center gap-2.5">
                  <span className="text-lg shrink-0">{item.emoji}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-neutral-900 truncate dark:text-neutral-50">{item.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={cn("inline-flex rounded-full px-1.5 py-0.5 text-[9px] font-semibold", sc?.bg, sc?.text)}>
                        {item.status}
                      </span>
                      {item.deadline && (
                        <span className="text-[10px] text-neutral-400">{format(new Date(item.deadline), "MMM d")}</span>
                      )}
                    </div>
                  </div>
                  {nextStatus && (
                    <button
                      onClick={() => moveItem(item.id, nextStatus as "ideas" | "scripts" | "filming" | "editing" | "published")}
                      className="shrink-0 rounded-lg bg-neutral-900 px-2 py-1 text-[10px] font-medium text-white transition-colors hover:bg-neutral-800 dark:bg-neutral-50 dark:text-neutral-900 dark:hover:bg-neutral-200"
                    >
                      Move →
                    </button>
                  )}
                </div>
                {total > 0 && (
                  <div className="mt-2 flex items-center gap-2">
                    <div className="h-1 flex-1 overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-700">
                      <div className="h-full rounded-full bg-violet-500 transition-all" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-[10px] font-medium text-neutral-400">{done}/{total}</span>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </Card>
  )
}

/* ── Page ────────────────────────────────────────────── */
export default function DashboardPage() {
  return (
    <DashboardShell>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="space-y-4 sm:space-y-5"
      >
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">
            Dashboard
          </h1>
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
            {format(new Date(), "EEEE, MMMM d")}
          </p>
        </div>

        <MissionSection />

        <div className="grid grid-cols-1 gap-4 sm:gap-5 lg:grid-cols-2">
          <HighPriorityTasks />
          <HabitsChallengesSection />
          <FinanceSection />
          <InvestmentsSection />
        </div>

        <ContentSection />
      </motion.div>
    </DashboardShell>
  )
}
