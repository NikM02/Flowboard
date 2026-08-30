import "server-only"
import webpush from "web-push"

export type PushPayload = {
  title: string
  body?: string
  href?: string
  tag?: string
}

export type PushSubscriptionRow = {
  endpoint: string
  keys: unknown
}

const PUSH_KEY = "pushSubscriptions"

export function getVapidSubscriber() {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  const privateKey = process.env.VAPID_PRIVATE_KEY
  const email = process.env.VAPID_EMAIL || "vault@flowboard.app"
  if (!publicKey || !privateKey) return null
  try {
    webpush.setVapidDetails(`mailto:${email}`, publicKey, privateKey)
    return webpush
  } catch {
    return null
  }
}

// Push subscriptions live inside user_data.data.pushSubscriptions (JSONB),
// matching how the rest of the app stores user-owned data. No extra table.
export function extractPushSubscriptions(data: Record<string, any> | null | undefined): PushSubscriptionRow[] {
  const list = data?.[PUSH_KEY]
  return Array.isArray(list)
    ? (list as PushSubscriptionRow[]).filter((s) => s && typeof s.endpoint === "string")
    : []
}

export async function loadPushSubscriptions(
  supabase: any,
  userId: string
): Promise<PushSubscriptionRow[]> {
  const { data: row } = await supabase
    .from("user_data")
    .select("data")
    .eq("user_id", userId)
    .single()
  return extractPushSubscriptions(row?.data)
}

export async function savePushSubscription(
  supabase: any,
  userId: string,
  sub: PushSubscriptionRow
): Promise<void> {
  const { data: row } = await supabase
    .from("user_data")
    .select("data")
    .eq("user_id", userId)
    .single()
  const data = (row?.data ?? {}) as Record<string, any>
  data[PUSH_KEY] = {
    ...extractPushSubscriptions(data).reduce<Record<string, PushSubscriptionRow>>((acc, s) => {
      acc[s.endpoint] = s
      return acc
    }, {}),
    [sub.endpoint]: sub,
  }
  await supabase.from("user_data").upsert(
    { user_id: userId, data, updated_at: new Date().toISOString() },
    { onConflict: "user_id" }
  )
}

export async function removePushSubscription(
  supabase: any,
  userId: string,
  endpoint: string
): Promise<void> {
  const { data: row } = await supabase
    .from("user_data")
    .select("data")
    .eq("user_id", userId)
    .single()
  const data = (row?.data ?? {}) as Record<string, any>
  const subs = extractPushSubscriptions(data)
  data[PUSH_KEY] = subs.filter((s) => s.endpoint !== endpoint)
  await supabase.from("user_data").upsert(
    { user_id: userId, data, updated_at: new Date().toISOString() },
    { onConflict: "user_id" }
  )
}

export function buildPayload(p: PushPayload): string {
  return JSON.stringify(p)
}

// Sends a web push to every device the user has subscribed from.
export async function sendWebPushToUser(
  userId: string,
  payload: PushPayload,
  loadSubs: () => Promise<PushSubscriptionRow[]>
): Promise<number> {
  const push = getVapidSubscriber()
  if (!push) return 0
  const subs = await loadSubs()
  if (subs.length === 0) return 0

  const text = buildPayload(payload)
  const results = await Promise.allSettled(
    subs.map((s) => push.sendNotification(s as unknown as webpush.PushSubscription, text))
  )
  return results.filter((r) => r.status === "fulfilled").length
}