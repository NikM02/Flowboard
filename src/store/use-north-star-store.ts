import { create } from "zustand"
import { generateId } from "@/lib/utils"

export type Pillar = {
  id: string
  title: string
  description: string
  icon: string
}

type NorthStarStore = {
  vision: string
  mission: string
  identity: string
  pillars: Pillar[]
  setVision: (v: string) => void
  setMission: (m: string) => void
  setIdentity: (i: string) => void
  addPillar: (data: { title: string; description: string; icon: string }) => void
  updatePillar: (id: string, data: Partial<Pillar>) => void
  deletePillar: (id: string) => void
}

export const useNorthStarStore = create<NorthStarStore>((set) => ({
  vision: "",
  mission: "",
  identity: "",
  pillars: [],

  setVision: (v) => set({ vision: v }),
  setMission: (m) => set({ mission: m }),
  setIdentity: (i) => set({ identity: i }),
  addPillar: (data) =>
    set((s) => ({ pillars: [...s.pillars, { id: generateId(), ...data }] })),
  updatePillar: (id, data) =>
    set((s) => ({
      pillars: s.pillars.map((p) => (p.id === id ? { ...p, ...data } : p)),
    })),
  deletePillar: (id) =>
    set((s) => ({ pillars: s.pillars.filter((p) => p.id !== id) })),
}))
