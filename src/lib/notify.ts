"use client"

import { useNotificationStore } from "@/store/use-notification-store"
import { useToastStore } from "@/store/use-toast-store"
import { isPushDeliveryActive } from "@/lib/push-client"

let audioCtx: AudioContext | null = null

function vibrate() {
  try {
    if (typeof navigator !== "undefined" && "vibrate" in navigator && !isPushDeliveryActive()) {
      navigator.vibrate([90, 40, 90])
    }
  } catch {}
}

function playTone() {
  try {
    if (typeof window === "undefined") return
    vibrate()
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    audioCtx = audioCtx || new AC()
    const ctx = audioCtx
    const o = ctx.createOscillator()
    const g = ctx.createGain()
    o.type = "sine"
    o.frequency.value = 880
    g.gain.value = 0.0001
    o.connect(g)
    g.connect(ctx.destination)
    g.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.02)
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.8)
    o.start()
    o.stop(ctx.currentTime + 0.9)
    o.onended = () => {
      o.disconnect()
      g.disconnect()
    }
  } catch {}
}

type NotifyOpts = {
  tag?: string
  href?: string
  toast?: boolean
  sound?: boolean
  browser?: boolean
  /** Reminder context — turns on the "Done / +5 min" buttons in the OS. */
  kind?: string
  id?: string
}

// Fire a notification across every channel at once:
// in-app bell + toast + sound + browser notification.
export function notify(title: string, description = "", opts?: NotifyOpts) {
  const tag = opts?.tag ?? `nf-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

  if (opts?.sound !== false) playTone()
  if (opts?.toast !== false) {
    useToastStore.getState().show({ type: "info", title, description: description || undefined })
  }
  useNotificationStore.getState().add({ title, description, href: opts?.href })

  if (opts?.browser !== false) {
    if (typeof Notification !== "undefined" && Notification.permission === "granted") {
      if (isPushDeliveryActive()) {
        // Installed PWA: deliver via the push service so the banner still appears
        // when the tab is backgrounded or closed. The service worker de-dupes
        // by tag and shows action buttons for reminders. Fire-and-forget.
        fetch("/api/push/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title,
            body: description || undefined,
            href: opts?.href,
            tag,
            rmd: !!opts?.kind,
            kind: opts?.kind,
            id: opts?.id,
          }),
        }).catch(() => {})
      } else {
        // Foreground fallback (browser not installed as a PWA).
        try {
          const n = new Notification(title, {
            body: description || undefined,
            icon: "/favicon-512.png",
            tag,
          })
          n.onclick = () => {
            window.focus()
            if (opts?.href) window.location.href = opts.href
            n.close()
          }
        } catch {}
      }
    }
  }
}