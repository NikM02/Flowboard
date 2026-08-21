"use client"

import { useEffect, useRef } from "react"
import { useTaskStore } from "@/store/use-task-store"
import { useHabitStore } from "@/store/use-habit-store"
import { useFinanceStore } from "@/store/use-finance-store"
import { useCalendarStore } from "@/store/use-calendar-store"
import type { Task } from "@/types"

const CAL_SYNCED_KEY = "nexus-cal-synced"

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

function line(text: string): string {
  return `<p style="margin:4px 0;">${escapeHtml(text)}</p>`
}

async function sendVaultEmail(subject: string, body: string, category: "new" | "update" | "due") {
  try {
    await fetch("/api/email/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subject, bodyHtml: body, category }),
    })
  } catch {}
}

async function syncTaskEvent(action: "upsert" | "delete", task: Task) {
  try {
    await fetch("/api/calendar/event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, task }),
    })
  } catch {}
}

function taskEventPayload(task: Task): Task {
  return {
    id: task.id,
    title: task.title,
    description: task.description,
    project: task.project,
    completed: task.completed,
    dueDate: task.dueDate,
  } as Task
}

export function useIntegrationWatcher(hydrated: boolean) {
  const ready = useRef(false)

  useEffect(() => {
    if (!hydrated) return
    const timer = setTimeout(() => { ready.current = true }, 1500)

    const unsubTasks = useTaskStore.subscribe((state, prevState) => {
      if (!ready.current) return
      const { tasks } = state
      const { tasks: prevTasks } = prevState

      for (const t of tasks) {
        const prevT = prevTasks.find((p) => p.id === t.id)

        if (!prevT) {
          // New task
          sendVaultEmail(
            `\u2705 New task: ${t.title}`,
            line(`\ud83d\udccb ${t.title}`) +
              (t.description ? line(t.description) : "") +
              (t.dueDate ? line(`\ud83d\udcc5 Due: ${t.dueDate}`) : ""),
            "new"
          )
          syncTaskEvent("upsert", taskEventPayload(t))
        } else if (t.completed && !prevT.completed) {
          // Completed
          sendVaultEmail(`\u2709 Task completed: ${t.title}`, line(`\u2714 ${t.title}`), "update")
          syncTaskEvent("delete", taskEventPayload(t))
        } else if (t.dueDate !== prevT.dueDate) {
          // Due date changed
          syncTaskEvent("upsert", taskEventPayload(t))
        }
      }

      // Deleted tasks → remove calendar events
      for (const prevT of prevTasks) {
        if (!tasks.find((t) => t.id === prevT.id)) {
          syncTaskEvent("delete", taskEventPayload(prevT))
        }
      }
    })

    const unsubHabits = useHabitStore.subscribe((state, prevState) => {
      if (!ready.current) return
      const { habits } = state
      const { habits: prevHabits } = prevState

      for (const h of habits) {
        const prevH = prevHabits.find((p) => p.id === h.id)
        if (!prevH) {
          sendVaultEmail(`\u2764\ufe0f New habit: ${h.name}`, line(`\ud83c\udfc3 ${h.name}`), "new")
        } else {
          const newDone = h.records.filter((r) => r.completed).length
          const prevDone = prevH.records.filter((r) => r.completed).length
          if (newDone > prevDone) {
            sendVaultEmail(`\u2705 Habit checked: ${h.name}`, line(`\u2705 ${h.name} \u2014 day done`), "update")
          }
        }
      }
    })

    const unsubFinance = useFinanceStore.subscribe((state, prevState) => {
      if (!ready.current) return
      const { incomes, expenses } = state
      const { incomes: prevIncomes, expenses: prevExpenses } = prevState

      for (const i of incomes) {
        if (!prevIncomes.find((p) => p.id === i.id)) {
          sendVaultEmail(`\ud83d\udcb0 New income: \u20b9${i.amount.toLocaleString("en-IN")}`, line(`${i.source} on ${i.date}`), "new")
        }
      }
      for (const e of expenses) {
        if (!prevExpenses.find((p) => p.id === e.id)) {
          sendVaultEmail(`\ud83d\udcb0 New expense: \u20b9${e.amount.toLocaleString("en-IN")}`, line(`${e.description || e.category} on ${e.date}`), "new")
        }
      }
    })

    // Sync all existing tasks to Google Calendar once, right after connecting
    const unsubCalendar = useCalendarStore.subscribe((state, prevState) => {
      if (state.connected && !prevState.connected) {
        try { localStorage.removeItem(CAL_SYNCED_KEY) } catch {}
      }
    })

    const syncAllIfConnected = () => {
      try {
        if (localStorage.getItem(CAL_SYNCED_KEY)) return
        if (!useCalendarStore.getState().connected) return
        const tasks = useTaskStore.getState().tasks.filter((t) => t.dueDate && !t.completed)
        tasks.forEach((t) => syncTaskEvent("upsert", taskEventPayload(t)))
        localStorage.setItem(CAL_SYNCED_KEY, "1")
      } catch {}
    }

    const calSyncTimer = setTimeout(syncAllIfConnected, 2000)
    const calSyncInterval = setInterval(syncAllIfConnected, 60_000)

    return () => {
      clearTimeout(timer)
      clearTimeout(calSyncTimer)
      clearInterval(calSyncInterval)
      unsubTasks()
      unsubHabits()
      unsubFinance()
      unsubCalendar()
    }
  }, [hydrated])
}
