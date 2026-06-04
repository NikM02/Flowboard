import { create } from "zustand"
import { format } from "date-fns"
import type { DopamineEntry } from "@/types"
import { generateId } from "@/lib/utils"

function calcAverage(entry: Omit<DopamineEntry, "id" | "average" | "createdAt" | "date">): number {
  return (entry.mood + entry.energy + entry.motivation + entry.focus + entry.stress + entry.sleep) / 6
}

type DopamineStore = {
  entries: DopamineEntry[]
  getToday: () => DopamineEntry | undefined
  saveToday: (data: { mood: number; energy: number; motivation: number; focus: number; stress: number; sleep: number }) => void
  getHistory: () => DopamineEntry[]
  clearAll: () => void
}

export const useDopamineStore = create<DopamineStore>((set, get) => ({
  entries: [],

  getToday: () => {
    const today = format(new Date(), "yyyy-MM-dd")
    return get().entries.find((e) => e.date === today)
  },

  saveToday: (data) => {
    const today = format(new Date(), "yyyy-MM-dd")
    const existing = get().entries.find((e) => e.date === today)
    const average = Math.round(calcAverage(data) * 10) / 10

    if (existing) {
      set((s) => ({
        entries: s.entries.map((e) =>
          e.date === today ? { ...e, ...data, average } : e
        ),
      }))
    } else {
      const entry: DopamineEntry = {
        id: generateId(),
        date: today,
        ...data,
        average,
        createdAt: Date.now(),
      }
      set((s) => ({ entries: [entry, ...s.entries] }))
    }
  },

  getHistory: () => {
    return [...get().entries].sort((a, b) => b.date.localeCompare(a.date))
  },

  clearAll: () => set({ entries: [] }),
}))
