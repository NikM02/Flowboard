import { create } from "zustand"

export type Toast = {
  id: string
  type: "success" | "error" | "info"
  title: string
  description?: string
}

let counter = 0

type ToastStore = {
  toasts: Toast[]
  show: (toast: Omit<Toast, "id">) => void
  dismiss: (id: string) => void
}

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  show: (toast) => {
    const id = `toast-${++counter}`
    set((s) => ({ toasts: [...s.toasts, { ...toast, id }] }))
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }))
    }, 3500)
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}))
