import { NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/service"

const HABIT_DATE = (() => {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
})()

const SNOOZE = 5 * 60 * 1000
const KINDS = ["task", "habit", "content", "goal", "bucket", "todo"] as const

function formatHHMM(ms: number): string {
  const d = new Date(ms)
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`
}

function setDone(list: any[] | undefined, id: string): boolean {
  if (!Array.isArray(list)) return false
  const item = list.find((x) => x && x.id === id)
  if (!item) return false
  item.completed = true
  return true
}

function setReminder(list: any[] | undefined, id: string, next: string | null): boolean {
  if (!Array.isArray(list)) return false
  const item = list.find((x) => x && x.id === id)
  if (!item) return false
  if (next === null) delete item.reminder
  else item.reminder = next
  return true
}

// Used by the service worker when the user taps a notification action button,
// so "Done" and "+5 min" work even when the app is closed.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { uid, kind, id, action, minutes } = body

    if (!uid || !kind || !id) {
      return NextResponse.json({ error: "Missing uid/kind/id" }, { status: 400 })
    }
    if (!KINDS.includes(kind)) {
      return NextResponse.json({ error: "Unknown kind" }, { status: 400 })
    }
    if (!["done", "snooze"].includes(action ?? "open")) {
      return NextResponse.json({ error: "Unknown action" }, { status: 400 })
    }

    const supabase = createServiceClient()
    const { data: row } = await supabase.from("user_data").select("data").eq("user_id", uid).single()
    if (!row?.data) {
      return NextResponse.json({ error: "No data" }, { status: 404 })
    }
    const data = row.data as Record<string, any>

    let changed = false
    if (action === "done") {
      if (kind === "task") changed = setDone(data.tasks, id)
      else if (kind === "todo") changed = setDone(data.advanceTodos, id)
      else if (kind === "goal") changed = setDone(data.futureGoals, id)
      else if (kind === "bucket") changed = setDone(data.bucketListItems, id)
      else if (kind === "habit") {
        const h = (data.habits ?? []).find((x: any) => x && x.id === id)
        if (h) {
          const records = Array.isArray(h.records) ? h.records : []
          const existing = records.find((r: any) => r.date === HABIT_DATE)
          if (existing) existing.completed = true
          else records.push({ date: HABIT_DATE, completed: true })
          h.records = records
          changed = true
        }
      }
    } else if (action === "snooze") {
      const next = new Date(Date.now() + (minutes ?? 5) * 60 * 1000).toISOString()
      if (kind === "task") changed = setReminder(data.tasks, id, next)
      else if (kind === "todo") changed = setReminder(data.advanceTodos, id, next)
      else if (kind === "goal") changed = setReminder(data.futureGoals, id, next)
      else if (kind === "bucket") changed = setReminder(data.bucketListItems, id, next)
      else if (kind === "content") changed = setReminder(data.contentItems, id, next)
      else if (kind === "habit") {
        const h = (data.habits ?? []).find((x: any) => x && x.id === id)
        if (h && h.reminderTime) {
          h.reminderTime = formatHHMM(Date.now() + (minutes ?? 5) * 60 * 1000)
          changed = true
        }
      }
    }

    if (!changed) {
      return NextResponse.json({ error: "Item not found or already handled" }, { status: 404 })
    }

    const { error } = await supabase.from("user_data").upsert(
      { user_id: uid, data, updated_at: new Date().toISOString() },
      { onConflict: "user_id" }
    )
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}