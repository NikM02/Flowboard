import { create } from "zustand"
import { format } from "date-fns"
import type { DopamineEntry } from "@/types"
import { generateId } from "@/lib/utils"

type DopamineStore = {
  entries: DopamineEntry[]
  isCheckedIn: (date: string) => boolean
  toggleCheckIn: (date: string) => void
  clearAll: () => void
}

export const useDopamineStore = create<DopamineStore>((set, get) => ({
  entries: [],

  isCheckedIn: (date: string) => {
    return get().entries.some((e) => e.date === date)
  },

  toggleCheckIn: (date: string) => {
    const existing = get().entries.find((e) => e.date === date)
    if (existing) {
      set((s) => ({ entries: s.entries.filter((e) => e.date !== date) }))
    } else {
      const entry: DopamineEntry = {
        id: generateId(),
        date,
        mood: 3, energy: 3, motivation: 3, focus: 3, stress: 3, sleep: 3,
        average: 3,
        createdAt: Date.now(),
      }
      set((s) => ({ entries: [entry, ...s.entries] }))
    }
  },

  clearAll: () => set({ entries: [] }),
}))
