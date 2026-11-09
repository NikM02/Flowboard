import { create } from "zustand"

export type QuarterlyPlan = {
  year: number
  quarter: 1 | 2 | 3 | 4
  plan: string
}

export type MonthlyPlan = {
  year: number
  month: number // 1-12
  plan: string
}

type NorthStarStore = {
  vision: string
  mission: string
  identity: string
  quarterlyPlans: QuarterlyPlan[]
  monthlyPlans: MonthlyPlan[]
  setVision: (v: string) => void
  setMission: (m: string) => void
  setIdentity: (i: string) => void
  setQuarterlyPlan: (year: number, quarter: 1 | 2 | 3 | 4, plan: string) => void
  setMonthlyPlan: (year: number, month: number, plan: string) => void
}

export const useNorthStarStore = create<NorthStarStore>((set) => ({
  vision: "",
  mission: "",
  identity: "",
  quarterlyPlans: [],
  monthlyPlans: [],

  setVision: (v) => set({ vision: v }),
  setMission: (m) => set({ mission: m }),
  setIdentity: (i) => set({ identity: i }),
  setQuarterlyPlan: (year, quarter, plan) =>
    set((s) => {
      const existing = s.quarterlyPlans.find((p) => p.year === year && p.quarter === quarter)
      if (existing) {
        return {
          quarterlyPlans: s.quarterlyPlans.map((p) =>
            p.year === year && p.quarter === quarter ? { ...p, plan } : p
          ),
        }
      }
      return { quarterlyPlans: [...s.quarterlyPlans, { year, quarter, plan }] }
    }),
  setMonthlyPlan: (year, month, plan) =>
    set((s) => {
      const existing = s.monthlyPlans.find((p) => p.year === year && p.month === month)
      if (existing) {
        return {
          monthlyPlans: s.monthlyPlans.map((p) =>
            p.year === year && p.month === month ? { ...p, plan } : p
          ),
        }
      }
      return { monthlyPlans: [...s.monthlyPlans, { year, month, plan }] }
    }),
}))
