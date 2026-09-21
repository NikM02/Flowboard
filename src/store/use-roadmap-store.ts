import { create } from "zustand"
import { generateId } from "@/lib/utils"
import type {
  Roadmap, RoadmapPhase, RoadmapPhaseTask, PhaseStatus, RoadmapPriority,
  RoadmapCategory,
} from "@/types"

type AddRoadmapInput = {
  title: string
  description?: string
  emoji: string
  category: RoadmapCategory
  target?: string
  deadline?: string
  priority: RoadmapPriority
}

type AddPhaseInput = {
  title: string
  description?: string
  status?: PhaseStatus
  startDate?: string
  dueDate?: string
  priority?: RoadmapPriority
}

type AddTaskInput = {
  title: string
  priority?: RoadmapPriority
  dueDate?: string
}

type RoadmapStore = {
  roadmaps: Roadmap[]
  addRoadmap: (data: AddRoadmapInput) => void
  addRoadmapFull: (roadmap: Roadmap) => void
  updateRoadmap: (
    id: string,
    data: Partial<Omit<Roadmap, "id" | "createdAt" | "updatedAt" | "phases">>
  ) => void
  deleteRoadmap: (id: string) => void
  addPhase: (roadmapId: string, data: AddPhaseInput) => void
  updatePhase: (
    roadmapId: string,
    phaseId: string,
    data: Partial<Omit<RoadmapPhase, "id" | "createdAt">>
  ) => void
  setPhaseStatus: (roadmapId: string, phaseId: string, status: PhaseStatus) => void
  deletePhase: (roadmapId: string, phaseId: string) => void
  addTask: (roadmapId: string, phaseId: string, data: AddTaskInput) => void
  updateTask: (
    roadmapId: string, phaseId: string, taskId: string,
    data: Partial<Pick<RoadmapPhaseTask, "title" | "priority" | "dueDate" | "completed">>
  ) => void
  toggleTask: (roadmapId: string, phaseId: string, taskId: string) => void
  deleteTask: (roadmapId: string, phaseId: string, taskId: string) => void
  addNote: (roadmapId: string, phaseId: string, text: string) => void
  deleteNote: (roadmapId: string, phaseId: string, noteId: string) => void
  clearAll: () => void
}

function touch<R extends Roadmap>(r: R): R {
  return { ...r, updatedAt: Date.now() }
}

const LEGACY_STATUS: Record<string, PhaseStatus> = {
  todo: "not-started",
  "in-progress": "in-progress",
  done: "completed",
}

export const STATUS_ORDER: PhaseStatus[] = [
  "not-started",
  "planning",
  "in-progress",
  "on-hold",
  "blocked",
  "completed",
]

export const NEXT_STATUS: Record<PhaseStatus, PhaseStatus> = {
  "not-started": "planning",
  planning: "in-progress",
  "in-progress": "on-hold",
  "on-hold": "blocked",
  blocked: "completed",
  completed: "not-started",
}

export function normalizeRoadmap(r: any): Roadmap {
  return {
    id: r?.id ?? generateId(),
    title: r?.title ?? "Untitled roadmap",
    description: r?.description ?? "",
    emoji: r?.emoji ?? "🎯",
    category: r?.category ?? "product",
    target: r?.target ?? "",
    deadline: r?.deadline ?? undefined,
    priority: r?.priority ?? "medium",
    createdAt: r?.createdAt ?? Date.now(),
    updatedAt: r?.updatedAt ?? Date.now(),
    phases: Array.isArray(r?.phases)
      ? r.phases.map((p: any) => ({
          id: p?.id ?? generateId(),
          title: p?.title ?? "Untitled milestone",
          description: p?.description ?? "",
          status: LEGACY_STATUS[p?.status] ?? p?.status ?? "not-started",
          startDate: p?.startDate ?? undefined,
          dueDate: p?.dueDate ?? undefined,
          priority: p?.priority ?? "medium",
          completedAt: p?.completedAt ?? undefined,
          tasks: Array.isArray(p?.tasks)
            ? p.tasks.map((t: any) => ({
                id: t?.id ?? generateId(),
                title: t?.title ?? "",
                completed: !!t?.completed,
                priority: t?.priority ?? "medium",
                dueDate: t?.dueDate ?? undefined,
                completedAt: t?.completedAt ?? undefined,
              }))
            : [],
          notes: Array.isArray(p?.notes)
            ? p.notes.map((n: any) => ({
                id: n?.id ?? generateId(),
                text: n?.text ?? "",
                createdAt: n?.createdAt ?? Date.now(),
              }))
            : [],
          createdAt: p?.createdAt ?? Date.now(),
        }))
      : [],
  }
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
        target: data.target ?? "",
        createdAt: now,
        updatedAt: now,
        phases: [],
      }
      return { roadmaps: [roadmap, ...s.roadmaps] }
    }),

  addRoadmapFull: (roadmap) =>
    set((s) => ({ roadmaps: [roadmap, ...s.roadmaps].sort((a, b) => b.updatedAt - a.updatedAt) })),

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
          ? touch({
              ...r,
              phases: [
                ...r.phases,
                {
                  id: generateId(),
                  status: "not-started",
                  priority: "medium",
                  tasks: [],
                  notes: [],
                  createdAt: Date.now(),
                  ...data,
                },
              ],
            })
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
          ? touch({
              ...r,
              phases: r.phases.map((p) =>
                p.id === phaseId
                  ? {
                      ...p,
                      status,
                      completedAt: status === "completed" ? (p.completedAt ?? Date.now()) : undefined,
                    }
                  : p
              ),
            })
          : r
      ),
    })),

  deletePhase: (roadmapId, phaseId) =>
    set((s) => ({
      roadmaps: s.roadmaps.map((r) =>
        r.id === roadmapId ? touch({ ...r, phases: r.phases.filter((p) => p.id !== phaseId) }) : r
      ),
    })),

  addTask: (roadmapId, phaseId, data) =>
    set((s) => ({
      roadmaps: s.roadmaps.map((r) =>
        r.id === roadmapId
          ? touch({
              ...r,
              phases: r.phases.map((p) =>
                p.id === phaseId
                  ? {
                      ...p,
                      tasks: [
                        ...p.tasks,
                        {
                          id: generateId(),
                          completed: false,
                          priority: "medium",
                          ...data,
                        },
                      ],
                    }
                  : p
              ),
            })
          : r
      ),
    })),

  updateTask: (roadmapId, phaseId, taskId, data) =>
    set((s) => ({
      roadmaps: s.roadmaps.map((r) =>
        r.id === roadmapId
          ? touch({
              ...r,
              phases: r.phases.map((p) =>
                p.id === phaseId
                  ? {
                      ...p,
                      tasks: p.tasks.map((t) => (t.id === taskId ? { ...t, ...data } : t)),
                    }
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
                  ? {
                      ...p,
                      tasks: p.tasks.map((t) =>
                        t.id === taskId
                          ? {
                              ...t,
                              completed: !t.completed,
                              completedAt: !t.completed ? Date.now() : undefined,
                            }
                          : t
                      ),
                    }
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
                p.id === phaseId
                  ? { ...p, tasks: p.tasks.filter((t) => t.id !== taskId) }
                  : p
              ),
            })
          : r
      ),
    })),

  addNote: (roadmapId, phaseId, text) =>
    set((s) => ({
      roadmaps: s.roadmaps.map((r) =>
        r.id === roadmapId
          ? touch({
              ...r,
              phases: r.phases.map((p) =>
                p.id === phaseId
                  ? {
                      ...p,
                      notes: [...p.notes, { id: generateId(), text, createdAt: Date.now() }],
                    }
                  : p
              ),
            })
          : r
      ),
    })),

  deleteNote: (roadmapId, phaseId, noteId) =>
    set((s) => ({
      roadmaps: s.roadmaps.map((r) =>
        r.id === roadmapId
          ? touch({
              ...r,
              phases: r.phases.map((p) =>
                p.id === phaseId
                  ? { ...p, notes: p.notes.filter((n) => n.id !== noteId) }
                  : p
              ),
            })
          : r
      ),
    })),

  clearAll: () => set({ roadmaps: [] }),
}))

export function getPhaseProgress(phase: RoadmapPhase): number {
  if (phase.status === "completed") return 100
  if (!phase.tasks.length) return 0
  return Math.round(
    (phase.tasks.filter((t) => t.completed).length / phase.tasks.length) * 100
  )
}

export type RoadmapHealth = "on-track" | "at-risk" | "blocked" | "overdue" | "completed" | "draft"

export function getRoadmapHealth(roadmap: Roadmap): RoadmapHealth {
  const done = roadmap.phases.filter((p) => p.status === "completed").length
  const total = roadmap.phases.length
  if (!total) return "draft"
  if (done === total) return "completed"
  if (roadmap.phases.some((p) => p.status === "blocked")) return "blocked"
  if (roadmap.deadline && new Date(roadmap.deadline).getTime() < Date.now()) return "overdue"
  const pct = (done / total) * 100
  if (
    roadmap.phases.some((p) => p.status === "on-hold") ||
    roadmap.phases.some((p) => p.status === "in-progress") ||
    pct > 40
  ) {
    return pct >= 50 ? "on-track" : "at-risk"
  }
  return "at-risk"
}