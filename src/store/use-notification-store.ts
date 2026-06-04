import { create } from "zustand"

export type Notification = {
  id: string
  title: string
  description: string
  time: number
  read: boolean
}

let counter = 0

type NotificationStore = {
  notifications: Notification[]
  unreadCount: number
  add: (n: Omit<Notification, "id" | "time" | "read">) => void
  markAllRead: () => void
  clear: () => void
}

export const useNotificationStore = create<NotificationStore>((set) => ({
  notifications: [],
  unreadCount: 0,
  add: (n) =>
    set((s) => ({
      notifications: [{ ...n, id: `notif-${++counter}`, time: Date.now(), read: false }, ...s.notifications].slice(0, 50),
      unreadCount: s.unreadCount + 1,
    })),
  markAllRead: () =>
    set((s) => ({
      notifications: s.notifications.map((n) => ({ ...n, read: true })),
      unreadCount: 0,
    })),
  clear: () => set({ notifications: [], unreadCount: 0 }),
}))
