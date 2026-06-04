import { create } from "zustand"
import { format, parseISO, differenceInDays, startOfDay } from "date-fns"
import type { Habit, HabitCategory, HabitIcon } from "@/types"
import { generateId } from "@/lib/utils"

function todayStr(): string {
  return format(new Date(), "yyyy-MM-dd")
}

type DailyRecord = { date: string; completed: boolean }

type HabitStore = {
  habits: Habit[]
  selectedHabitId: string | null
  isCreateModalOpen: boolean
  setSelectedHabitId: (id: string | null) => void
  setIsCreateModalOpen: (open: boolean) => void
  addHabit: (habit: Omit<Habit, "id" | "records" | "createdAt">) => void
  updateHabit: (id: string, updates: Partial<Habit>) => void
  deleteHabit: (id: string) => void
  toggleDay: (habitId: string, date: string) => void
  getTodayStats: () => { completed: number; total: number; rate: number }
  getStreak: (habitId: string) => number
  getRecordsForDate: (date: string) => { habitId: string; name: string; completed: boolean }[]
  getMonthlySummary: (month: string) => { date: string; rate: number; completed: number; total: number }[]
  getLongestStreak: (habitId: string) => number
  getHistoryRange: (habitId: string, start: string, end: string) => DailyRecord[]
}

function getStreak(records: DailyRecord[]): number {
  const sorted = records.filter(r => r.completed).sort((a, b) => b.date.localeCompare(a.date))
  if (sorted.length === 0) return 0
  let streak = 0
  const checkDate = new Date()
  for (const r of sorted) {
    const diff = differenceInDays(startOfDay(checkDate), startOfDay(parseISO(r.date)))
    if (diff === streak) streak++
    else if (diff > streak) break
  }
  return streak
}

function getLongestStreak(records: DailyRecord[]): number {
  const sorted = [...records].sort((a, b) => a.date.localeCompare(b.date))
  let maxStreak = 0
  let currentStreak = 0
  for (const r of sorted) {
    if (r.completed) currentStreak++
    else { maxStreak = Math.max(maxStreak, currentStreak); currentStreak = 0 }
  }
  return Math.max(maxStreak, currentStreak)
}

export const useHabitStore = create<HabitStore>((set, get) => ({
  habits: [],
  selectedHabitId: null,
  isCreateModalOpen: false,

  setSelectedHabitId: (id) => set({ selectedHabitId: id }),
  setIsCreateModalOpen: (open) => set({ isCreateModalOpen: open }),

  addHabit: (habit) => {
    const newHabit: Habit = {
      ...habit,
      id: generateId(),
      records: [{ date: todayStr(), completed: false }],
      createdAt: Date.now(),
    }
    set((s) => ({ habits: [newHabit, ...s.habits] }))
  },

  updateHabit: (id, updates) => {
    set((s) => ({ habits: s.habits.map((h) => (h.id === id ? { ...h, ...updates } : h)) }))
  },

  deleteHabit: (id) => {
    set((s) => ({
      habits: s.habits.filter((h) => h.id !== id),
      selectedHabitId: s.selectedHabitId === id ? null : s.selectedHabitId,
    }))
  },

  toggleDay: (habitId, date) => {
    set((s) => ({
      habits: s.habits.map((h) => {
        if (h.id !== habitId) return h
        const existing = h.records.find((r) => r.date === date)
        if (existing) {
          return { ...h, records: h.records.map((r) => r.date === date ? { ...r, completed: !r.completed } : r) }
        }
        return { ...h, records: [...h.records, { date, completed: true }] }
      }),
    }))
  },

  getTodayStats: () => {
    const today = todayStr()
    const habits = get().habits
    let completed = 0
    for (const h of habits) {
      const r = h.records.find((r) => r.date === today)
      if (r?.completed) completed++
    }
    return { completed, total: habits.length, rate: habits.length ? Math.round((completed / habits.length) * 100) : 0 }
  },

  getStreak: (habitId) => {
    const habit = get().habits.find((h) => h.id === habitId)
    return habit ? getStreak(habit.records) : 0
  },

  getRecordsForDate: (date) => {
    return get().habits.map((h) => {
      const r = h.records.find((r) => r.date === date)
      return { habitId: h.id, name: h.name, completed: r?.completed ?? false }
    })
  },

  getMonthlySummary: (month) => {
    const habits = get().habits
    const [year, m] = month.split("-").map(Number)
    const daysInMonth = new Date(year, m, 0).getDate()
    const result: { date: string; rate: number; completed: number; total: number }[] = []
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${month}-${String(d).padStart(2, "0")}`
      let completed = 0
      for (const h of habits) {
        const r = h.records.find((r) => r.date === dateStr)
        if (r?.completed) completed++
      }
      result.push({ date: dateStr, rate: Math.round((completed / habits.length) * 100), completed, total: habits.length })
    }
    return result
  },

  getLongestStreak: (habitId) => {
    const habit = get().habits.find((h) => h.id === habitId)
    return habit ? getLongestStreak(habit.records) : 0
  },

  getHistoryRange: (habitId, start, end) => {
    const habit = get().habits.find((h) => h.id === habitId)
    if (!habit) return []
    return habit.records.filter((r) => r.date >= start && r.date <= end).sort((a, b) => a.date.localeCompare(b.date))
  },
}))
