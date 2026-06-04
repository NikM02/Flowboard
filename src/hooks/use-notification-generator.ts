"use client"

import { useEffect, useRef } from "react"
import { differenceInDays, parseISO, startOfDay } from "date-fns"
import { useNotificationStore } from "@/store/use-notification-store"
import { useTaskStore } from "@/store/use-task-store"
import { useHabitStore } from "@/store/use-habit-store"
import { useChallengeStore } from "@/store/use-challenge-store"
import { useSkillStore } from "@/store/use-skill-store"

export function useNotificationGenerator() {
  const add = useNotificationStore((s) => s.add)
  const notifiedDueTaskIds = useRef(new Set<string>())

  useEffect(() => {
    const checkDueTasks = () => {
      const { tasks } = useTaskStore.getState()
      const today = startOfDay(new Date())
      for (const t of tasks) {
        if (t.completed || !t.dueDate) continue
        const due = startOfDay(parseISO(t.dueDate))
        const daysUntilDue = differenceInDays(due, today)

        const key = `${t.id}-${t.dueDate}`
        if (notifiedDueTaskIds.current.has(key)) continue

        if (daysUntilDue < 0) {
          add({ title: "Task overdue!", description: `${t.title} was due ${Math.abs(daysUntilDue)} day(s) ago` })
          notifiedDueTaskIds.current.add(key)
        } else if (daysUntilDue === 0) {
          add({ title: "Task due today", description: t.title })
          notifiedDueTaskIds.current.add(key)
        } else if (daysUntilDue <= 3) {
          add({ title: `Task due in ${daysUntilDue} day(s)`, description: t.title })
          notifiedDueTaskIds.current.add(key)
        }
      }
    }

    // Check on mount and whenever tasks change
    checkDueTasks()

    const unsubTasks = useTaskStore.subscribe((state, prevState) => {
      const { tasks } = state
      const { tasks: prevTasks } = prevState

      // Re-check due dates when tasks change (new task added, due date changed)
      if (tasks.length !== prevTasks.length || tasks.some((t, i) => t.dueDate !== prevTasks[i]?.dueDate)) {
        // Clear stale keys for tasks that changed their due date
        for (const t of tasks) {
          const prevT = prevTasks.find((p) => p.id === t.id)
          if (prevT && t.dueDate !== prevT.dueDate) {
            notifiedDueTaskIds.current.delete(`${t.id}-${prevT.dueDate}`)
          }
        }
        checkDueTasks()
      }

      for (const t of tasks) {
        const prevT = prevTasks.find((p) => p.id === t.id)
        if (!prevT) continue
        if (t.completed && !prevT.completed) {
          add({ title: "Task completed", description: t.title })
        }
      }
    })

    // Periodic check every 5 minutes
    const interval = setInterval(checkDueTasks, 5 * 60 * 1000)

    const unsubHabits = useHabitStore.subscribe((state, prevState) => {
      const { habits } = state
      const { habits: prevHabits } = prevState
      for (const h of habits) {
        const prevH = prevHabits.find((p) => p.id === h.id)
        if (!prevH) continue
        const newCompleted = h.records.filter((r) => r.completed).length
        const prevCompleted = prevH.records.filter((r) => r.completed).length
        if (newCompleted > prevCompleted) {
          add({ title: "Habit check-in", description: `${h.name} — day marked` })
        }
      }
    })

    const unsubChallenges = useChallengeStore.subscribe((state, prevState) => {
      const { challenges } = state
      const { challenges: prevChallenges } = prevState
      for (const c of challenges) {
        const prevC = prevChallenges.find((p) => p.id === c.id)
        if (!prevC) continue
        const newDone = c.days.filter((d) => d.completed).length
        const prevDone = prevC.days.filter((d) => d.completed).length
        if (newDone > prevDone) {
          add({ title: "Challenge day done", description: `${c.title} — day ${newDone}/${c.days.length}` })
        }
      }
    })

    const unsubSkills = useSkillStore.subscribe((state, prevState) => {
      const { skills } = state
      const { skills: prevSkills } = prevState
      for (const s of skills) {
        const prevS = prevSkills.find((p) => p.id === s.id)
        if (!prevS) continue
        if (s.completed && !prevS.completed) {
          add({ title: "Skill completed", description: s.name })
        }
      }
    })

    return () => {
      unsubTasks()
      unsubHabits()
      unsubChallenges()
      unsubSkills()
      clearInterval(interval)
    }
  }, [add])
}
