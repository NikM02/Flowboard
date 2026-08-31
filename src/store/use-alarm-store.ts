import { create } from "zustand"
import { generateId } from "@/lib/utils"
import type { Alarm } from "@/types"

type AlarmStore = {
  alarms: Alarm[]
  addAlarm: (data: { label: string; time: string }) => void
  updateAlarm: (id: string, data: Partial<Alarm>) => void
  deleteAlarm: (id: string) => void
  toggleAlarm: (id: string) => void
}

export const useAlarmStore = create<AlarmStore>((set) => ({
  alarms: [],

  addAlarm: (data) =>
    set((s) => ({
      alarms: [
        ...s.alarms,
        { id: generateId(), label: data.label, time: data.time, enabled: true, createdAt: Date.now() },
      ],
    })),

  updateAlarm: (id, data) =>
    set((s) => ({
      alarms: s.alarms.map((a) => (a.id === id ? { ...a, ...data } : a)),
    })),

  deleteAlarm: (id) =>
    set((s) => ({ alarms: s.alarms.filter((a) => a.id !== id) })),

  toggleAlarm: (id) =>
    set((s) => ({
      alarms: s.alarms.map((a) => (a.id === id ? { ...a, enabled: !a.enabled } : a)),
    })),
}))
