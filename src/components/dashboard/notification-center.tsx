"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Bell, BellOff, CheckCheck, Trash2, CheckCircle2, BellRing, Zap, Info } from "lucide-react"
import { useNotificationStore } from "@/store/use-notification-store"
import { usePwaPush } from "@/hooks/use-pwa-push"
import { cn } from "@/lib/shadcn-utils"
import { format } from "date-fns"

export function NotificationCenter() {
  const [open, setOpen] = useState(false)
  const [testing, setTesting] = useState(false)
  const [statusMsg, setStatusMsg] = useState<string | null>(null)
  const ref = useRef<HTMLDivElement>(null)
  const { notifications, unreadCount, markAllRead, clear } = useNotificationStore()
  const { supported, permission, subscribed, enable, disable } = usePwaPush()

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  const alertsOn = permission === "granted" && subscribed

  const toggleAlerts = useCallback(async () => {
    setStatusMsg(null)
    if (alertsOn) {
      await disable()
      setStatusMsg("OS alerts turned off for this device.")
    } else {
      const ok = await enable()
      setStatusMsg(
        ok
          ? "OS alerts are on — notifications will appear in your notification bar."
          : "Couldn't enable alerts. Make sure you've installed the app and allowed notifications."
      )
    }
  }, [alertsOn, enable, disable])

  const sendTest = useCallback(() => {
    setTesting(true)
    setStatusMsg(null)
    const t = setTimeout(() => {
      setTesting(false)
    }, 2500)
    fetch("/api/push/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Vault test notification",
        body: "If you can see this, alerts are working.",
        href: "/dashboard",
        tag: `test-${Date.now()}`,
      }),
    })
      .then((r) => r.json().catch(() => ({})))
      .then((j) => {
        if (j.ok && Number(j.delivered) > 0) {
          setStatusMsg("Test sent — check your notification bar.")
        } else {
          setStatusMsg("Delivery blocked. Enable alerts below, then try again.")
        }
        clearTimeout(t)
        setTesting(false)
      })
      .catch(() => {
        clearTimeout(t)
        setTesting(false)
      })
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
        title="Notifications"
      >
        <Bell className={cn("h-4 w-4", open && "animate-pulse-glow")} />
        {alertsOn && !open && (
          <span className="absolute -left-0.5 -top-0.5 h-2 w-2 rounded-full bg-green-500" />
        )}
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-neutral-900 px-1 text-[9px] font-bold text-white leading-none shadow-md dark:bg-white dark:text-neutral-900">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-[120] bg-neutral-950/30 backdrop-blur-sm md:hidden"
            />
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-x-0 bottom-0 z-[130] mx-auto max-w-lg rounded-t-3xl border border-b-0 border-neutral-200 bg-white p-0 shadow-xl shadow-neutral-900/10 dark:border-neutral-800 dark:bg-neutral-900 md:absolute md:inset-x-auto md:right-0 md:top-full md:mt-2 md:w-80 md:rounded-2xl md:border-b"
            >
              <div className="mx-auto my-3 h-1.5 w-12 rounded-full bg-neutral-200 md:hidden dark:bg-neutral-700" />

              {/* OS Alerts status */}
              <div className="border-b border-neutral-200 p-4 dark:border-neutral-800">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    {alertsOn ? (
                      <BellRing className="h-4 w-4 text-green-500" />
                    ) : (
                      <BellOff className="h-4 w-4 text-neutral-400" />
                    )}
                    <div>
                      <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                        OS Alerts
                      </p>
                      <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                        {!supported
                          ? "Not supported on this browser"
                          : alertsOn
                            ? "On — reminders reach your notification bar"
                            : permission === "denied"
                              ? "Blocked in browser settings"
                              : "Off — enable to get notifications in your bar"}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => void toggleAlerts()}
                    role="switch"
                    aria-checked={alertsOn}
                    disabled={!supported}
                    className={cn(
                      "relative h-7 w-12 shrink-0 rounded-full transition-colors disabled:opacity-40",
                      alertsOn ? "bg-neutral-900 dark:bg-white" : "bg-neutral-200 dark:bg-neutral-700"
                    )}
                  >
                    <span
                      className={cn(
                        "absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all dark:bg-neutral-900",
                        alertsOn ? "left-6" : "left-1"
                      )}
                    />
                  </button>
                </div>

                {statusMsg && (
                  <p className="mt-3 flex items-start gap-1.5 rounded-xl bg-neutral-50 p-2.5 text-[11px] text-neutral-600 dark:bg-neutral-800/60 dark:text-neutral-300">
                    <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    {statusMsg}
                  </p>
                )}

                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => void sendTest()}
                    disabled={testing}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-neutral-900 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-neutral-700 disabled:opacity-60 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
                  >
                    <Zap className="h-3.5 w-3.5" />
                    {testing ? "Sending..." : "Send test"}
                  </button>
                  {!supported && (
                    <button
                      onClick={() => setOpen(false)}
                      className="flex-1 rounded-xl border border-neutral-200 px-3 py-2 text-xs font-semibold text-neutral-700 dark:border-neutral-700 dark:text-neutral-200"
                    >
                      Install app first
                    </button>
                  )}
                </div>
              </div>

              {/* Inbox header */}
              <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-3 dark:border-neutral-800">
                <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                  Inbox
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
                  <button
                    key={n.id}
                    onClick={() => {
                      if (n.href) window.location.href = n.href
                      else setOpen(false)
                    }}
                    className={`flex w-full items-start gap-3 border-b border-neutral-100 px-4 py-3 text-left transition-colors last:border-0 dark:border-neutral-800 ${
                      n.read ? "opacity-60" : "bg-neutral-50/50 dark:bg-neutral-800/30"
                    } ${n.href ? "hover:bg-neutral-100 dark:hover:bg-neutral-800/60" : ""}`}
                  >
                    <div className="mt-0.5">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-neutral-100 dark:bg-neutral-800">
                        <CheckCircle2 className="h-4 w-4 text-neutral-500" />
                      </div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-neutral-900 dark:text-neutral-100">
                        {n.title}
                      </p>
                      <p className="truncate text-xs text-neutral-400">{n.description}</p>
                      <p className="mt-0.5 text-[10px] text-neutral-400">
                        {format(n.time, "hh:mm a")}
                      </p>
                    </div>
                    {!n.read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-blue-500" />}
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
