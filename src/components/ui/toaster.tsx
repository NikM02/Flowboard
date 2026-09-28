"use client"

import { motion, AnimatePresence } from "framer-motion"
import { CheckCircle2, XCircle, Info, X, Plus, Pencil, Trash2 } from "lucide-react"
import { useToastStore } from "@/store/use-toast-store"
import type { NotificationIcon } from "@/store/use-notification-store"

const icons = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
}

const actionIcons: Record<NotificationIcon, typeof Info> = {
  add: Plus,
  edit: Pencil,
  delete: Trash2,
  done: CheckCircle2,
  info: Info,
}

const colors = {
  success: "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300",
  error: "border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950/80 dark:text-red-300",
  info: "border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-800 dark:bg-blue-950/80 dark:text-blue-300",
}

export function Toaster() {
  const { toasts, dismiss } = useToastStore()

  return (
    <div className="fixed bottom-[calc(env(safe-area-inset-bottom)+1rem)] right-3 left-3 z-[100] flex flex-col gap-2 sm:left-auto sm:right-4">
      <AnimatePresence>
        {toasts.map((toast) => {
          const Icon = toast.icon ? actionIcons[toast.icon] : icons[toast.type]
          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 100, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 100, scale: 0.9 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className={`flex w-full items-start gap-3 rounded-[18px] border p-4 shadow-lg shadow-neutral-900/5 backdrop-blur-xl sm:w-80 ${colors[toast.type]}`}
            >
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-[8px] bg-white/60 dark:bg-white/10">
                <Icon className="h-3.5 w-3.5" />
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold">{toast.title}</p>
                {toast.description && (
                  <p className="mt-0.5 text-xs opacity-80 truncate">{toast.description}</p>
                )}
              </div>
              <button onClick={() => dismiss(toast.id)} className="shrink-0 rounded-lg p-0.5 opacity-60 hover:opacity-100">
                <X className="h-3.5 w-3.5" />
              </button>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
