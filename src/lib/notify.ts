"use client"

import { useToastStore } from "@/store/use-toast-store"
import { isPushDeliveryActive } from "@/lib/push-client"

let audioCtx: AudioContext | null = null

function vibrate() {}

function playTone() {}


type NotifyOpts = {
  tag?: string
  href?: string
  toast?: boolean
  sound?: boolean
  browser?: boolean
  /** Reminder context — turns on the "Done / +5 min" buttons in the OS. */
  kind?: string
  id?: string
  /** Visual category shown on the toast and in the notification center. */
  icon?: "add" | "edit" | "delete" | "done" | "info"
}

function toastTypeFor(icon?: "add" | "edit" | "delete" | "done" | "info"): "success" | "error" | "info" {
  if (icon === "add" || icon === "done") return "success"
  if (icon === "delete") return "error"
  return "info"
}

// Fire a notification across every channel at once:
// in-app bell + toast + sound + browser notification.
export function notify(title: string, description = "", opts?: NotifyOpts) {
  const tag = opts?.tag ?? `nf-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

  if (opts?.sound !== false) playTone()
  if (opts?.toast !== false) {
    useToastStore.getState().show({
      type: toastTypeFor(opts?.icon as any),
      title,
      description: description || undefined,
      icon: opts?.icon,
    })
  }
  

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