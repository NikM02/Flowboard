"use client"

import { useTaskStore } from "@/store/use-task-store"
import { useHabitStore } from "@/store/use-habit-store"
import { useContentStore } from "@/store/use-content-store"
import { useFutureStore } from "@/store/use-future-store"
import { useBucketListStore } from "@/store/use-bucket-list-store"
import { useAdvanceTodoStore } from "@/store/use-advance-todo-store"

export type ReminderSource =
  | "task"
  | "habit"
  | "content"
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
    out.push({
      key: `task:${t.id}:${t.reminder}`,
      kind: "task",
      fireAt,
      title: `Reminder: ${t.title}`,
      description: t.description || (t.dueDate ? `Due ${t.dueDate}` : "Task reminder"),
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
      description: "Daily habit reminder",
      href: "/habits",
    })
  }

  for (const c of useContentStore.getState().items) {
    if (c.archivedAt || !c.reminder) continue
    const fireAt = new Date(c.reminder).getTime()
    if (isNaN(fireAt) || fireAt <= now) continue
    out.push({
      key: `content:${c.id}:${c.reminder}`,
      kind: "content",
      fireAt,
      title: `Content reminder: ${c.title}`,
      description: c.status === "published" ? "Piece live in your pipeline" : `Status: ${c.status}`,
      href: "/content-hub",
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
      description: `Progress ${g.currentValue}/${g.targetValue}`,
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
      title: b.expectedDate ? `Bucket list: ${b.title}` : `Bucket list: ${b.title}`,
      description: b.expectedDate ? `Target date ${b.expectedDate}` : "Don't lose the dream",
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
      title: `Todo reminder: ${a.title}`,
      description: `Scheduled for ${a.date}`,
      href: "/dashboard",
    })
  }

  return out.sort((a, b) => a.fireAt - b.fireAt)
}