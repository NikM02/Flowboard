import type { Task } from "@/types"

const TOKEN_URL = "https://oauth2.googleapis.com/token"
const USERINFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo"
const AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
const CAL_BASE = "https://www.googleapis.com/calendar/v3/calendars/primary/events"

function clientId() {
  return process.env.GOOGLE_CLIENT_ID ?? ""
}

function clientSecret() {
  return process.env.GOOGLE_CLIENT_SECRET ?? ""
}

function redirectUri() {
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
  return `${site}/api/calendar/oauth/callback`
}

function eventIdFor(taskId: string): string {
  const sanitized = taskId.replace(/[^a-zA-Z0-9_]/g, "_")
  return `nexus_${sanitized}`.slice(0, 1024)
}

export function buildAuthUrl(): string {
  const params = new URLSearchParams({
    client_id: clientId(),
    redirect_uri: redirectUri(),
    response_type: "code",
    scope: "https://www.googleapis.com/auth/calendar",
    access_type: "offline",
    prompt: "consent",
    include_granted_scopes: "true",
  })
  return `${AUTH_URL}?${params.toString()}`
}

export async function exchangeCodeForTokens(
  code: string
): Promise<{ accessToken: string; refreshToken: string; expiresAt: number; email: string } | null> {
  try {
    const res = await fetch(TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId(),
        client_secret: clientSecret(),
        redirect_uri: redirectUri(),
        grant_type: "authorization_code",
      }),
    })
    const data = await res.json()
    if (!data.access_token) return null

    const email = await fetchUserEmail(data.access_token)
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token ?? "",
      expiresAt: Date.now() + (data.expires_in ?? 3600) * 1000,
      email,
    }
  } catch {
    return null
  }
}

async function fetchUserEmail(accessToken: string): Promise<string> {
  try {
    const res = await fetch(USERINFO_URL, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    const data = await res.json()
    return data.email ?? ""
  } catch {
    return ""
  }
}

export async function refreshAccessToken(refreshToken: string): Promise<{ accessToken: string; expiresAt: number } | null> {
  try {
    const res = await fetch(TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        refresh_token: refreshToken,
        client_id: clientId(),
        client_secret: clientSecret(),
        grant_type: "refresh_token",
      }),
    })
    const data = await res.json()
    if (!data.access_token) return null
    return {
      accessToken: data.access_token,
      expiresAt: Date.now() + (data.expires_in ?? 3600) * 1000,
    }
  } catch {
    return null
  }
}

export type UpsertTaskEvent = {
  action: "upsert" | "delete"
  task: Pick<Task, "id" | "title" | "description" | "project" | "completed" | "dueDate">
}

export async function syncTaskEvent(
  accessToken: string,
  payload: UpsertTaskEvent
): Promise<boolean> {
  const eventId = eventIdFor(payload.task.id)
  const url = `${CAL_BASE}/${eventId}`

  try {
    if (payload.action === "delete" || payload.task.completed || !payload.task.dueDate) {
      const res = await fetch(url, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      return res.status === 204 || res.status === 404
    }

    const { task } = payload
    const description = [task.description, task.project ? `Project: ${task.project}` : ""]
      .filter(Boolean)
      .join("\n")

    const body = {
      id: eventId,
      summary: task.title,
      description,
      start: { date: task.dueDate },
      end: { date: addDays(task.dueDate) },
      status: "confirmed",
    }

    const res = await fetch(url, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    })

    return res.ok
  } catch {
    return false
  }
}

function addDays(dateStr: string): string {
  const d = new Date(`${dateStr}T00:00:00`)
  d.setDate(d.getDate() + 1)
  return d.toISOString().slice(0, 10)
}
