"use client"

import { motion } from "framer-motion"
import { CheckCircle2, Circle, Flame, TrendingUp, Target } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { useHabitStore } from "@/store/use-habit-store"
import { useChallengeStore } from "@/store/use-challenge-store"
import { format } from "date-fns"

export function HabitTodayPanel() {
  const { habits, getTodayStats } = useHabitStore()
  const { challenges, getProgress } = useChallengeStore()
  const stats = getTodayStats()

  const avgChallengeProgress = challenges.length
    ? Math.round(challenges.reduce((s, c) => s + getProgress(c.id), 0) / challenges.length)
    : 0
  const totalChallengeDays = challenges.reduce((s, c) => s + c.days.length, 0)
  const completedChallengeDays = challenges.reduce((s, c) => s + c.days.filter((d) => d.completed).length, 0)

  const allStreaks = habits.map((h) => useHabitStore.getState().getStreak(h.id))
  const bestStreak = Math.max(...allStreaks, 0)

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-neutral-200/60 bg-white p-5 dark:border-neutral-800/60 dark:bg-neutral-950"
      >
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Today&apos;s Progress</span>
          <span className="text-xs text-neutral-400">{format(new Date(), "EEEE, MMM d")}</span>
        </div>
        <div className="flex items-center gap-4 mb-4">
          <div className="relative flex h-16 w-16 items-center justify-center">
            <svg className="h-16 w-16 -rotate-90" viewBox="0 0 64 64">
              <circle cx="32" cy="32" r="28" fill="none" stroke="#e5e5e5" strokeWidth="4" className="dark:stroke-neutral-800" />
              <circle cx="32" cy="32" r="28" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round"
                strokeDasharray={`${stats.rate * 1.76} 176`} className="text-neutral-900 dark:text-neutral-50" />
            </svg>
            <span className="absolute text-lg font-bold text-neutral-900 dark:text-neutral-50">{stats.rate}%</span>
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-sm">
              {stats.completed === stats.total ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              ) : (
                <Circle className="h-4 w-4 text-neutral-300" />
              )}
              <span className="text-neutral-600 dark:text-neutral-400">{stats.completed}/{stats.total} habits done</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Flame className={`h-4 w-4 ${bestStreak > 0 ? "text-amber-500" : "text-neutral-300"}`} />
              <span className="text-neutral-600 dark:text-neutral-400">Best streak: {bestStreak} days</span>
            </div>
          </div>
        </div>
        <Progress value={stats.rate} className="h-2" />
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        className="rounded-2xl border border-neutral-200/60 bg-white p-5 dark:border-neutral-800/60 dark:bg-neutral-950"
      >
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Challenge Progress</span>
          <Target className="h-4 w-4 text-neutral-400" />
        </div>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-50">{challenges.length}</p>
            <p className="text-xs text-neutral-400">Active</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-50">{avgChallengeProgress}%</p>
            <p className="text-xs text-neutral-400">Avg progress</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-50">{completedChallengeDays}/{totalChallengeDays}</p>
            <p className="text-xs text-neutral-400">Days done</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-50">
              {challenges.filter((c) => c.joined).length}
            </p>
            <p className="text-xs text-neutral-400">Joined</p>
          </div>
        </div>
        <Progress value={avgChallengeProgress} className="h-2" />
      </motion.div>
    </div>
  )
}
