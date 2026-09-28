"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Bell, CheckCheck, Trash2, Plus, Pencil, CheckCircle2, Info } from "lucide-react"
import { useNotificationStore } from "@/store/use-notification-store"
import type { NotificationIcon } from "@/store/use-notification-store"
import { cn } from "@/lib/shadcn-utils"
import { formatDistanceToNowStrict } from "date-fns"

const actionIcons: Record<NotificationIcon, typeof Plus> = {
  add: Plus,
  edit: Pencil,
  delete: Trash2,
  done: CheckCircle2,
  info: Info,
}

const actionColors: Record<NotificationIcon, { bg: string; icon: string }> = {
  add: { bg: "bg-emerald-50 dark:bg-emerald-500/10", icon: "text-emerald-500" },
  edit: { bg: "bg-blue-50 dark:bg-blue-500/10", icon: "text-blue-500" },
  delete: { bg: "bg-red-50 dark:bg-red-500/10", icon: "text-red-500" },
  done: { bg: "bg-emerald-50 dark:bg-emerald-500/10", icon: "text-emerald-500" },
  info: { bg: "bg-amber-50 dark:bg-amber-500/10", icon: "text-amber-500" },
}

function timeAgo(ts: number): string {
  const label = formatDistanceToNowStrict(ts, { addSuffix: true })
  return label.replace("about ", "")
}

export function NotificationBell() {
  const router = useRouter()
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
    <div ref={ref} className="relative block">
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "relative flex h-10 w-10 items-center justify-center rounded-[10px] transition-colors duration-200",
          open
            ? "bg-neutral-100 text-indigo-600 dark:bg-neutral-800 dark:text-indigo-300"
            : "bg-neutral-100 text-neutral-500 hover:bg-neutral-200 hover:text-neutral-900 dark:bg-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-700 dark:hover:text-neutral-50"
        )}
      >
        <Bell className={cn("h-4 w-4", open && "animate-pulse-glow")} />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-neutral-900 px-1 text-[9px] font-bold text-white leading-none shadow-md dark:bg-white dark:text-neutral-900">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-80 max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-xl shadow-neutral-900/10 dark:border-neutral-800 dark:bg-neutral-900 sm:w-96"
          >
            <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-3 dark:border-neutral-800">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                  Notifications
                </h3>
                {unreadCount > 0 && (
                  <span className="rounded-full bg-indigo-50 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300">
                    {unreadCount} new
                  </span>
                )}
              </div>
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

            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 && (
                <div className="py-12 text-center">
                  <Bell className="mx-auto h-6 w-6 text-neutral-300 dark:text-neutral-600" />
                  <p className="mt-2 text-sm text-neutral-400">No notifications yet</p>
                </div>
              )}
              {notifications.map((n) => {
                const icon = n.icon ?? "info"
                const Icon = actionIcons[icon]
                const colors = actionColors[icon]
                return (
                  <button
                    key={n.id}
                    onClick={() => {
                      if (n.href) router.push(n.href)
                      else setOpen(false)
                    }}
                    className={cn(
                      "flex w-full items-start gap-3 border-b border-neutral-100 px-4 py-3 text-left transition-colors last:border-0 dark:border-neutral-800",
                      !n.read && "bg-neutral-50/60 dark:bg-neutral-800/30",
                      n.href ? "hover:bg-neutral-100 dark:hover:bg-neutral-800/60" : "cursor-default"
                    )}
                  >
                    <span className={cn("mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl", colors.bg)}>
                      <Icon className={cn("h-4 w-4", colors.icon)} />
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className={cn("text-sm font-medium truncate text-neutral-900 dark:text-neutral-100", n.read && "font-normal")}>
                          {n.title}
                        </p>
                        <span className="shrink-0 whitespace-nowrap text-[10px] text-neutral-400">
                          {timeAgo(n.time)}
                        </span>
                      </div>
                      <p className={cn("mt-0.5 text-xs leading-relaxed text-neutral-500 dark:text-neutral-400", n.read && "text-neutral-400 dark:text-neutral-500")}>
                        {n.description || "·"}
                      </p>
                    </div>
                    {!n.read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-indigo-500" />}
                  </button>
                )
              })}
            </div>

            {notifications.length > 0 && (
              <div className="border-t border-neutral-100 px-4 py-2 dark:border-neutral-800">
                <p className="text-center text-[10px] text-neutral-400">
                  {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount === 1 ? "" : "s"}` : "All caught up"}
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}