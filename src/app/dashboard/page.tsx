"use client"

import { useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import {
  Compass, Heart, Wallet, TrendingUp,
  CheckCircle2, Flame, ArrowUpRight, ArrowDownRight,
  Lock, Moon, Check, Calendar, Zap,
} from "lucide-react"
import {
  PieChart, Pie, Cell, ResponsiveContainer,
  AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
} from "recharts"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { useNorthStarStore } from "@/store/use-north-star-store"
import { useTaskStore } from "@/store/use-task-store"
import { useHabitStore } from "@/store/use-habit-store"
import { useChallengeStore } from "@/store/use-challenge-store"
import { useFinanceStore } from "@/store/use-finance-store"
import { useSleepStore } from "@/store/use-sleep-store"
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
        "relative overflow-hidden rounded-[14px] bg-white dark:bg-neutral-900 p-4 sm:p-5",
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
    <div className="mb-3 flex items-center gap-2.5">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-neutral-100 dark:bg-neutral-800">
        <Icon className={cn("h-4 w-4", color)} />
      </div>
      <h3 className="text-[13px] font-bold tracking-tight text-neutral-900 dark:text-neutral-50">{label}</h3>
    </div>
  )
}

/* ── Hero ────────────────────────────────────────────── */
function DashboardHero() {
  const incomes = useFinanceStore((s) => s.incomes)
  const expenses = useFinanceStore((s) => s.expenses)

  const net = useMemo(
    () =>
      incomes.reduce((s, i) => s + i.amount, 0) -
      expenses.reduce((s, e) => s + e.amount, 0),
    [incomes, expenses]
  )

  return (
    <Link
      href="/finance"
      className="flex items-center gap-3 rounded-[14px] bg-white p-4 transition-colors hover:bg-neutral-50 dark:bg-neutral-900 dark:hover:bg-neutral-800/70"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400">
        <Wallet className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
          Net cash flow
        </p>
        <p className="truncate text-lg font-extrabold tracking-tight text-neutral-900 dark:text-neutral-50">
          ₹{net.toLocaleString("en-IN")}
        </p>
      </div>
      <ArrowUpRight className="ml-auto h-4 w-4 shrink-0 text-neutral-300 dark:text-neutral-600" />
    </Link>
  )
}

/* ── Mission ─────────────────────────────────────────── */
function MissionSection() {
  const mission = useNorthStarStore((s) => s.mission)

  return (
    <Card delay={0}>
      {mission ? (
        <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400 sm:text-[15px]">
          &ldquo;{mission}&rdquo;
        </p>
      ) : (
        <Link href="/north-star" className="text-xs text-neutral-400 transition-colors hover:text-neutral-600 dark:hover:text-neutral-300">
          Set your mission in North Star →
        </Link>
      )}
    </Card>
  )
}

/* ── Focus Flow (urgent → medium → low) ──────────────── */
function FocusFlowSection() {
  const tasks = useTaskStore((s) => s.tasks)
  const requestComplete = useTaskStore((s) => s.requestComplete)

  const { groups, pendingTotal, hasAnyActive } = useMemo(() => {
    const done = (p: Task["priority"]) => tasks.filter((t) => t.completed && t.priority === p).length
    const active = (p: Task["priority"]) => tasks.filter((t) => !t.completed && t.priority === p)

    const doneHigh = done("high")
    const doneMedium = done("medium")
    const showMedium = doneHigh > 0
    const showLow = doneMedium > 0

    const high = active("high").slice(0, 3)
    const medium = active("medium").slice(0, 2)
    const low = active("low").slice(0, 3)

    const groups = [
      {
        key: "high",
        label: "Urgent",
        dot: "bg-red-500",
        box: "border-red-400 dark:border-red-500/60",
        boxChecked: "border-red-500 bg-red-500 text-white",
        active: high,
        open: true,
      },
      {
        key: "medium",
        label: "Medium",
        dot: "bg-amber-500",
        box: "border-amber-400 dark:border-amber-500/60",
        boxChecked: "border-amber-500 bg-amber-500 text-white",
        active: medium,
        open: showMedium,
      },
      {
        key: "low",
        label: "Low",
        dot: "bg-sky-500",
        box: "border-sky-400 dark:border-sky-500/60",
        boxChecked: "border-sky-500 bg-sky-500 text-white",
        active: low,
        open: showLow,
      },
    ]

    const pendingTotal = groups.reduce((s, g) => s + (g.open ? g.active.length : 0), 0)
    const hasAnyActive = tasks.some((t) => !t.completed)

    return { groups, pendingTotal, hasAnyActive }
  }, [tasks])

  return (
    <Card delay={0.05} className="overflow-visible">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-amber-100 dark:bg-amber-900/30">
            <Zap className="h-4 w-4 text-amber-500" />
          </div>
          <div>
            <h3 className="text-sm font-bold tracking-tight text-neutral-900 dark:text-white">Focus Flow</h3>
            <p className="text-[10px] text-neutral-400 dark:text-neutral-500">Urgent first · finish one to unlock the next tier</p>
          </div>
        </div>
        {pendingTotal > 0 ? (
          <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-neutral-900 px-1.5 text-[10px] font-bold text-white dark:bg-white dark:text-neutral-900">
            {pendingTotal}
          </span>
        ) : (
          <CheckCircle2 className="h-4 w-4 text-green-500" />
        )}
      </div>

      {!hasAnyActive ? (
        <div className="flex flex-col items-center gap-1 py-7 text-neutral-400">
          <CheckCircle2 className="h-6 w-6" />
          <p className="text-xs">All caught up — nothing pending.</p>
          <Link href="/tasks" className="mt-1 text-[11px] font-semibold text-amber-500 hover:underline">
            Plan your next task
          </Link>
        </div>
      ) : (
        <div className="space-y-3.5">
          {groups.map((g) => (
            <div key={g.key}>
              <div className="mb-1.5 flex items-center justify-between px-0.5">
                <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                  <span className={cn("h-1.5 w-1.5 rounded-full", g.dot)} />
                  {g.label}
                  {!g.open && <Lock className="h-3 w-3 text-neutral-300 dark:text-neutral-600" />}
                </span>
                {!g.open
                  ? g.active.length > 0 && (
                      <span className="text-[10px] font-medium text-neutral-300 dark:text-neutral-600">
                        {g.active.length} awaiting
                      </span>
                    )
                  : g.active.length === 0 && (
                      <span className="text-[10px] font-semibold text-emerald-500">clear</span>
                    )}
              </div>
              <AnimatePresence initial={false}>
                {g.open &&
                  g.active.map((t) => (
                    <motion.div
                      key={t.id}
                      layout
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      className="mb-1.5 flex items-center gap-2.5 rounded-[10px] border border-neutral-100 bg-white px-3 py-2 dark:border-neutral-800 dark:bg-white/[0.03]"
                    >
                      <button onClick={() => requestComplete(t.id)} className="shrink-0">
                        <span className={cn("flex h-4 w-4 items-center justify-center rounded-[10px] border transition-colors", g.box)} />
                      </button>
                      <button
                        onClick={() => requestComplete(t.id)}
                        className="min-w-0 flex-1 text-left"
                      >
                        <p className="truncate text-sm font-medium text-neutral-900 dark:text-neutral-50">{t.title}</p>
                        <div className="mt-0.5 flex items-center gap-2 text-[10px] text-neutral-400">
                          {t.project && <span className="max-w-[40%] truncate">{t.project}</span>}
                          {t.dueDate && (
                            <span className="flex shrink-0 items-center gap-0.5">
                              <Calendar className="h-2.5 w-2.5" /> {format(new Date(t.dueDate), "MMM d")}
                            </span>
                          )}
                        </div>
                      </button>
                    </motion.div>
                  ))}
              </AnimatePresence>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}

/* ── Health (habits + sleep + challenges) ────────────── */
function HabitsChallengesSection() {
  const habits = useHabitStore((s) => s.habits)
  const toggleDay = useHabitStore((s) => s.toggleDay)
  const getStreak = useHabitStore((s) => s.getStreak)
  const challenges = useChallengeStore((s) => s.challenges)
  const toggleDayC = useChallengeStore((s) => s.toggleDay)
  const getProgress = useChallengeStore((s) => s.getProgress)
  const sleepEntries = useSleepStore((s) => s.entries)

  const today = format(new Date(), "yyyy-MM-dd")
  const todayCompleted = habits.filter((h) => h.records.find((r) => r.date === today)?.completed).length
  const bestStreak = Math.max(...habits.map((h) => getStreak(h.id)), 0)
  const todaySleep = useMemo(() => sleepEntries.find((e) => e.date === today), [sleepEntries, today])

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
    <Card delay={0.1} className="overflow-visible">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-pink-100 dark:bg-pink-900/30">
            <Heart className="h-4 w-4 text-pink-500" />
          </div>
          <h3 className="text-sm font-bold tracking-tight text-neutral-900 dark:text-white">Health</h3>
          <span className="text-[10px] text-neutral-400 dark:text-neutral-500">{format(new Date(), "MMM d, yyyy")}</span>
        </div>
        <div className="flex items-center gap-2">
          {bestStreak > 0 && (
            <span className="flex items-center gap-1 text-[10px] font-medium text-neutral-400 dark:text-neutral-500">
              <Flame className="h-3 w-3" /> {bestStreak}d
            </span>
          )}
          {habits.length > 0 && (
            <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-neutral-900 px-1.5 text-[10px] font-bold text-white dark:bg-white dark:text-neutral-900">
              {todayCompleted}/{habits.length}
            </span>
          )}
        </div>
      </div>

      {habits.length > 0 && (
        <>
          <div className="grid grid-cols-2 gap-1.5">
            {habits.slice(0, 6).map((h) => {
              const done = h.records.find((r) => r.date === today)?.completed ?? false
              return (
                <button
                  key={h.id}
                  onClick={() => toggleDay(h.id, today)}
                  className={cn(
                    "flex items-center gap-2 rounded-[10px] px-2.5 py-2 text-left transition-all",
                    done
                      ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
                      : "border border-neutral-200 bg-white hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:bg-neutral-800"
                  )}
                >
                  <div className={cn(
                    "flex h-4 w-4 shrink-0 items-center justify-center rounded-[10px] transition-all",
                    done ? "bg-white text-neutral-900 dark:bg-neutral-900 dark:text-white" : "border border-neutral-300 dark:border-neutral-600"
                  )}>
                    {done && <Check className="h-2.5 w-2.5" />}
                  </div>
                  <span className={cn("text-[11px] font-medium truncate", done ? "text-white dark:text-neutral-900" : "text-neutral-700 dark:text-neutral-300")}>
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
        </>
      )}

      <Link
        href="/habits"
        className={cn(
          "mt-1.5 flex items-center gap-2 rounded-[10px] px-2.5 py-2 text-left transition-all",
          todaySleep
            ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
            : "border border-dashed border-indigo-300/70 bg-white hover:bg-indigo-50/50 dark:border-indigo-700/50 dark:bg-neutral-900 dark:hover:bg-neutral-800"
        )}
      >
        {todaySleep ? (
          <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-[10px] border border-indigo-500 bg-indigo-500 text-white">
            <Check className="h-2.5 w-2.5" />
          </div>
        ) : (
          <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-[10px] border border-indigo-400 text-indigo-500">
            <Moon className="h-2.5 w-2.5" />
          </div>
        )}
        <span className="flex items-center gap-1 truncate text-[11px] font-medium">
          <Moon className={cn("h-3 w-3", todaySleep ? "text-indigo-200 dark:text-indigo-300" : "text-indigo-400")} />
          Sleep
        </span>
        <span
          className={cn(
            "ml-auto shrink-0 rounded-full px-2 py-px text-[10px] font-semibold",
            todaySleep
              ? "bg-indigo-500/20 text-indigo-100 dark:text-indigo-200"
              : "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-300"
          )}
        >
          {todaySleep ? `${todaySleep.hours}h · ${todaySleep.quality}/5` : "Log tonight"}
        </span>
      </Link>

      {activeChallenges.length > 0 && (
        <div className="mt-4">
          <div className="space-y-1.5">
            {todayChallengeDays.map(({ challenge: c, todayDay }) => {
              const progress = getProgress(c.id)
              const isTodayDone = todayDay?.completed ?? false
              return (
                <div key={c.id} className="rounded-[10px] bg-white px-3 py-2.5 dark:bg-neutral-900">
                  <div className="flex items-center gap-2.5">
                    <button
                      onClick={() => { if (todayDay) toggleDayC(c.id, todayDay.day) }}
                      disabled={!todayDay}
                      className={cn(
                        "flex h-4 w-4 shrink-0 items-center justify-center rounded-[10px] border transition-all",
                        isTodayDone ? "border-neutral-900 bg-neutral-900 text-white dark:border-neutral-800 dark:bg-white dark:text-neutral-900" : "border-neutral-300 dark:border-neutral-600",
                        !todayDay && "opacity-30"
                      )}
                    >
                      {isTodayDone && <Check className="h-2.5 w-2.5" />}
                    </button>
                    <span className="text-xs font-medium text-neutral-700 truncate dark:text-neutral-300 flex-1">{c.title}</span>
                    <span className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 shrink-0">{progress}%</span>
                  </div>
                  <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
                    <div className="h-full bg-neutral-900 dark:bg-white transition-all" style={{ width: `${progress}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {habits.length === 0 && challenges.length === 0 && (
        <Link href="/habits" className="flex flex-col items-center gap-2 py-8 text-neutral-400">
          <Zap className="h-7 w-7" />
          <p className="text-xs">Start tracking health</p>
        </Link>
      )}
    </Card>
  )
}

/* ── Cash Flow ───────────────────────────────────────── */
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
      <CardHeader icon={Wallet} label="Cash Flow" color="text-green-600 dark:text-green-400" />
      <div className="flex items-center gap-2.5">
        <span className={cn("text-2xl font-bold tracking-tight", isPositive ? "text-neutral-900 dark:text-white" : "text-rose-500 dark:text-rose-400")}>
          {isPositive ? "+" : "−"}₹{Math.abs(net).toLocaleString("en-IN")}
        </span>
        <span
          className={cn(
            "flex h-6 items-center gap-1 rounded-full px-2 text-[11px] font-bold",
            isPositive
              ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
              : "bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400"
          )}
        >
          {isPositive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
          Net
        </span>
      </div>

      <div className="mt-3 mb-4 grid grid-cols-2 gap-2.5">
        <div className="rounded-[12px] border border-neutral-100 bg-neutral-50/60 p-3 dark:border-neutral-800 dark:bg-neutral-800/40">
          <div className="flex items-center gap-1.5 text-[10px] font-medium text-neutral-400">
            <ArrowUpRight className="h-3 w-3 text-green-500" /> Income
          </div>
          <p className="mt-1 truncate text-sm font-bold text-neutral-900 dark:text-white">₹{totalIncome.toLocaleString("en-IN")}</p>
        </div>
        <div className="rounded-[12px] border border-neutral-100 bg-neutral-50/60 p-3 dark:border-neutral-800 dark:bg-neutral-800/40">
          <div className="flex items-center gap-1.5 text-[10px] font-medium text-neutral-400">
            <ArrowDownRight className="h-3 w-3 text-rose-500" /> Expenses
          </div>
          <p className="mt-1 truncate text-sm font-bold text-neutral-900 dark:text-white">₹{totalExpenses.toLocaleString("en-IN")}</p>
        </div>
      </div>

      {monthlyData.length > 0 ? (
        <>
          <div className="h-36">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyData} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#a3a3a3" }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip
                  contentStyle={{ borderRadius: 8, border: "1px solid #e5e5e5", fontSize: 12 }}
                  formatter={(value) => `₹${Number(value ?? 0).toLocaleString("en-IN")}`}
                />
                <Area type="monotone" dataKey="income" name="Income" stroke="#22c55e" strokeWidth={2} fill="#22c55e" fillOpacity={0.12} dot={false} />
                <Area type="monotone" dataKey="expense" name="Expense" stroke="#f43f5e" strokeWidth={2} fill="#f43f5e" fillOpacity={0.08} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-1 flex items-center gap-3 text-[10px] text-neutral-500">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-green-500" /> Income
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-rose-500" /> Expenses
            </span>
          </div>
        </>
      ) : (
        <p className="py-6 text-center text-xs text-neutral-400">No transactions yet.</p>
      )}

      {recentExpenses.length > 0 && (
        <div className="mt-3 space-y-1">
          <span className="text-[10px] font-medium text-neutral-400">Recent</span>
          {recentExpenses.map((e) => (
            <div key={e.id} className="flex items-center justify-between rounded-lg px-2 py-1.5 transition-colors hover:bg-neutral-50 dark:hover:bg-white/5">
              <span className="text-xs text-neutral-600 truncate dark:text-neutral-400">{e.description}</span>
              <span className="text-xs font-medium text-neutral-600 shrink-0 ml-2 dark:text-neutral-400">-₹{e.amount.toLocaleString("en-IN")}</span>
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
      { name: "Stocks", value: stockCur, color: "#0066cc" },
      { name: "Mutual Funds", value: mfCur, color: "#af52de" },
      { name: "SIPs", value: sipCur, color: "#22c55e" },
    ].filter((d) => d.value > 0)

    return { totalCurrent: tc, totalGain: tg, totalGainPct: tp, allocationData: alloc }
  }, [sips, stocks, mutualFunds])

  const isGain = totalGain >= 0
  const topStocks = useMemo(() =>
    stocks.slice(0, 3).map((s) => ({
      name: s.name,
      pct: s.buyPrice > 0 ? Math.round(((s.currentPrice - s.buyPrice) / s.buyPrice) * 100) : 0,
    })),
  [stocks])

  return (
    <Card delay={0.2}>
      <CardHeader icon={TrendingUp} label="Investments" color="text-violet-600 dark:text-violet-400" />

      {allocationData.length === 0 ? (
        <div className="flex flex-col items-center gap-1 py-7 text-neutral-400">
          <TrendingUp className="h-6 w-6" />
          <p className="text-xs">No investments yet.</p>
          <Link href="/finance" className="mt-1 text-[11px] font-semibold text-violet-500 hover:underline">
            Add your first holding
          </Link>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-3">
            <div className="relative h-16 w-16 shrink-0 sm:h-20 sm:w-20">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={allocationData}
                    cx="50%"
                    cy="50%"
                    innerRadius="56%"
                    outerRadius="98%"
                    dataKey="value"
                    stroke="none"
                    paddingAngle={4}
                    cornerRadius={6}
                  >
                    {allocationData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-[8px] text-neutral-400 sm:text-[9px]">Total</span>
                <span className="text-[10px] font-bold text-neutral-900 dark:text-white sm:text-xs">₹{(totalCurrent / 1000).toFixed(1)}k</span>
              </div>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className={cn("text-xl font-bold tracking-tight sm:text-2xl", isGain ? "text-neutral-900 dark:text-white" : "text-rose-500 dark:text-rose-400")}>
                  {isGain ? "+" : "−"}₹{Math.abs(totalGain).toLocaleString("en-IN")}
                </span>
                <span
                  className={cn(
                    "flex h-6 shrink-0 items-center gap-1 rounded-full px-2 text-[11px] font-bold",
                    isGain
                      ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                      : "bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400"
                  )}
                >
                  {isGain ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                  {Math.abs(totalGainPct)}%
                </span>
              </div>
              <p className="mt-0.5 text-[11px] text-neutral-400">on ₹{totalCurrent.toLocaleString("en-IN")} invested all-time</p>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-x-3 gap-y-1.5">
            {allocationData.map((d) => {
              const pct = totalCurrent > 0 ? Math.round((d.value / totalCurrent) * 100) : 0
              return (
                <span
                  key={d.name}
                  className="flex items-center gap-1.5 rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-medium text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300"
                >
                  <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: d.color }} />
                  {d.name} · {pct}%
                </span>
              )
            })}
          </div>

          {topStocks.length > 0 && (
            <div className="mt-4 space-y-1">
              <span className="text-[10px] font-medium text-neutral-400">Top Stocks</span>
              {topStocks.map((s) => (
                <div key={s.name} className="flex items-center justify-between rounded-lg px-2 py-1.5 transition-colors hover:bg-neutral-50 dark:hover:bg-white/5">
                  <span className="text-xs text-neutral-600 truncate dark:text-neutral-400">{s.name}</span>
                  <span
                    className={cn(
                      "ml-2 shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-bold",
                      s.pct >= 0
                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                        : "bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400"
                    )}
                  >
                    {s.pct >= 0 ? "+" : "−"}{Math.abs(s.pct)}%
                  </span>
                </div>
              ))}
            </div>
          )}
        </>
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
        className="mx-auto w-full max-w-6xl space-y-6"
      >
        <MissionSection />

        <DashboardHero />

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:gap-5">
          <FocusFlowSection />
          <HabitsChallengesSection />
          <FinanceSection />
          <InvestmentsSection />
        </div>
      </motion.div>
    </DashboardShell>
  )
}