import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getCalendarTokens, setCalendarTokens, type CalendarTokens } from "@/lib/integrations"
import { getCalendarCookie, setCalendarCookie } from "@/lib/integration-cookies"
import { refreshAccessToken, syncTaskEvent } from "@/lib/calendar"
import type { Task } from "@/types"

export async function POST(req: NextRequest) {
  try {
    const { action, task } = (await req.json()) as { action: "upsert" | "delete"; task: Task }

    if (!task?.id) return NextResponse.json({ error: "Missing task" }, { status: 400 })

    let tokens: CalendarTokens | null | undefined = await getCalendarCookie()

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!tokens && user) tokens = await getCalendarTokens(user.id)

    if (!tokens?.refreshToken) {
      return NextResponse.json({ error: "Google Calendar not connected" }, { status: 400 })
    }

    // Refresh access token if expired
    if (Date.now() > tokens.expiresAt - 5 * 60 * 1000) {
      const refreshed = await refreshAccessToken(tokens.refreshToken)
      if (!refreshed) return NextResponse.json({ error: "Calendar token expired — reconnect" }, { status: 401 })
      tokens = { ...tokens, accessToken: refreshed.accessToken, expiresAt: refreshed.expiresAt }
      setCalendarCookie(tokens)
      if (user) await setCalendarTokens(user.id, tokens)
    }

    const ok = await syncTaskEvent(tokens.accessToken, { action, task })

    if (ok) return NextResponse.json({ ok: true })
    return NextResponse.json({ error: "Failed to sync calendar event" }, { status: 500 })
  } catch {
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
