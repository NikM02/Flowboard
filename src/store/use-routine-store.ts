import { create } from "zustand"
import { persist } from "zustand/middleware"

export interface RoutineEvent {
  id: string
  date: string
  title: string
  description?: string
  startHour: number
  endHour: number
  taskId?: string
  category?: string
  color?: string
  completed: boolean
  createdAt: number
}

interface RoutineArchive {
  date: string
  events: RoutineEvent[]
  archivedAt: number
}

type RoutineStore = {
  events: RoutineEvent[]
  archives: RoutineArchive[]
  addEvent: (event: Omit<RoutineEvent, "id" | "completed" | "createdAt">) => void
  updateEvent: (id: string, updates: Partial<RoutineEvent>) => void
  deleteEvent: (id: string) => void
  toggleComplete: (id: string) => void
  getEventsForDate: (date: string) => RoutineEvent[]
  getEventsForHour: (date: string, hour: number) => RoutineEvent[]
  archiveOldEvents: () => void
  addTaskToRoutine: (date: string, taskId: string, title: string, startHour: number, endHour: number) => void
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

const PASTEL_COLORS = [
  "#ffe1e6", "#fce7f3", "#fae8ff", "#e4daff",
  "#ddd6fe", "#c7d2fe", "#dbeafe", "#e0f2fe",
  "#cff2fe", "#ccfbf1", "#d1fae5", "#dcfce7",
  "#ecfccb", "#fef9c3", "#fef3c7", "#ffedd5",
  "#fed7aa", "#ffe4e6", "#fbcfe8", "#e0e7ff",
]

export function getRandomPastelColor(): string {
  return PASTEL_COLORS[Math.floor(Math.random() * PASTEL_COLORS.length)]
}

function cleanOldArchives(archives: RoutineArchive[]): RoutineArchive[] {
  const cutoff = Date.now() - 15 * 24 * 60 * 60 * 1000
  return archives.filter((a) => a.archivedAt > cutoff)
}

export const useRoutineStore = create<RoutineStore>()(
  persist(
    (set, get) => ({
      events: [],
      archives: [],

      addEvent: (event) => {
        const newEvent: RoutineEvent = {
          ...event,
          id: generateId(),
          completed: false,
          createdAt: Date.now(),
          color: event.color || getRandomPastelColor(),
        }
        set((s) => ({ events: [...s.events, newEvent] }))
      },

      updateEvent: (id, updates) => {
        set((s) => ({
          events: s.events.map((e) => (e.id === id ? { ...e, ...updates } : e)),
        }))
      },

      deleteEvent: (id) => {
        set((s) => ({ events: s.events.filter((e) => e.id !== id) }))
      },

      toggleComplete: (id) => {
        set((s) => ({
          events: s.events.map((e) =>
            e.id === id ? { ...e, completed: !e.completed } : e
          ),
        }))
      },

      getEventsForDate: (date) => {
        return get().events.filter((e) => e.date === date)
      },

      getEventsForHour: (date, hour) => {
        return get().events.filter(
          (e) => e.date === date && e.startHour <= hour && e.endHour > hour
        )
      },

      archiveOldEvents: () => {
        const { events, archives } = get()
        const cutoff = Date.now() - 15 * 24 * 60 * 60 * 1000
        const oldEvents = events.filter((e) => e.createdAt < cutoff)
        const recentEvents = events.filter((e) => e.createdAt >= cutoff)

        if (oldEvents.length > 0) {
          const dateGroups: Record<string, RoutineEvent[]> = {}
          for (const e of oldEvents) {
            if (!dateGroups[e.date]) dateGroups[e.date] = []
            dateGroups[e.date].push(e)
          }

          const newArchives = Object.entries(dateGroups).map(([date, evts]) => ({
            date,
            events: evts,
            archivedAt: Date.now(),
          }))

          set({
            events: recentEvents,
            archives: cleanOldArchives([...archives, ...newArchives]),
          })
        } else {
          set({ archives: cleanOldArchives(archives) })
        }
      },

      addTaskToRoutine: (date, taskId, title, startHour, endHour) => {
        const newEvent: RoutineEvent = {
          id: generateId(),
          date,
          title,
          taskId,
          startHour,
          endHour,
          completed: false,
          createdAt: Date.now(),
          color: getRandomPastelColor(),
        }
        set((s) => ({ events: [...s.events, newEvent] }))
      },
    }),
    {
      name: "nexus-routine-store",
    }
  )
)
