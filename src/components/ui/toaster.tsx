"use client"

import { motion, AnimatePresence } from "framer-motion"
import { CheckCircle2, XCircle, Info, X, Plus, Pencil, Trash2 } from "lucide-react"
import { useToastStore } from "@/store/use-toast-store"

const icons = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
}



const colors = {
  success: "border-emerald-200 bg-emerald-50 text-emerald-800 ",
  error: "border-red-200 bg-red-50 text-red-800 ",
  info: "border-blue-200 bg-blue-50 text-blue-800 ",
}

export function Toaster() {
  const { toasts, dismiss } = useToastStore()

  return (
    <div className="fixed bottom-[calc(env(safe-area-inset-bottom)+1rem)] right-3 left-3 z-[100] flex flex-col gap-2 sm:left-auto sm:right-4">
      <AnimatePresence>
        {toasts.map((toast) => {
          const Icon = icons[toast.type]
          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 100, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 100, scale: 0.9 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className={`flex w-full items-start gap-3 rounded-[10px] border p-4 shadow-lg shadow-neutral-900/5 backdrop-blur-xl sm:w-80 ${colors[toast.type]}`}
            >
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-[10px] bg-white/60 ">
                <Icon className="h-3.5 w-3.5" />
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold">{toast.title}</p>
                {toast.description && (
                  <p className="mt-0.5 text-xs opacity-80 truncate">{toast.description}</p>
                )}
              </div>
              <button onClick={() => dismiss(toast.id)} className="shrink-0 rounded-[10px] p-0.5 opacity-60 hover:opacity-100">
                <X className="h-3.5 w-3.5" />
              </button>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
