import { create } from "zustand"

type CalendarStore = {
  connected: boolean
  email: string
  checking: boolean
  error: string | null
  load: () => Promise<void>
  connect: () => Promise<void>
  disconnect: () => Promise<void>
}

export const useCalendarStore = create<CalendarStore>((set) => ({
  connected: false,
  email: "",
  checking: false,
  error: null,

  load: async () => {
    try {
      const res = await fetch("/api/integrations/status", { cache: "no-store" })
      if (!res.ok) return
      const data = await res.json()
      set({
        connected: data.calendar?.connected ?? false,
        email: data.calendar?.email ?? "",
      })
    } catch {}
  },

  connect: async () => {
    set({ checking: true, error: null })
    try {
      const res = await fetch("/api/calendar/oauth/start")
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data.url) {
        set({ checking: false, error: data.error || "Could not start Google sign-in" })
        return
      }
      window.location.href = data.url
      set({ checking: false })
    } catch {
      set({ checking: false, error: "Network error" })
    }
  },

  disconnect: async () => {
    try {
      await fetch("/api/calendar/disconnect", { method: "POST" })
    } catch {}
    set({ connected: false, email: "", error: null })
  },
}))
