"use client"

import { useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import {
  Compass, Heart, Wallet, TrendingUp,
  CheckCircle2, Flame, ArrowUpRight, ArrowDownRight,
  Lock, Moon, Check, Calendar, Zap, Trophy,
  Dumbbell, Brain, Book, Target, Palette, Users, Sun, Coffee, Music, Code,
} from "lucide-react"
import {
  PieChart, Pie, Cell, ResponsiveContainer,
  ComposedChart, Area, Line, XAxis, YAxis, Tooltip, CartesianGrid,
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
import type { Task, HabitIcon } from "@/types"

const habitIconMap: Record<HabitIcon, typeof Heart> = {
  heart: Heart, dumbbell: Dumbbell, brain: Brain, book: Book, target: Target,
  palette: Palette, users: Users, sun: Sun, moon: Moon, coffee: Coffee, music: Music, code: Code,
}

const habitColors: Record<string, { check: string; box: string; tile: string }> = {
  health: { check: "border-rose-400 bg-rose-500 text-white", box: "border-rose-400/70", tile: "bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-300" },
  fitness: { check: "border-emerald-400 bg-emerald-500 text-white", box: "border-emerald-400/70", tile: "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-300" },
  mindfulness: { check: "border-violet-400 bg-violet-500 text-white", box: "border-violet-400/70", tile: "bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-300" },
  learning: { check: "border-blue-400 bg-blue-500 text-white", box: "border-blue-400/70", tile: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300" },
  productivity: { check: "border-amber-400 bg-amber-500 text-white", box: "border-amber-400/70", tile: "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-300" },
  creative: { check: "border-pink-400 bg-pink-500 text-white", box: "border-pink-400/70", tile: "bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-300" },
  social: { check: "border-cyan-400 bg-cyan-500 text-white", box: "border-cyan-400/70", tile: "bg-cyan-100 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-300" },
}

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
  const updateTask = useTaskStore((s) => s.updateTask)

  const { groups, pendingTotal, hasAnyActive } = useMemo(() => {
    const doneCount = (p: Task["priority"]) => tasks.filter((t) => t.completed && t.priority === p).length
    const active = (p: Task["priority"]) => tasks.filter((t) => !t.completed && t.priority === p)

    const doneHigh = doneCount("high")
    const doneMedium = doneCount("medium")
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
        active: high,
        open: true,
        done: doneHigh,
      },
      {
        key: "medium",
        label: "Medium",
        dot: "bg-amber-500",
        box: "border-amber-400 dark:border-amber-500/60",
        active: medium,
        open: showMedium,
        done: doneMedium,
      },
      {
        key: "low",
        label: "Low",
        dot: "bg-sky-500",
        box: "border-sky-400 dark:border-sky-500/60",
        active: low,
        open: showLow,
        done: doneCount("low"),
      },
    ]

    const pendingTotal = groups.reduce((s, g) => s + (g.open ? g.active.length : 0), 0)
    const hasAnyActive = tasks.some((t) => !t.completed)

    return { groups, pendingTotal, hasAnyActive }
  }, [tasks])

  const handleComplete = (t: Task) => {
    updateTask(t.id, { completed: true, progress: 100 })
  }

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
                  : g.active.length === 0 ? (
                      <span className={cn("text-[10px] font-semibold", g.done > 0 ? "text-emerald-500" : "text-neutral-300 dark:text-neutral-600")}>
                        {g.done > 0 ? `\u2713 ${g.done} done` : "clear"}
                      </span>
                    ) : (
                      <span className="text-[10px] font-medium text-neutral-400">
                        {g.done > 0 ? `${g.done}/${g.done + g.active.length} done` : `${g.active.length} left`}
                      </span>
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
                      <button onClick={() => handleComplete(t)} className="shrink-0">
                        <span className={cn("flex h-4 w-4 items-center justify-center rounded-[10px] border transition-colors", g.box)} />
                      </button>
                      <button
                        onClick={() => handleComplete(t)}
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

/* ── Health Track (habits + sleep + challenges) ──────── */
const rowBase =
  "flex w-full items-center gap-2.5 rounded-[10px] border border-neutral-100 bg-white px-3 py-2 text-left transition-colors hover:bg-neutral-50 dark:border-neutral-800 dark:bg-white/[0.03] dark:hover:bg-neutral-800/60"

function HabitsChallengesSection() {
  const habits = useHabitStore((s) => s.habits)
  const toggleDay = useHabitStore((s) => s.toggleDay)
  const getStreak = useHabitStore((s) => s.getStreak)
  const challenges = useChallengeStore((s) => s.challenges)
  const toggleDayC = useChallengeStore((s) => s.toggleDay)
  const getProgress = useChallengeStore((s) => s.getProgress)
  const sleepEntries = useSleepStore((s) => s.entries)
  const addSleep = useSleepStore((s) => s.addEntry)
  const deleteSleep = useSleepStore((s) => s.deleteEntry)

  const today = format(new Date(), "yyyy-MM-dd")

  const displayedHabits = useMemo(() => habits.slice(0, 6), [habits])
  const todaySleep = useMemo(() => sleepEntries.find((e) => e.date === today) ?? null, [sleepEntries, today])
  const bestStreak = Math.max(...habits.map((h) => getStreak(h.id)), 0)

  const activeChallenges = useMemo(
    () =>
      challenges
        .filter((c) => c.joined)
        .map((c) => ({ challenge: c, todayDay: c.days.find((d) => d.date === today) ?? null }))
        .filter((x) => x.todayDay)
        .slice(0, 3),
    [challenges, today]
  )

  const habitDone = displayedHabits.filter((h) => h.records.find((r) => r.date === today)?.completed).length
  const challengeDone = activeChallenges.filter(({ todayDay }) => todayDay?.completed).length
  const totalItems = displayedHabits.length + 1 + activeChallenges.length
  const doneItems = habitDone + (todaySleep ? 1 : 0) + challengeDone
  const pct = totalItems > 0 ? Math.round((doneItems / totalItems) * 100) : 0

  const toggleSleep = () => {
    if (todaySleep) {
      deleteSleep(todaySleep.id)
    } else {
      addSleep({ date: today, bedtime: "22:00", wakeTime: "06:00", quality: 4, notes: "" })
    }
  }

  const R = 20
  const CIRC = 2 * Math.PI * R

  return (
    <Card delay={0.1} className="overflow-visible">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-pink-100 dark:bg-pink-900/30">
            <Heart className="h-4 w-4 text-pink-500" />
          </div>
          <h3 className="text-sm font-bold tracking-tight text-neutral-900 dark:text-white">Health Track</h3>
          <span className="text-[10px] text-neutral-400 dark:text-neutral-500">{format(new Date(), "MMM d, yyyy")}</span>
        </div>
        {bestStreak > 0 && (
          <span className="flex shrink-0 items-center gap-1 rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-bold text-orange-600 dark:bg-orange-900/30 dark:text-orange-400">
            <Flame className="h-3 w-3" /> {bestStreak}d streak
          </span>
        )}
      </div>

      {totalItems === 0 ? (
        <Link href="/habits" className="flex flex-col items-center gap-2 py-8 text-neutral-400">
          <Zap className="h-7 w-7" />
          <p className="text-xs">Start tracking health</p>
        </Link>
      ) : (
        <>
          <div className="mb-4 flex items-center gap-3 rounded-[12px] border border-pink-100 bg-pink-50/60 px-3.5 py-3 dark:border-pink-900/30 dark:bg-pink-900/10">
            <div className="relative h-12 w-12 shrink-0">
              <svg viewBox="0 0 48 48" className="h-12 w-12 -rotate-90">
                <circle cx="24" cy="24" r={R} fill="none" strokeWidth="5" className="stroke-pink-100 dark:stroke-neutral-800" />
                <circle
                  cx="24"
                  cy="24"
                  r={R}
                  fill="none"
                  strokeWidth="5"
                  strokeLinecap="round"
                  className="stroke-pink-500"
                  strokeDasharray={CIRC}
                  strokeDashoffset={CIRC * (1 - pct / 100)}
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-neutral-800 dark:text-neutral-100">
                {pct}%
              </span>
            </div>
            <div className="min-w-0">
              <p className="text-[13px] font-bold text-neutral-900 dark:text-white">Today&apos;s health</p>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                {doneItems} of {totalItems} done · habits, sleep &amp; challenges
              </p>
              <div className="mt-1.5 h-1.5 w-full min-w-[64px] overflow-hidden rounded-full bg-white dark:bg-neutral-800">
                <div className="h-full rounded-full bg-pink-500 transition-all" style={{ width: `${pct}%` }} />
              </div>
            </div>
          </div>

          {displayedHabits.length > 0 && (
            <div className="mb-3">
              <div className="mb-1.5 flex items-center justify-between px-0.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">Habits</span>
                {habits.length > 6 && (
                  <Link href="/habits" className="text-[10px] font-medium text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300">
                    +{habits.length - 6} more
                  </Link>
                )}
              </div>
              <div className="space-y-1.5">
                {displayedHabits.map((h) => {
                  const Icon = habitIconMap[h.icon] || Heart
                  const c = habitColors[h.category] || habitColors.health
                  const done = h.records.find((r) => r.date === today)?.completed ?? false
                  const streak = getStreak(h.id)
                  return (
                    <button key={h.id} onClick={() => toggleDay(h.id, today)} className={rowBase}>
                      <span className={cn(
                        "flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[5px] border-2 transition-all",
                        done ? c.check : c.box
                      )}>
                        {done && <Check className="h-3 w-3" />}
                      </span>
                      <span className={cn("flex h-6 w-6 shrink-0 items-center justify-center rounded-lg", c.tile)}>
                        <Icon className="h-3 w-3" />
                      </span>
                      <span className={cn("min-w-0 flex-1 truncate text-[13px] font-medium", done ? "text-neutral-400 line-through dark:text-neutral-500" : "text-neutral-800 dark:text-neutral-200")}>
                        {h.name}
                      </span>
                      {streak > 0 && (
                        <span className="flex shrink-0 items-center gap-0.5 text-[10px] font-medium text-amber-500">
                          <Flame className="h-3 w-3" /> {streak}
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          <div className="mb-3">
            <div className="mb-1.5 px-0.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">Sleep</span>
            </div>
            <button onClick={toggleSleep} className={rowBase}>
              <span className={cn(
                "flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[5px] border-2 transition-all",
                todaySleep ? "border-indigo-400 bg-indigo-500 text-white" : "border-indigo-400/70"
              )}>
                {todaySleep && <Check className="h-3 w-3" />}
              </span>
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-300">
                <Moon className="h-3 w-3" />
              </span>
              <span className={cn("min-w-0 flex-1 truncate text-[13px] font-medium", todaySleep ? "text-neutral-400 line-through dark:text-neutral-500" : "text-neutral-800 dark:text-neutral-200")}>
                Sleep
              </span>
              <span className={cn(
                "shrink-0 rounded-full px-2 py-px text-[10px] font-semibold",
                todaySleep
                  ? "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-300"
                  : "bg-neutral-100 text-neutral-400 dark:bg-neutral-800 dark:text-neutral-500"
              )}>
                {todaySleep ? `${todaySleep.hours}h · ${todaySleep.quality}/5` : "Tap to log"}
              </span>
            </button>
          </div>

          {activeChallenges.length > 0 && (
            <div>
              <div className="mb-1.5 px-0.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">Challenges</span>
              </div>
              <div className="space-y-1.5">
                {activeChallenges.map(({ challenge: c, todayDay }) => {
                  const done = todayDay?.completed ?? false
                  const progress = getProgress(c.id)
                  return (
                    <button key={c.id} onClick={() => toggleDayC(c.id, todayDay!.day)} className={rowBase}>
                      <span className={cn(
                        "flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[5px] border-2 transition-all",
                        done ? "border-rose-400 bg-rose-500 text-white" : "border-rose-400/70"
                      )}>
                        {done && <Check className="h-3 w-3" />}
                      </span>
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-300">
                        <Trophy className="h-3 w-3" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className={cn("block truncate text-[13px] font-medium", done ? "text-neutral-400 line-through dark:text-neutral-500" : "text-neutral-800 dark:text-neutral-200")}>
                          {c.title}
                        </span>
                        <span className="mt-1 block h-1 w-full min-w-[48px] overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
                          <span className="block h-full rounded-full bg-rose-500 transition-all" style={{ width: `${progress}%` }} />
                        </span>
                      </span>
                      <span className="shrink-0 text-[10px] font-bold text-neutral-400 dark:text-neutral-500">
                        Day {todayDay!.day} · {progress}%
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </>
      )}
    </Card>
  )
}

/* ── Cash Flow ───────────────────────────────────────── */
function FinanceSection() {
  const incomes = useFinanceStore((s) => s.incomes)
  const expenses = useFinanceStore((s) => s.expenses)

  const { totalIncome, totalExpenses, net, changePct, monthlyData, recentExpenses } = useMemo(() => {
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
    const entries = Object.entries(monthMap).sort(([a], [b]) => a.localeCompare(b))
    const md = entries.slice(-6).map(([month, v]) => ({
      month: month.slice(5),
      income: v.income,
      expense: v.expense,
      net: v.income - v.expense,
    }))

    let cp = 0
    if (md.length >= 2) {
      const prev = md[md.length - 2].net
      const cur = md[md.length - 1].net
      if (prev !== 0) cp = Math.round(((cur - prev) / Math.abs(prev)) * 100)
    }

    const re = [...expenses].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 3)

    return { totalIncome: ti, totalExpenses: te, net: n, changePct: cp, monthlyData: md, recentExpenses: re }
  }, [incomes, expenses])

  const isPositive = net >= 0

  return (
    <Card delay={0.15} className="overflow-hidden">
      <CardHeader icon={Wallet} label="Cash Flow" color="text-green-600 dark:text-green-400" />
      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
        <span className={cn("text-2xl font-bold tracking-tight", isPositive ? "text-neutral-900 dark:text-white" : "text-rose-500 dark:text-rose-400")}>
          {isPositive ? "+" : "−"}₹{Math.abs(net).toLocaleString("en-IN")}
        </span>
        {monthlyData.length >= 2 && (
          <span
            className={cn(
              "flex h-6 items-center gap-1 rounded-full px-2 text-[11px] font-bold",
              changePct >= 0
                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                : "bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400"
            )}
          >
            {changePct >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
            {Math.abs(changePct)}% vs last month
          </span>
        )}
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
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={monthlyData} margin={{ top: 6, right: 4, left: 4, bottom: 0 }}>
                <defs>
                  <linearGradient id="cf-income" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22c55e" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#22c55e" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="cf-expense" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f43f5e" stopOpacity={0.26} />
                    <stop offset="100%" stopColor="#f43f5e" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#a3a3a3" }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip
                  contentStyle={{ borderRadius: 10, border: "1px solid #e5e5e5", fontSize: 12, boxShadow: "0 8px 24px rgba(0,0,0,0.08)" }}
                  formatter={(value) => `₹${Number(value ?? 0).toLocaleString("en-IN")}`}
                  cursor={{ stroke: "#a3a3a3", strokeDasharray: "3 3" }}
                />
                <Area type="monotone" dataKey="expense" name="Expense" stroke="#f43f5e" strokeWidth={2} fill="url(#cf-expense)" dot={false} activeDot={{ r: 3 }} />
                <Area type="monotone" dataKey="income" name="Income" stroke="#22c55e" strokeWidth={2} fill="url(#cf-income)" dot={false} activeDot={{ r: 3 }} />
                <Line type="monotone" dataKey="net" name="Net" stroke="#9ca3af" strokeWidth={2.5} strokeDasharray="4 3" dot={false} activeDot={{ r: 4 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-1 flex items-center gap-3 text-[10px] text-neutral-500">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-green-500" /> Income
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-rose-500" /> Expenses
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-0.5 w-3 rounded-full bg-neutral-400" /> Net
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
const investmentGrads: Record<string, { grad: string; solid: string }> = {
  Stocks: { grad: "url(#inv-stocks)", solid: "#3b82f6" },
  "Mutual Funds": { grad: "url(#inv-mf)", solid: "#8b5cf6" },
  SIPs: { grad: "url(#inv-sip)", solid: "#22c55e" },
}

function InvestmentsSection() {
  const sips = useFinanceStore((s) => s.sips)
  const stocks = useFinanceStore((s) => s.stocks)
  const mutualFunds = useFinanceStore((s) => s.mutualFunds)

  const { totalCurrent, investedTotal, totalGain, totalGainPct, allocationData } = useMemo(() => {
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
      { name: "Stocks", value: stockCur, invested: stockInv, color: "#3b82f6" },
      { name: "Mutual Funds", value: mfCur, invested: mfInv, color: "#8b5cf6" },
      { name: "SIPs", value: sipCur, invested: sipInv, color: "#22c55e" },
    ].filter((d) => d.value > 0)

    return { totalCurrent: tc, investedTotal: ti, totalGain: tg, totalGainPct: tp, allocationData: alloc }
  }, [sips, stocks, mutualFunds])

  const isGain = totalGain >= 0
  const topMovers = useMemo(() =>
    stocks.slice(0, 3).map((s) => ({
      name: s.name,
      change: (s.currentPrice - s.buyPrice) * s.quantity,
      inv: s.buyPrice * s.quantity,
      pct: s.buyPrice > 0 ? Math.round(((s.currentPrice - s.buyPrice) / s.buyPrice) * 100) : 0,
    })),
  [stocks])

  return (
    <Card delay={0.2} className="overflow-hidden">
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
          <div className="flex items-center gap-4">
            <div className="relative h-20 w-20 shrink-0 sm:h-24 sm:w-24">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <defs>
                    <linearGradient id="inv-stocks" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#60a5fa" />
                      <stop offset="100%" stopColor="#2563eb" />
                    </linearGradient>
                    <linearGradient id="inv-mf" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#c4b5fd" />
                      <stop offset="100%" stopColor="#7c3aed" />
                    </linearGradient>
                    <linearGradient id="inv-sip" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#4ade80" />
                      <stop offset="100%" stopColor="#16a34a" />
                    </linearGradient>
                  </defs>
                  <Pie
                    data={allocationData}
                    cx="50%"
                    cy="50%"
                    innerRadius="58%"
                    outerRadius="98%"
                    dataKey="value"
                    stroke="none"
                    paddingAngle={4}
                    cornerRadius={6}
                  >
                    {allocationData.map((entry, i) => (
                      <Cell key={i} fill={investmentGrads[entry.name]?.grad ?? entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ borderRadius: 10, border: "1px solid #e5e5e5", fontSize: 12, boxShadow: "0 8px 24px rgba(0,0,0,0.08)" }}
                    formatter={(value) => `₹${Number(value ?? 0).toLocaleString("en-IN")}`}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-[8px] font-medium text-neutral-400 sm:text-[9px]">Total</span>
                <span className="text-[11px] font-bold text-neutral-900 dark:text-white sm:text-sm">₹{(totalCurrent / 1000).toFixed(1)}k</span>
                <span className={cn("flex items-center gap-0.5 rounded-full px-1 text-[8px] font-bold sm:text-[9px]", isGain ? "text-green-600 dark:text-green-400" : "text-rose-500 dark:text-rose-400")}>
                  {isGain ? "+" : "−"}{Math.abs(totalGainPct)}%
                </span>
              </div>
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
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
              <p className="mt-1.5 text-[11px] text-neutral-400">
                invested ₹{investedTotal.toLocaleString("en-IN")} · worth ₹{totalCurrent.toLocaleString("en-IN")}
              </p>
              <div className="mt-2 flex items-center gap-1.5">
                {allocationData.map((d) => (
                  <span key={d.name} className="flex h-2 flex-1 overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
                    <span className="h-full rounded-full" style={{ width: `${totalCurrent > 0 ? (d.value / totalCurrent) * 100 : 0}%`, backgroundColor: d.color }} />
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-4 space-y-2.5">
            {allocationData.map((d) => {
              const pct = totalCurrent > 0 ? Math.round((d.value / totalCurrent) * 100) : 0
              const dGain = d.value - d.invested
              return (
                <div key={d.name}>
                  <div className="mb-1 flex items-center justify-between text-[11px]">
                    <span className="flex items-center gap-1.5 font-medium text-neutral-600 dark:text-neutral-300">
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: d.color }} />
                      {d.name}
                    </span>
                    <span className="flex items-center gap-2">
                      <span className="text-neutral-400">₹{(d.value / 1000).toFixed(1)}k</span>
                      <span className={cn("rounded-full px-1.5 py-px text-[10px] font-bold", dGain >= 0 ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400")}>
                        {dGain >= 0 ? "+" : "−"}{Math.abs(Math.round((dGain / (d.invested || 1)) * 100))}%
                      </span>
                    </span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${pct}%`, background: investmentGrads[d.name]?.grad ?? d.color }}
                    />
                  </div>
                </div>
              )
            })}
          </div>

          {topMovers.length > 0 && (
            <div className="mt-4">
              <span className="mb-1.5 block px-0.5 text-[10px] font-medium text-neutral-400">Top Stocks</span>
              <div className="space-y-1">
                {topMovers.map((s) => (
                  <div key={s.name} className="flex items-center justify-between rounded-lg px-2 py-1.5 transition-colors hover:bg-neutral-50 dark:hover:bg-white/5">
                    <div className="min-w-0">
                      <p className="truncate text-xs font-medium text-neutral-700 dark:text-neutral-300">{s.name}</p>
                      <p className="text-[10px] text-neutral-400">₹{s.inv.toLocaleString("en-IN")} invested</p>
                    </div>
                    <span className={cn("ml-2 shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-bold", s.pct >= 0 ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400")}>
                      {s.pct >= 0 ? "+" : "−"}{Math.abs(s.pct)}%
                    </span>
                  </div>
                ))}
              </div>
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