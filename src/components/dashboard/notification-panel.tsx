"use client"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Bell, CheckCheck, Trash2, CheckCircle2 } from "lucide-react"
import { useNotificationStore } from "@/store/use-notification-store"
import { format } from "date-fns"

export function NotificationBell() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const { notifications, unreadCount, markAllRead, clear } = useNotificationStore()

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  return (
    <div ref={ref} className="relative hidden sm:block">
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative rounded-xl p-2 text-neutral-500 transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-800"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute right-1.5 top-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white leading-none">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-full mt-2 w-80 overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-xl dark:border-neutral-800 dark:bg-neutral-900"
            >
              <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-3 dark:border-neutral-800">
                <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                  Notifications
                </h3>
                <div className="flex items-center gap-1">
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllRead}
                      className="rounded-lg p-1.5 text-neutral-400 transition-colors hover:text-neutral-600 dark:hover:text-neutral-300"
                      title="Mark all read"
                    >
                      <CheckCheck className="h-3.5 w-3.5" />
                    </button>
                  )}
                  <button
                    onClick={clear}
                    className="rounded-lg p-1.5 text-neutral-400 transition-colors hover:text-red-500"
                    title="Clear all"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 && (
                  <div className="py-10 text-center">
                    <Bell className="mx-auto h-6 w-6 text-neutral-300 dark:text-neutral-600" />
                    <p className="mt-2 text-sm text-neutral-400">No notifications yet</p>
                  </div>
                )}
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`flex items-start gap-3 border-b border-neutral-100 px-4 py-3 transition-colors last:border-0 dark:border-neutral-800 ${
                      n.read ? "opacity-60" : "bg-neutral-50/50 dark:bg-neutral-800/30"
                    }`}
                  >
                    <div className="mt-0.5">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-neutral-100 dark:bg-neutral-800">
                        <CheckCircle2 className="h-3.5 w-3.5 text-neutral-500" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate">
                        {n.title}
                      </p>
                      <p className="text-xs text-neutral-400 truncate">{n.description}</p>
                      <p className="mt-0.5 text-[10px] text-neutral-400">
                        {format(n.time, "hh:mm a")}
                      </p>
                    </div>
                    {!n.read && (
                      <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-blue-500" />
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
