import { create } from "zustand"
import { generateId } from "@/lib/utils"
import type { Roadmap, RoadmapPhase, RoadmapPhaseTask, PhaseStatus } from "@/types"

type AddPhaseInput = {
  title: string
  description?: string
  status?: PhaseStatus
  reminder?: string
  tasks?: RoadmapPhaseTask[]
}

type RoadmapStore = {
  roadmaps: Roadmap[]
  addRoadmap: (data: { title: string; description?: string; emoji: string; target: string; deadline?: string }) => void
  updateRoadmap: (id: string, data: Partial<Pick<Roadmap, "title" | "description" | "emoji" | "target" | "deadline">>) => void
  deleteRoadmap: (id: string) => void
  addPhase: (roadmapId: string, data: AddPhaseInput) => void
  updatePhase: (roadmapId: string, phaseId: string, data: Partial<Omit<RoadmapPhase, "id" | "createdAt">>) => void
  setPhaseStatus: (roadmapId: string, phaseId: string, status: PhaseStatus) => void
  deletePhase: (roadmapId: string, phaseId: string) => void
  addTask: (roadmapId: string, phaseId: string, title: string) => void
  toggleTask: (roadmapId: string, phaseId: string, taskId: string) => void
  deleteTask: (roadmapId: string, phaseId: string, taskId: string) => void
  clearAll: () => void
}

function touch<R extends Roadmap>(r: R): R {
  return { ...r, updatedAt: Date.now() }
}

export const useRoadmapStore = create<RoadmapStore>((set) => ({
  roadmaps: [],

  addRoadmap: (data) =>
    set((s) => {
      const now = Date.now()
      const roadmap: Roadmap = {
        id: generateId(),
        ...data,
        description: data.description ?? "",
        createdAt: now,
        updatedAt: now,
        phases: [],
      }
      return { roadmaps: [roadmap, ...s.roadmaps] }
    }),

  updateRoadmap: (id, data) =>
    set((s) => ({
      roadmaps: s.roadmaps.map((r) => (r.id === id ? touch({ ...r, ...data }) : r)),
    })),

  deleteRoadmap: (id) =>
    set((s) => ({ roadmaps: s.roadmaps.filter((r) => r.id !== id) })),

  addPhase: (roadmapId, data) =>
    set((s) => ({
      roadmaps: s.roadmaps.map((r) =>
        r.id === roadmapId
          ? touch({ ...r, phases: [...r.phases, { id: generateId(), status: "todo", tasks: [], createdAt: Date.now(), ...data }] })
          : r
      ),
    })),

  updatePhase: (roadmapId, phaseId, data) =>
    set((s) => ({
      roadmaps: s.roadmaps.map((r) =>
        r.id === roadmapId
          ? touch({ ...r, phases: r.phases.map((p) => (p.id === phaseId ? { ...p, ...data } : p)) })
          : r
      ),
    })),

  setPhaseStatus: (roadmapId, phaseId, status) =>
    set((s) => ({
      roadmaps: s.roadmaps.map((r) =>
        r.id === roadmapId
          ? touch({ ...r, phases: r.phases.map((p) => (p.id === phaseId ? { ...p, status } : p)) })
          : r
      ),
    })),

  deletePhase: (roadmapId, phaseId) =>
    set((s) => ({
      roadmaps: s.roadmaps.map((r) =>
        r.id === roadmapId ? touch({ ...r, phases: r.phases.filter((p) => p.id !== phaseId) }) : r
      ),
    })),

  addTask: (roadmapId, phaseId, title) =>
    set((s) => ({
      roadmaps: s.roadmaps.map((r) =>
        r.id === roadmapId
          ? touch({
              ...r,
              phases: r.phases.map((p) =>
                p.id === phaseId
                  ? { ...p, tasks: [...p.tasks, { id: generateId(), title, completed: false }] }
                  : p
              ),
            })
          : r
      ),
    })),

  toggleTask: (roadmapId, phaseId, taskId) =>
    set((s) => ({
      roadmaps: s.roadmaps.map((r) =>
        r.id === roadmapId
          ? touch({
              ...r,
              phases: r.phases.map((p) =>
                p.id === phaseId
                  ? { ...p, tasks: p.tasks.map((t) => (t.id === taskId ? { ...t, completed: !t.completed } : t)) }
                  : p
              ),
            })
          : r
      ),
    })),

  deleteTask: (roadmapId, phaseId, taskId) =>
    set((s) => ({
      roadmaps: s.roadmaps.map((r) =>
        r.id === roadmapId
          ? touch({
              ...r,
              phases: r.phases.map((p) =>
                p.id === phaseId ? { ...p, tasks: p.tasks.filter((t) => t.id !== taskId) } : p
              ),
            })
          : r
      ),
    })),

  clearAll: () => set({ roadmaps: [] }),
}))