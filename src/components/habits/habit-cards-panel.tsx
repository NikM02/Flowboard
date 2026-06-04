"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Edit3, Trash2, Heart, Dumbbell, Brain, Book, Target, Palette, Users, Sun, Moon, Coffee, Music, Code, Flame, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { useHabitStore } from "@/store/use-habit-store"
import { format, parseISO, isToday } from "date-fns"
import type { Habit, HabitIcon } from "@/types"

const iconMap: Record<HabitIcon, typeof Heart> = {
  heart: Heart, dumbbell: Dumbbell, brain: Brain, book: Book, target: Target,
  palette: Palette, users: Users, sun: Sun, moon: Moon, coffee: Coffee, music: Music, code: Code,
}

const categoryColors: Record<string, { bg: string; text: string; fill: string; ghost: string }> = {
  health: { bg: "bg-rose-100", text: "text-rose-600", fill: "bg-rose-500", ghost: "bg-rose-50" },
  fitness: { bg: "bg-emerald-100", text: "text-emerald-600", fill: "bg-emerald-500", ghost: "bg-emerald-50" },
  mindfulness: { bg: "bg-violet-100", text: "text-violet-600", fill: "bg-violet-500", ghost: "bg-violet-50" },
  learning: { bg: "bg-blue-100", text: "text-blue-600", fill: "bg-blue-500", ghost: "bg-blue-50" },
  productivity: { bg: "bg-amber-100", text: "text-amber-600", fill: "bg-amber-500", ghost: "bg-amber-50" },
  creative: { bg: "bg-pink-100", text: "text-pink-600", fill: "bg-pink-500", ghost: "bg-pink-50" },
  social: { bg: "bg-cyan-100", text: "text-cyan-600", fill: "bg-cyan-500", ghost: "bg-cyan-50" },
}

function HabitCard({ habit, onEdit, onViewHistory }: { habit: Habit; onEdit: (h: Habit) => void; onViewHistory: (h: Habit) => void }) {
  const { toggleDay, deleteHabit, getStreak } = useHabitStore()
  const streak = getStreak(habit.id)
  const today = format(new Date(), "yyyy-MM-dd")
  const todayRecord = habit.records.find((r) => r.date === today)
  const isDoneToday = todayRecord?.completed ?? false

  const thisMonth = format(new Date(), "yyyy-MM")
  const recordsThisMonth = habit.records.filter((r) => r.date.startsWith(thisMonth))
  const monthDone = recordsThisMonth.filter((r) => r.completed).length
  const monthTotal = recordsThisMonth.length
  const monthRate = monthTotal > 0 ? Math.round((monthDone / monthTotal) * 100) : 0

  const Icon = iconMap[habit.icon] || Heart
  const colors = categoryColors[habit.category] || categoryColors.health

  return (
    <motion.div layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      className="group relative rounded-2xl border border-neutral-200/60 bg-white p-4 shadow-sm transition-all hover:shadow-md dark:border-neutral-800/60 dark:bg-neutral-950"
    >
      <div className="flex items-start gap-3">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${colors.bg} dark:bg-opacity-20`}>
          <Icon className={`h-5 w-5 ${colors.text}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">{habit.name}</h3>
              {habit.description && <p className="text-xs text-neutral-400 mt-0.5">{habit.description}</p>}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {streak > 0 && (
                <div className="flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
                  <Flame className="h-3 w-3" />{streak}
                </div>
              )}
              <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onViewHistory(habit)}><Edit3 className="h-3.5 w-3.5" /></Button>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(habit)}><Edit3 className="h-3.5 w-3.5" /></Button>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-red-400" onClick={() => deleteHabit(habit.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
              </div>
            </div>
          </div>

          <div className="mt-3 flex items-center gap-3">
            <button onClick={() => toggleDay(habit.id, today)}
              className={`flex h-8 items-center gap-2 rounded-xl px-3 text-xs font-medium transition-all ${
                isDoneToday ? "bg-neutral-900 text-white dark:bg-neutral-50 dark:text-neutral-900" : "bg-neutral-100 text-neutral-500 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-400"
              }`}
            >
              {isDoneToday ? "✓ Done" : "○ Mark done"}
            </button>
            <div className="flex-1">
              <div className="flex items-center justify-between text-[11px] text-neutral-400 mb-1">
                <span>This month</span><span className="font-medium text-neutral-600 dark:text-neutral-300">{monthRate}%</span>
              </div>
              <Progress value={monthRate} className="h-1.5" />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export function HabitCardsPanel({ onEdit, onViewHistory }: { onEdit: (h: Habit) => void; onViewHistory: (h: Habit) => void }) {
  const { habits, setIsCreateModalOpen } = useHabitStore()

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">All Habits</h3>
        <Button size="sm" onClick={() => setIsCreateModalOpen(true)} className="gap-1 rounded-xl text-xs h-8">
          <Plus className="h-3.5 w-3.5" />New
        </Button>
      </div>
      {habits.length === 0 ? (
        <div className="flex items-center justify-center py-12 text-sm text-neutral-400">No habits yet</div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {habits.map((h) => <HabitCard key={h.id} habit={h} onEdit={onEdit} onViewHistory={onViewHistory} />)}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
