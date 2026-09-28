"use client"

import { useTaskStore } from "@/store/use-task-store"
import { useHabitStore } from "@/store/use-habit-store"
import { useFutureStore } from "@/store/use-future-store"
import { useBucketListStore } from "@/store/use-bucket-list-store"
import { useAdvanceTodoStore } from "@/store/use-advance-todo-store"

export type ReminderSource =
  | "task"
  | "habit"
  | "goal"
  | "bucket"
  | "todo"

export type Reminder = {
  key: string
  kind: ReminderSource
  fireAt: number
  title: string
  description?: string
  href?: string
}

// Combine a "yyyy-MM-dd" + "HH:mm" into a local-time ISO string.
export function buildReminderIso(date: string, time?: string): string | undefined {
  if (!date || !time) return undefined
  const d = new Date(`${date}T${time}`)
  if (isNaN(d.getTime())) return undefined
  if (d.getTime() <= Date.now()) return undefined
  return d.toISOString()
}

export function collectReminders(): Reminder[] {
  const out: Reminder[] = []
  const now = Date.now()

  for (const t of useTaskStore.getState().tasks) {
    if (t.completed || !t.reminder) continue
    const fireAt = new Date(t.reminder).getTime()
    if (isNaN(fireAt) || fireAt <= now) continue
    const bits: string[] = []
    if (t.project) bits.push(t.project)
    bits.push(t.priority === "high" ? "High priority" : t.priority === "medium" ? "Medium priority" : "Low priority")
    if (t.storyPoints != null) bits.push(`${t.storyPoints} pts`)
    if (t.subtasks.length > 0) {
      const done = t.subtasks.filter((s) => s.completed).length
      bits.push(`${done}/${t.subtasks.length} subtasks`)
    }
    if (t.dueDate) bits.push(`due ${t.dueDate}${t.dueTime ? ` ${t.dueTime}` : ""}`)
    out.push({
      key: `task:${t.id}:${t.reminder}`,
      kind: "task",
      fireAt,
      title: `⏰ Reminder: ${t.title}`,
      description: t.description ? `${t.description} — ${bits.join(" · ")}` : bits.join(" · ") || "Task reminder",
      href: "/tasks",
    })
  }

  for (const h of useHabitStore.getState().habits) {
    if (!h.reminderTime) continue
    const [hh, mm] = h.reminderTime.split(":").map(Number)
    if (isNaN(hh)) continue
    const fireAt = new Date()
    fireAt.setHours(hh, mm, 0, 0)
    if (fireAt.getTime() <= now) fireAt.setDate(fireAt.getDate() + 1)
    out.push({
      key: `habit:${h.id}:${fireAt.toDateString()}`,
      kind: "habit",
      fireAt: fireAt.getTime(),
      title: `Time for: ${h.name}`,
      description: `${h.frequency === "weekly" ? "Weekly" : "Daily"} habit${h.description ? ` — ${h.description.slice(0, 80)}` : ""} · tap to check in`,
      href: "/habits",
    })
  }

  for (const g of useFutureStore.getState().goals) {
    if (g.completed || !g.reminder) continue
    const fireAt = new Date(g.reminder).getTime()
    if (isNaN(fireAt) || fireAt <= now) continue
    out.push({
      key: `goal:${g.id}:${g.reminder}`,
      kind: "goal",
      fireAt,
      title: `Goal check-in: ${g.title}`,
      description: `Progress ${g.currentValue}/${g.targetValue} (${g.period}) · tap to update`,
      href: "/future",
    })
  }

  for (const b of useBucketListStore.getState().items) {
    if (b.completed || !b.reminder) continue
    const fireAt = new Date(b.reminder).getTime()
    if (isNaN(fireAt) || fireAt <= now) continue
    out.push({
      key: `bucket:${b.id}:${b.reminder}`,
      kind: "bucket",
      fireAt,
      title: `Bucket list dream ✨ ${b.title}`,
      description: b.expectedDate ? `Target date ${b.expectedDate}${b.timeframe ? ` · ${b.timeframe}` : ""}` : "Don't lose the dream — tap to view",
      href: "/skills/bucket-list",
    })
  }

  for (const a of useAdvanceTodoStore.getState().todos) {
    if (a.completed || !a.reminder) continue
    const fireAt = new Date(a.reminder).getTime()
    if (isNaN(fireAt) || fireAt <= now) continue
    out.push({
      key: `todo:${a.id}:${a.reminder}`,
      kind: "todo",
      fireAt,
      title: `⏰ Todo reminder: ${a.title}`,
      description: `Scheduled for ${a.date} · tap to open`,
      href: "/dashboard",
    })
  }

  return out.sort((a, b) => a.fireAt - b.fireAt)
}