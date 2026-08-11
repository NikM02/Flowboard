import { create } from "zustand"

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

export const useEmailStore = create<EmailStore>((set, get) => ({
  smtpUser: "",
  appPassword: "",
  recipient: "",
  notifyNew: true,
  notifyUpdates: true,
  notifyDue: true,
  configured: false,
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
        set((s) => ({
          ...s,
          smtpUser: data.email.smtpUser,
          recipient: data.email.recipient,
          notifyNew: data.email.notifyNew,
          notifyUpdates: data.email.notifyUpdates,
          notifyDue: data.email.notifyDue,
          configured: true,
        }))
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
    set({
      smtpUser: "",
      appPassword: "",
      recipient: "",
      configured: false,
      error: null,
    })
  },
}))
