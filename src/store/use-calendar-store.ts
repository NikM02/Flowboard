import { create } from "zustand"

const CACHE_KEY = "nexus-calendar-cache"

function readCache(): string | null {
  try {
    return localStorage.getItem(CACHE_KEY)
  } catch {
    return null
  }
}

function writeCache(email: string) {
  try {
    localStorage.setItem(CACHE_KEY, email)
  } catch {}
}

function clearCache() {
  try {
    localStorage.removeItem(CACHE_KEY)
  } catch {}
}

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
  connected: !!readCache(),
  email: readCache() ?? "",
  checking: false,
  error: null,

  load: async () => {
    try {
      const res = await fetch("/api/integrations/status", { cache: "no-store" })
      if (!res.ok) return
      const data = await res.json()
      if (data.calendar?.connected) {
        writeCache(data.calendar.email)
        set({ connected: true, email: data.calendar.email })
      } else {
        clearCache()
        set({ connected: false, email: "" })
      }
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
    clearCache()
    set({ connected: false, email: "", error: null })
  },
}))
