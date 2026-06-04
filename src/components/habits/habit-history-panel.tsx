"use client"

import { useMemo, useState } from "react"
import { motion } from "framer-motion"
import { Flame, Calendar, TrendingUp, BarChart3, ChevronDown, ChevronUp } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { useHabitStore } from "@/store/use-habit-store"
import { useChallengeStore } from "@/store/use-challenge-store"
import { format, parseISO, subDays, startOfMonth, endOfMonth } from "date-fns"
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts"

export function HabitHistoryPanel() {
  const { habits, getStreak, getLongestStreak, getHistoryRange } = useHabitStore()
  const { challenges, getProgress } = useChallengeStore()
  const [expandedHabit, setExpandedHabit] = useState<string | null>(null)

  const today = format(new Date(), "yyyy-MM-dd")
  const weekAgo = format(subDays(new Date(), 7), "yyyy-MM-dd")
  const monthAgo = format(subDays(new Date(), 30), "yyyy-MM-dd")

  const allStreaks = habits.map((h) => getStreak(h.id))
  const bestStreak = Math.max(...allStreaks, 0)
  const longestStreak = Math.max(...habits.map((h) => getLongestStreak(h.id)), 0)

  const weeklyData = useMemo(() => {
    const data: { day: string; rate: number }[] = []
    for (let i = 6; i >= 0; i--) {
      const d = format(subDays(new Date(), i), "yyyy-MM-dd")
      let completed = 0
      for (const h of habits) {
        const r = h.records.find((r) => r.date === d)
        if (r?.completed) completed++
      }
      data.push({ day: format(parseISO(d), "EEE"), rate: Math.round((completed / Math.max(habits.length, 1)) * 100) })
    }
    return data
  }, [habits])

  const totalCompleted = habits.reduce((s, h) => s + h.records.filter((r) => r.completed).length, 0)
  const totalRecords = habits.reduce((s, h) => s + h.records.length, 0)
  const overallRate = totalRecords > 0 ? Math.round((totalCompleted / totalRecords) * 100) : 0

  const challengeTotal = challenges.reduce((s, c) => s + c.days.filter((d) => d.completed).length, 0)
  const challengeAll = challenges.reduce((s, c) => s + c.days.length, 0)
  const challengeRate = challengeAll > 0 ? Math.round((challengeTotal / challengeAll) * 100) : 0

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-neutral-200/60 bg-white p-5 dark:border-neutral-800/60 dark:bg-neutral-950"
    >
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 className="h-4 w-4 text-neutral-500" />
        <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">History & Records</h3>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <div className="rounded-xl bg-neutral-50 p-3 dark:bg-neutral-900">
          <p className="text-xl font-bold text-neutral-900 dark:text-neutral-50">{bestStreak}</p>
          <p className="text-[10px] text-neutral-400">Current Streak</p>
        </div>
        <div className="rounded-xl bg-neutral-50 p-3 dark:bg-neutral-900">
          <p className="text-xl font-bold text-neutral-900 dark:text-neutral-50">{longestStreak}</p>
          <p className="text-[10px] text-neutral-400">Longest Streak</p>
        </div>
        <div className="rounded-xl bg-neutral-50 p-3 dark:bg-neutral-900">
          <p className="text-xl font-bold text-neutral-900 dark:text-neutral-50">{overallRate}%</p>
          <p className="text-[10px] text-neutral-400">Success Rate</p>
        </div>
        <div className="rounded-xl bg-neutral-50 p-3 dark:bg-neutral-900">
          <p className="text-xl font-bold text-neutral-900 dark:text-neutral-50">{totalCompleted}</p>
          <p className="text-[10px] text-neutral-400">Total Days</p>
        </div>
      </div>

      <div className="h-40 mb-5">
        <p className="text-xs font-medium text-neutral-500 mb-2">Last 7 Days</p>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={weeklyData} barCategoryGap="30%">
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" vertical={false} />
            <XAxis dataKey="day" tick={{ fontSize: 10, fill: "#a3a3a3" }} axisLine={false} tickLine={false} />
            <YAxis domain={[0, 100]} hide />
            <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e5e5e5", fontSize: 12 }} />
            <Bar dataKey="rate" fill="#171717" radius={[4, 4, 0, 0]} maxBarSize={24} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-medium text-neutral-500 mb-2">Habit Breakdown</p>
        {habits.map((h) => {
          const streak = getStreak(h.id)
          const longest = getLongestStreak(h.id)
          const done = h.records.filter((r) => r.completed).length
          const total = h.records.length
          const rate = total > 0 ? Math.round((done / total) * 100) : 0
          const isExpanded = expandedHabit === h.id

          return (
            <div key={h.id}>
              <button onClick={() => setExpandedHabit(isExpanded ? null : h.id)}
                className="flex w-full items-center gap-3 rounded-xl bg-neutral-50 p-3 text-left dark:bg-neutral-900"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-neutral-900 dark:text-neutral-50">{h.name}</span>
                    <Flame className={`h-3 w-3 ${streak > 0 ? "text-amber-500" : "text-neutral-300"}`} />
                    <span className="text-xs text-neutral-400">{streak}</span>
                  </div>
                  <Progress value={rate} className="h-1.5 mt-1.5" />
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">{rate}%</p>
                  <p className="text-[10px] text-neutral-400">{done}/{total}</p>
                </div>
                {isExpanded ? <ChevronUp className="h-3.5 w-3.5 text-neutral-400" /> : <ChevronDown className="h-3.5 w-3.5 text-neutral-400" />}
              </button>
              {isExpanded && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                  className="overflow-hidden"
                >
                  <div className="grid grid-cols-2 gap-2 p-3 text-xs text-neutral-500">
                    <div><span className="font-medium text-neutral-700 dark:text-neutral-300">Longest streak:</span> {longest} days</div>
                    <div><span className="font-medium text-neutral-700 dark:text-neutral-300">This week:</span> {h.records.filter((r) => r.date >= weekAgo && r.completed).length}/7</div>
                    <div><span className="font-medium text-neutral-700 dark:text-neutral-300">This month:</span> {h.records.filter((r) => r.date >= monthAgo && r.completed).length}</div>
                    <div><span className="font-medium text-neutral-700 dark:text-neutral-300">Created:</span> {format(h.createdAt, "MMM d")}</div>
                  </div>
                </motion.div>
              )}
            </div>
          )
        })}
      </div>

      {challenges.length > 0 && (
        <div className="mt-4 pt-4 border-t border-neutral-100 dark:border-neutral-800">
          <p className="text-xs font-medium text-neutral-500 mb-2">Challenge Summary</p>
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-xl bg-neutral-50 p-2.5 text-center dark:bg-neutral-900">
              <p className="text-lg font-bold text-neutral-900 dark:text-neutral-50">{challengeTotal}</p>
              <p className="text-[10px] text-neutral-400">Days done</p>
            </div>
            <div className="rounded-xl bg-neutral-50 p-2.5 text-center dark:bg-neutral-900">
              <p className="text-lg font-bold text-neutral-900 dark:text-neutral-50">{challengeRate}%</p>
              <p className="text-[10px] text-neutral-400">Rate</p>
            </div>
            <div className="rounded-xl bg-neutral-50 p-2.5 text-center dark:bg-neutral-900">
              <p className="text-lg font-bold text-neutral-900 dark:text-neutral-50">{challenges.length}</p>
              <p className="text-[10px] text-neutral-400">Challenges</p>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  )
}
