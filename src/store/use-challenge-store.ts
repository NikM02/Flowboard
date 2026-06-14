import { create } from "zustand"
import { format, addDays } from "date-fns"
import type { Challenge, ChallengeDay, HViewMode } from "@/types"
import { generateId } from "@/lib/utils"

function generateDays(type: Challenge["type"], fromDate?: string): ChallengeDay[] {
  const total = parseInt(type)
  const days: ChallengeDay[] = []
  const startDate = fromDate ? new Date(fromDate) : new Date()
  for (let i = 0; i < total; i++) {
    const date = addDays(startDate, i)
    days.push({
      day: i + 1,
      date: format(date, "yyyy-MM-dd"),
      completed: false,
      note: "",
    })
  }
  return days
}

type ChallengeStore = {
  challenges: Challenge[]
  viewMode: HViewMode
  selectedChallengeId: string | null
  isCreateModalOpen: boolean
  setViewMode: (mode: HViewMode) => void
  setSelectedChallengeId: (id: string | null) => void
  setIsCreateModalOpen: (open: boolean) => void
  addChallenge: (challenge: Omit<Challenge, "id" | "days" | "createdAt">) => void
  updateChallenge: (id: string, updates: Partial<Challenge>) => void
  deleteChallenge: (id: string) => void
  toggleDay: (challengeId: string, day: number) => void
  getProgress: (challengeId: string) => number
  joinChallenge: (challengeId: string) => void
  leaveChallenge: (challengeId: string) => void
}

export const useChallengeStore = create<ChallengeStore>((set, get) => ({
  challenges: [],
  viewMode: "card",
  selectedChallengeId: null,
  isCreateModalOpen: false,

  setViewMode: (mode) => set({ viewMode: mode }),
  setSelectedChallengeId: (id) => set({ selectedChallengeId: id }),
  setIsCreateModalOpen: (open) => set({ isCreateModalOpen: open }),

  addChallenge: (challenge) => {
    const total = parseInt(challenge.type)
    const start = challenge.startDate ? new Date(challenge.startDate) : new Date()
    const end = challenge.endDate ? new Date(challenge.endDate) : addDays(start, total)
    const days = generateDays(challenge.type, format(start, "yyyy-MM-dd"))
    const newChallenge: Challenge = {
      ...challenge,
      id: generateId(),
      days,
      startDate: format(start, "yyyy-MM-dd"),
      endDate: format(end, "yyyy-MM-dd"),
      createdAt: Date.now(),
    }
    set((state) => ({ challenges: [newChallenge, ...state.challenges] }))
  },

  updateChallenge: (id, updates) => {
    set((state) => ({
      challenges: state.challenges.map((c) => {
        if (c.id !== id) return c
        const updated = { ...c, ...updates }
        if (updates.type || updates.startDate) {
          const start = updated.startDate ? new Date(updated.startDate) : new Date()
          const total = parseInt(updated.type)
          updated.days = generateDays(updated.type, format(start, "yyyy-MM-dd"))
          updated.startDate = format(start, "yyyy-MM-dd")
          updated.endDate = updated.endDate || format(addDays(start, total), "yyyy-MM-dd")
        }
        return updated
      }),
    }))
  },

  deleteChallenge: (id) => {
    set((state) => ({
      challenges: state.challenges.filter((c) => c.id !== id),
      selectedChallengeId: state.selectedChallengeId === id ? null : state.selectedChallengeId,
    }))
  },

  toggleDay: (challengeId, day) => {
    set((state) => ({
      challenges: state.challenges.map((c) => {
        if (c.id !== challengeId) return c
        return { ...c, days: c.days.map((d) => (d.day === day ? { ...d, completed: !d.completed } : d)) }
      }),
    }))
  },

  getProgress: (challengeId) => {
    const c = get().challenges.find((c) => c.id === challengeId)
    if (!c || c.days.length === 0) return 0
    return Math.round((c.days.filter((d) => d.completed).length / c.days.length) * 100)
  },

  joinChallenge: (challengeId) => {
    set((state) => ({
      challenges: state.challenges.map((c) => (c.id === challengeId ? { ...c, joined: true } : c)),
    }))
  },

  leaveChallenge: (challengeId) => {
    set((state) => ({
      challenges: state.challenges.map((c) => (c.id === challengeId ? { ...c, joined: false } : c)),
    }))
  },
}))
