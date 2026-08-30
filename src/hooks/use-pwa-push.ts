"use client"

import { useCallback, useEffect, useState } from "react"
import {
  getVapidPublicKey, getStoredSubscription, setStoredSubscription,
  urlBase64ToUint8Array,
} from "@/lib/push-client"

export type PushState = {
  supported: boolean
  permission: NotificationPermission | "unsupported"
  subscribed: boolean
}

function pushSupported(): boolean {
  return typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window
}

async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!pushSupported()) return null
  if (!window.location.protocol.startsWith("https:") && window.location.hostname !== "localhost") return null
  try {
    const reg = await navigator.serviceWorker.register("/sw.js", { scope: "/" })
    return reg
  } catch {
    return null
  }
}

export function usePwaPush() {
  const [state, setState] = useState<PushState>(() => ({
    supported: pushSupported(),
    permission: pushSupported() ? Notification.permission : "unsupported",
    subscribed: pushSupported() ? !!getStoredSubscription() : false,
  }))

  const refresh = useCallback(() => {
    if (!pushSupported()) return
    setState((s) => ({
      ...s,
      permission: Notification.permission,
      subscribed: !!getStoredSubscription(),
    }))
  }, [])

  // Re-register and re-sync the saved subscription after the app loads
  // (subscriptions can expire or be dropped by the push service).
  useEffect(() => {
    if (!state.supported) return
    let active = true
    registerServiceWorker().then((reg) => {
      if (!active || !reg) return
      reg.pushManager.getSubscription().then((sub) => {
        if (!active) return
        if (sub) {
          setStoredSubscription({
            endpoint: sub.endpoint,
            keys: {
              p256dh: btoa(String.fromCharCode(...new Uint8Array(sub.getKey("p256dh")!))),
              auth: btoa(String.fromCharCode(...new Uint8Array(sub.getKey("auth")!))),
            },
          })
          fetch("/api/push/subscribe", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              subscription: { endpoint: sub.endpoint, keys: sub.toJSON().keys },
            }),
          }).catch(() => {})
          refresh()
        } else if (getStoredSubscription()) {
          // Stored sub no longer active on the push service — drop it.
          setStoredSubscription(null)
          refresh()
        }
      })
    })
    return () => {
      active = false
    }
  }, [state.supported, refresh])

  const enable = useCallback(async (): Promise<boolean> => {
    if (!pushSupported()) return false
    const reg = await registerServiceWorker()
    if (!reg) return false

    let permission = Notification.permission
    if (permission !== "granted") {
      permission = await Notification.requestPermission()
      refresh()
    }
    if (permission !== "granted") return false

    const vapidKey = getVapidPublicKey()
    if (!vapidKey) {
      // No VAPID configured — fall back to foreground-only notifications.
      return false
    }

    try {
      let sub = await reg.pushManager.getSubscription()
      if (!sub) {
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidKey),
        })
      }
      setStoredSubscription({
        endpoint: sub.endpoint,
        keys: {
          p256dh: btoa(String.fromCharCode(...new Uint8Array(sub.getKey("p256dh")!))),
          auth: btoa(String.fromCharCode(...new Uint8Array(sub.getKey("auth")!))),
        },
      })
      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subscription: { endpoint: sub.endpoint, keys: sub.toJSON().keys },
        }),
      })
      refresh()
      return true
    } catch {
      refresh()
      return false
    }
  }, [refresh])

  const disable = useCallback(async () => {
    if (!pushSupported()) return
    const reg = await navigator.serviceWorker?.getRegistration("/")
    const sub = reg ? await reg.pushManager.getSubscription() : null
    if (sub) {
      const endpoint = sub.endpoint
      await sub.unsubscribe()
      fetch("/api/push/subscribe", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint }),
      }).catch(() => {})
    }
    setStoredSubscription(null)
    refresh()
  }, [refresh])

  return { ...state, enable, disable, refresh }
}