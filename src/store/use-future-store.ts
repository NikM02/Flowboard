import { create } from "zustand"
import type { FutureGoal, GrowthPeriod } from "@/types"
import { generateId } from "@/lib/utils"

type FutureStore = {
  goals: FutureGoal[]
  addGoal: (data: { title: string; category: FutureGoal["category"]; targetValue: number; currentValue: number; period: GrowthPeriod; periodKey: string }) => void
  updateGoal: (id: string, data: Partial<FutureGoal>) => void
  deleteGoal: (id: string) => void
  toggleGoalComplete: (id: string) => void
  clearAll: () => void
}

export const useFutureStore = create<FutureStore>((set) => ({
  goals: [],

  addGoal: (data) => {
    const goal: FutureGoal = { id: generateId(), ...data, completed: false, createdAt: Date.now() }
    set((s) => ({ goals: [...s.goals, goal] }))
  },
  updateGoal: (id, data) => {
    set((s) => ({ goals: s.goals.map((g) => (g.id === id ? { ...g, ...data } : g)) }))
  },
  deleteGoal: (id) => {
    set((s) => ({ goals: s.goals.filter((g) => g.id !== id) }))
  },
  toggleGoalComplete: (id) => {
    set((s) => ({
      goals: s.goals.map((g) => (g.id === id ? { ...g, completed: !g.completed } : g)),
    }))
  },
  clearAll: () => set({ goals: [] }),
}))
