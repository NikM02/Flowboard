import { create } from "zustand"
import type { SkillEntry } from "@/types"
import { generateId } from "@/lib/utils"

type SkillStore = {
  skills: SkillEntry[]
  addSkill: (data: { name: string; source: "book" | "course" | "youtube" | "person"; sourceDetail: string; startDate: string; endDate: string; notes: string }) => void
  updateSkill: (id: string, data: Partial<Pick<SkillEntry, "name" | "source" | "sourceDetail" | "startDate" | "endDate" | "notes">>) => void
  updateProgress: (id: string, progress: number) => void
  completeSkill: (id: string) => void
  deleteSkill: (id: string) => void
  getActive: () => SkillEntry[]
  getCompleted: () => SkillEntry[]
  clearCompleted: () => void
}

export const useSkillStore = create<SkillStore>((set, get) => ({
  skills: [],

  addSkill: (data) => {
    const skill: SkillEntry = {
      id: generateId(),
      ...data,
      progress: 0,
      completed: false,
      createdAt: Date.now(),
    }
    set((s) => ({ skills: [skill, ...s.skills] }))
  },

  updateSkill: (id, data) => {
    set((s) => ({
      skills: s.skills.map((sk) =>
        sk.id === id ? { ...sk, ...data } : sk
      ),
    }))
  },

  updateProgress: (id, progress) => {
    set((s) => ({
      skills: s.skills.map((sk) =>
        sk.id === id ? { ...sk, progress: Math.min(100, Math.max(0, progress)) } : sk
      ),
    }))
  },

  completeSkill: (id) => {
    set((s) => ({
      skills: s.skills.map((sk) =>
        sk.id === id ? { ...sk, completed: true, progress: 100 } : sk
      ),
    }))
  },

  deleteSkill: (id) => {
    set((s) => ({ skills: s.skills.filter((sk) => sk.id !== id) }))
  },

  getActive: () => get().skills.filter((sk) => !sk.completed),
  getCompleted: () => get().skills.filter((sk) => sk.completed),

  clearCompleted: () => {
    set((s) => ({ skills: s.skills.filter((sk) => !sk.completed) }))
  },
}))
