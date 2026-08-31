"use client"

const SUB_KEY = "nexus-push-subscription"

export type StoredSubscription = {
  endpoint: string
  keys: { p256dh: string; auth: string }
}

export function urlBase64ToUint8Array(base64String: string): BufferSource {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/")
  const raw = atob(base64)
  const output = new Uint8Array(new ArrayBuffer(raw.length))
  for (let i = 0; i < raw.length; ++i) output[i] = raw.charCodeAt(i)
  return output
}

export function getStoredSubscription(): StoredSubscription | null {
  try {
    const raw = localStorage.getItem(SUB_KEY)
    return raw ? (JSON.parse(raw) as StoredSubscription) : null
  } catch {
    return null
  }
}

export function isPushDeliveryActive(): boolean {
  return !!getStoredSubscription() && typeof Notification !== "undefined" && Notification.permission === "granted"
}

export function setStoredSubscription(sub: StoredSubscription | null) {
  try {
    if (sub) localStorage.setItem(SUB_KEY, JSON.stringify(sub))
    else localStorage.removeItem(SUB_KEY)
  } catch {}
}

let cachedKey: string | undefined | null

export async function getVapidPublicKey(): Promise<string | undefined> {
  if (cachedKey !== undefined && cachedKey !== null) return cachedKey
  try {
    const res = await fetch("/api/push/config", { cache: "no-store" })
    if (!res.ok) return undefined
    const json = (await res.json()) as { publicKey: string | null }
    cachedKey = json.publicKey ?? undefined
    return cachedKey
  } catch {
    return undefined
  }
}

const UID_KEY = "nexus-user-id"

export function setStoredUserId(uid: string | null) {
  try {
    if (uid) localStorage.setItem(UID_KEY, uid)
    else localStorage.removeItem(UID_KEY)
  } catch {}
}

export function getStoredUserId(): string | undefined {
  try {
    return localStorage.getItem(UID_KEY) || undefined
  } catch {
    return undefined
  }
}