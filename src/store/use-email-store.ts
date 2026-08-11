import { create } from "zustand"

const CACHE_KEY = "nexus-email-cache"

type EmailCache = {
  smtpUser: string
  recipient: string
  notifyNew: boolean
  notifyUpdates: boolean
  notifyDue: boolean
}

function readCache(): EmailCache | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    return raw ? (JSON.parse(raw) as EmailCache) : null
  } catch {
    return null
  }
}

function writeCache(cache: EmailCache) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache))
  } catch {}
}

function clearCache() {
  try {
    localStorage.removeItem(CACHE_KEY)
  } catch {}
}

type EmailStore = {
  smtpUser: string
  appPassword: string
  recipient: string
  notifyNew: boolean
  notifyUpdates: boolean
  notifyDue: boolean
  configured: boolean
  connecting: boolean
  error: string | null
  loaded: boolean
  set: (patch: Partial<EmailStore>) => void
  load: () => Promise<void>
  save: () => Promise<boolean>
  disconnect: () => Promise<void>
}

export const useEmailStore = create<EmailStore>((set, get) => {
  const cached = readCache()

  return {
    smtpUser: cached?.smtpUser ?? "",
    appPassword: "",
    recipient: cached?.recipient ?? "",
    notifyNew: cached?.notifyNew ?? true,
    notifyUpdates: cached?.notifyUpdates ?? true,
    notifyDue: cached?.notifyDue ?? true,
    configured: !!cached,
    connecting: false,
    error: null,
    loaded: false,

    set: (patch) => set((s) => ({ ...s, ...patch, error: null })),

    load: async () => {
      try {
        const res = await fetch("/api/integrations/status", { cache: "no-store" })
        if (!res.ok) return
        const data = await res.json()
        if (data.email?.configured) {
          const cache = {
            smtpUser: data.email.smtpUser,
            recipient: data.email.recipient,
            notifyNew: data.email.notifyNew,
            notifyUpdates: data.email.notifyUpdates,
            notifyDue: data.email.notifyDue,
          }
          writeCache(cache)
          set((s) => ({ ...s, ...cache, configured: true }))
        } else {
          clearCache()
          set((s) => ({ ...s, configured: false }))
        }
      } catch {}
      set((s) => ({ ...s, loaded: true }))
    },

    save: async () => {
      const s = get()
      set({ connecting: true, error: null })
      try {
        const res = await fetch("/api/email/connect", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            smtpUser: s.smtpUser,
            appPassword: s.appPassword,
            recipient: s.recipient,
            notifyNew: s.notifyNew,
            notifyUpdates: s.notifyUpdates,
            notifyDue: s.notifyDue,
          }),
        })
        const data = await res.json()
        if (!res.ok || !data.ok) {
          set({ connecting: false, error: data.error || "Could not save email settings" })
          return false
        }
        writeCache({
          smtpUser: s.smtpUser,
          recipient: s.recipient || s.smtpUser,
          notifyNew: s.notifyNew,
          notifyUpdates: s.notifyUpdates,
          notifyDue: s.notifyDue,
        })
        set({ connecting: false, configured: true })
        return true
      } catch {
        set({ connecting: false, error: "Network error" })
        return false
      }
    },

    disconnect: async () => {
      try {
        await fetch("/api/email/disconnect", { method: "POST" })
      } catch {}
      clearCache()
      set({
        smtpUser: "",
        appPassword: "",
        recipient: "",
        configured: false,
        error: null,
      })
    },
  }
})
