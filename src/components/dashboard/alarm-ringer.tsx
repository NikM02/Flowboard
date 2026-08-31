"use client"

import { useEffect, useRef, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { AlarmClock, Clock, Check } from "lucide-react"
import { useAlarmStore } from "@/store/use-alarm-store"
import { notify } from "@/lib/notify"
import { getStoredUserId } from "@/lib/push-client"

function nowHHMM(): string {
  const d = new Date()
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`
}

function addMinutesHHMM(minutes: number): string {
  const d = new Date(Date.now() + minutes * 60 * 1000)
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`
}

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

// Fires alarms on this device when the app is open: a full-screen banner with
// Snooze (5 min) / OK buttons, plus an OS notification that stays in the bar.
// The server-side cron covers the closed-app case with the same actions.
export function AlarmRinger() {
  const { alarms, updateAlarm } = useAlarmStore()
  const [ringing, setRinging] = useState<string | null>(null)
  const firedRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    const check = () => {
      const hhmm = nowHHMM()
      const t = today()
      for (const a of useAlarmStore.getState().alarms) {
        if (!a.enabled || !a.time) continue
        if (a.time !== hhmm) continue
        const key = `${a.id}|${t}`
        if (firedRef.current.has(key)) continue
        firedRef.current.add(key)
        setRinging(a.id)
        notify(a.label ? `${a.label}` : "\u23f0 Alarm", `\u23f0 It's ${a.time}`, {
          tag: `alarm-${a.id}-${t}`,
          kind: "alarm",
          id: a.id,
        })
      }
    }
    check()
    const id = setInterval(check, 1000)
    return () => clearInterval(id)
  }, [])

  const postAction = (action: "snooze" | "ok", id: string) => {
    const uid = getStoredUserId()
    if (!uid) return
    fetch("/api/notifications/action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uid, kind: "alarm", id, action, minutes: 5 }),
    }).catch(() => {})
  }

  const handleSnooze = (id: string) => {
    updateAlarm(id, { time: addMinutesHHMM(5) })
    const t = today()
    // Allow it to ring again at the snoozed time on this device.
    firedRef.current.delete(`${id}|${t}`)
    setRinging(null)
    postAction("snooze", id)
  }

  const handleOk = (id: string) => {
    setRinging(null)
    postAction("ok", id)
  }

  const ringingAlarm = ringing ? alarms.find((a) => a.id === ringing) : undefined

  return (
    <AnimatePresence>
      {ringingAlarm && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[90] bg-neutral-950/60 backdrop-blur-sm"
            onClick={() => handleOk(ringingAlarm.id)}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 10 }}
            transition={{ type: "spring", damping: 18, stiffness: 200 }}
            className="fixed left-1/2 top-1/2 z-[91] w-[min(92vw,22rem)] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-3xl border border-neutral-200 bg-white p-6 text-center shadow-2xl dark:border-neutral-800 dark:bg-neutral-900"
          >
            <div className="mx-auto flex h-14 w-14 animate-pulse items-center justify-center rounded-2xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900">
              <AlarmClock className="h-7 w-7" />
            </div>
            <p className="mt-4 text-xs font-semibold uppercase tracking-widest text-neutral-400">
              Alarm
            </p>
            <h3 className="mt-1 text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
              {ringingAlarm.label || "Time's up"}
            </h3>
            <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
              {ringingAlarm.time}
            </p>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                onClick={() => handleSnooze(ringingAlarm.id)}
                className="flex items-center justify-center gap-2 rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm font-semibold text-neutral-800 transition-colors hover:bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-950 dark:text-white dark:hover:bg-neutral-800"
              >
                <Clock className="h-4 w-4" /> Snooze 5m
              </button>
              <button
                onClick={() => handleOk(ringingAlarm.id)}
                className="flex items-center justify-center gap-2 rounded-2xl bg-neutral-900 px-4 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 dark:bg-white dark:text-neutral-900"
              >
                <Check className="h-4 w-4" /> OK
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
