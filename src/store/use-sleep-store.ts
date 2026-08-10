import { create } from "zustand"
import type { SleepEntry } from "@/types"
import { generateId } from "@/lib/utils"

export function computeSleepHours(bedtime: string, wakeTime: string): number {
  const [bh, bm] = bedtime.split(":").map(Number)
  const [wh, wm] = wakeTime.split(":").map(Number)
  let minutes = wh * 60 + wm - (bh * 60 + bm)
  if (minutes < 0) minutes += 24 * 60
  return Math.round((minutes / 60) * 10) / 10
}

type SleepStore = {
  entries: SleepEntry[]
  addEntry: (entry: Omit<SleepEntry, "id" | "hours" | "createdAt">) => void
  updateEntry: (id: string, updates: Partial<SleepEntry>) => void
  deleteEntry: (id: string) => void
  getEntryForDate: (date: string) => SleepEntry | undefined
  getRecent: (n: number) => SleepEntry[]
  getWeekEntries: (endDate?: string) => SleepEntry[]
  getStats: () => {
    avgHours: number
    avgQuality: number
    totalNights: number
    lastNight?: SleepEntry
  }
}

export const useSleepStore = create<SleepStore>((set, get) => ({
  entries: [],

  addEntry: (entry) => {
    const { entries } = get()
    const hours = computeSleepHours(entry.bedtime, entry.wakeTime)
    const newEntry: SleepEntry = {
      ...entry,
      id: generateId(),
      hours,
      createdAt: Date.now(),
    }
    // One entry per night: replace if a record for the same date exists
    const existing = entries.find((e) => e.date === entry.date)
    if (existing) {
      set({
        entries: entries.map((e) => (e.id === existing.id ? { ...newEntry, id: e.id } : e)),
      })
    } else {
      set({ entries: [newEntry, ...entries] })
    }
  },

  updateEntry: (id, updates) => {
    set((state) => ({
      entries: state.entries.map((e) => {
        if (e.id !== id) return e
        const next = { ...e, ...updates }
        return { ...next, hours: computeSleepHours(next.bedtime, next.wakeTime) }
      }),
    }))
  },

  deleteEntry: (id) => {
    set((state) => ({ entries: state.entries.filter((e) => e.id !== id) }))
  },

  getEntryForDate: (date) => get().entries.find((e) => e.date === date),

  getRecent: (n) =>
    [...get().entries].sort((a, b) => b.date.localeCompare(a.date)).slice(0, n),

  getWeekEntries: (endDate) => {
    const end = endDate || new Date().toISOString().slice(0, 10)
    const start = new Date(end)
    start.setDate(start.getDate() - 6)
    const startStr = start.toISOString().slice(0, 10)
    return get()
      .entries.filter((e) => e.date >= startStr && e.date <= end)
      .sort((a, b) => a.date.localeCompare(b.date))
  },

  getStats: () => {
    const { entries, getRecent } = get()
    const recent = getRecent(30)
    const totalNights = recent.length
    const avgHours =
      totalNights > 0
        ? Math.round((recent.reduce((s, e) => s + e.hours, 0) / totalNights) * 10) / 10
        : 0
    const avgQuality =
      totalNights > 0
        ? Math.round(recent.reduce((s, e) => s + e.quality, 0) / totalNights)
        : 0
    const lastNight = getRecent(1)[0]
    return { avgHours, avgQuality, totalNights, lastNight }
  },
}))
