"use client"

import { useEffect, useRef } from "react"
import { collectReminders, type Reminder } from "@/lib/reminders"
import { notify } from "@/lib/notify"

const FIRED_KEY = "nexus-reminder-fired"
const STALE_MS = 60 * 60 * 1000 // ignore reminders older than an hour

function loadFired(): Set<string> {
  try {
    const raw = localStorage.getItem(FIRED_KEY)
    return raw ? new Set(JSON.parse(raw)) : new Set()
  } catch {
    return new Set()
  }
}

function persistFired(set: Set<string>) {
  try {
    localStorage.setItem(FIRED_KEY, JSON.stringify([...set].slice(-400)))
  } catch {}
}

// Fires reminders at their exact time (bell + toast + sound + OS push).
// Telegram is left to /api/reminder-cron so reminders never double-send.
// A periodic catch-up poll also catches reminders whose time passed while the
// tab was suspended/backgrounded on mobile. Fired keys persist so reminders
// never double-fire across reloads.
export function useReminderScheduler() {
  const firedRef = useRef(new Set<string>())
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([])
  const scheduledRef = useRef(new Set<string>())
  const loadedRef = useRef(false)

  const clearTimers = () => {
    timersRef.current.forEach((t) => clearTimeout(t))
    timersRef.current = []
    scheduledRef.current = new Set()
  }

  const markFired = (key: string) => {
    firedRef.current.add(key)
    persistFired(firedRef.current)
  }

  const schedule = (reminder: Reminder) => {
    if (firedRef.current.has(reminder.key)) return
    if (scheduledRef.current.has(reminder.key)) return
    const delay = reminder.fireAt - Date.now()
    if (delay <= 0) return
    scheduledRef.current.add(reminder.key)
    const t = setTimeout(() => {
      if (firedRef.current.has(reminder.key)) return
      markFired(reminder.key)
      scheduledRef.current.delete(reminder.key)
      notify(reminder.title, reminder.description || "", {
        tag: `rmd-${reminder.kind}`,
        href: reminder.href,
        telegram: false,
        kind: reminder.kind,
        id: reminder.key.split("|")[1],
      })
    }, delay)
    timersRef.current.push(t)
  }

  // Fire anything already due (catch-up after suspend / between crons), then
  // schedule the rest. Stale reminders older than an hour are dropped silently.
  const scan = () => {
    if (!loadedRef.current) {
      firedRef.current = loadFired()
      loadedRef.current = true
    }
    const now = Date.now()
    for (const reminder of collectReminders()) {
      if (firedRef.current.has(reminder.key)) continue
      const elapsed = now - reminder.fireAt
      if (elapsed >= STALE_MS) {
        markFired(reminder.key) // silently swallow very old reminders
        continue
      }
      if (elapsed >= 0) {
        markFired(reminder.key)
        notify(reminder.title, reminder.description || "", {
          href: reminder.href,
          telegram: false,
          kind: reminder.kind,
          id: reminder.key.split("|")[1],
        })
      } else {
        schedule(reminder)
      }
    }
  }

  useEffect(() => {
    scan()
    const interval = setInterval(() => {
      clearTimers()
      scan()
    }, 20_000)
    return () => {
      clearInterval(interval)
      clearTimers()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}