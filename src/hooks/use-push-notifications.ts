"use client"

import { useEffect, useRef, useCallback, useState } from "react"
import { useTaskStore } from "@/store/use-task-store"
import { useTelegramStore } from "@/store/use-telegram-store"
import { sendTelegramMessage } from "@/lib/telegram"

const SENT_KEY = "nexus-push-sent"
const TG_SENT_KEY = "nexus-tg-sent"

function getSentSet(key: string): Set<string> {
  try {
    const raw = localStorage.getItem(key)
    return raw ? new Set(JSON.parse(raw)) : new Set()
  } catch {
    return new Set()
  }
}

function markSent(key: string, id: string) {
  const s = getSentSet(key)
  s.add(id)
  localStorage.setItem(key, JSON.stringify([...s].slice(-200)))
}

function isSent(key: string, id: string) {
  return getSentSet(key).has(id)
}

function sendBrowserNotification(title: string, body: string, tag: string) {
  if (!("Notification" in window)) return false
  if (Notification.permission !== "granted") return false
  try {
    const n = new Notification(title, {
      body,
      icon: "/favicon-512.png",
      tag,
      requireInteraction: false,
      silent: false,
    })
    n.onclick = () => { window.focus(); n.close() }
    return true
  } catch {
    return false
  }
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

async function sendToEmail(title: string, body: string, tag: string, category: "new" | "update" | "due") {
  if (isSent(TG_SENT_KEY, `mail-${tag}`)) return
  try {
    const res = await fetch("/api/email/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subject: title,
        bodyHtml: `<p style="margin:4px 0;">${escapeHtml(body)}</p>`,
        category,
      }),
    })
    if (res.ok) markSent(TG_SENT_KEY, `mail-${tag}`)
  } catch {}
}

async function sendToTelegram(title: string, body: string, tag: string) {
  const { botToken, chatId, connected } = useTelegramStore.getState()
  if (!connected || !botToken || !chatId) return false
  if (isSent(TG_SENT_KEY, tag)) return false

  const message = `<b>${title}</b>\n${body}`
  const ok = await sendTelegramMessage(botToken, chatId, message)
  if (ok) markSent(TG_SENT_KEY, tag)
  return ok
}

export type NotifPermission = "default" | "granted" | "denied" | "unsupported"

export function usePushNotifications() {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const initRef = useRef(false)
  const [permission, setPermission] = useState<NotifPermission>("default")
  const [lastFired, setLastFired] = useState<string | null>(null)

  const requestAndTrackPermission = useCallback(async () => {
    if (!("Notification" in window)) {
      setPermission("unsupported")
      return false
    }
    const current = Notification.permission as NotifPermission
    setPermission(current)
    if (current === "granted") return true
    if (current === "denied") return false
    try {
      const result = await Notification.requestPermission()
      setPermission(result as NotifPermission)
      return result === "granted"
    } catch {
      setPermission("denied")
      return false
    }
  }, [])

  const checkReminders = useCallback(async () => {
    const tasks = useTaskStore.getState().tasks
    const now = Date.now()

    // Check due-date "due soon" notifications (within the next hour).
    // Explicit reminder datetimes are handled by useReminderScheduler.
    for (const task of tasks) {
      if (task.completed || !task.dueDate) continue

      const tag = `due-${task.id}`

      try {
        const dueTime = new Date(task.dueDate).getTime()
        const oneHourBefore = dueTime - 60 * 60 * 1000
        if (oneHourBefore <= now && dueTime > now) {
          // Browser notification
          if (!isSent(SENT_KEY, tag)) {
            const sent = sendBrowserNotification(
              `Due soon: ${task.title}`,
              "Due in less than an hour!",
              tag
            )
            if (sent) markSent(SENT_KEY, tag)
          }

          // Telegram notification
          await sendToTelegram(
            `\ud83d\udd3a Due soon: ${task.title}`,
            "Due in less than an hour!",
            tag
          )

          // Email notification
          await sendToEmail(
            `\ud83d\udd3a Due soon: ${task.title}`,
            "Due in less than an hour!",
            tag,
            "due"
          )

          setLastFired(`Due soon: ${task.title}`)
        }
      } catch {}
    }
  }, [])

  useEffect(() => {
    if (initRef.current) return
    initRef.current = true

    requestAndTrackPermission()

    const timeout = setTimeout(() => { checkReminders() }, 3000)
    intervalRef.current = setInterval(checkReminders, 30_000)

    return () => {
      clearTimeout(timeout)
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [checkReminders, requestAndTrackPermission])

  useEffect(() => {
    const unsub = useTaskStore.subscribe(() => { setTimeout(checkReminders, 1000) })
    return unsub
  }, [checkReminders])

  return { permission, requestPermission: requestAndTrackPermission, lastFired }
}

export { sendBrowserNotification, sendToTelegram }
