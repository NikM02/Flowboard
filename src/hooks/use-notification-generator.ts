"use client"

import { useEffect, useRef } from "react"
import { differenceInDays, parseISO, startOfDay } from "date-fns"
import { notify } from "@/lib/notify"
import { useTaskStore } from "@/store/use-task-store"
import { useHabitStore } from "@/store/use-habit-store"
import { useChallengeStore } from "@/store/use-challenge-store"
import { useSkillStore } from "@/store/use-skill-store"
import { useFinanceStore } from "@/store/use-finance-store"
import { useContentStore } from "@/store/use-content-store"
import { useFutureStore } from "@/store/use-future-store"
import { useBucketListStore } from "@/store/use-bucket-list-store"
import { useAdvanceTodoStore } from "@/store/use-advance-todo-store"
import { useSleepStore } from "@/store/use-sleep-store"

export function useNotificationGenerator() {
  const notifiedDueTaskIds = useRef(new Set<string>())
  const ready = useRef(false)

  useEffect(() => {
    const timer = setTimeout(() => { ready.current = true }, 700)
    const skip = () => !ready.current

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
          notify("Task overdue!", `${t.title} was due ${Math.abs(daysUntilDue)} day(s) ago`, { tag: `due-${t.id}-over`, href: "/tasks" })
          notifiedDueTaskIds.current.add(key)
        } else if (daysUntilDue === 0) {
          notify("Task due today", t.title, { tag: `due-${t.id}-today`, href: "/tasks" })
          notifiedDueTaskIds.current.add(key)
        } else if (daysUntilDue <= 3) {
          notify(`Task due in ${daysUntilDue} day(s)`, t.title, { tag: `due-${t.id}-soon`, href: "/tasks" })
          notifiedDueTaskIds.current.add(key)
        }
      }
    }

    const unsubTasks = useTaskStore.subscribe((state, prevState) => {
      if (skip()) return
      const { tasks } = state
      const { tasks: prevTasks } = prevState

      if (tasks.length !== prevTasks.length || tasks.some((t, i) => t.dueDate !== prevTasks[i]?.dueDate)) {
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
          notify("Task completed", t.title, { tag: `task-done-${t.id}`, href: "/tasks" })
        } else if (!t.completed && prevT.completed) {
          notify("Task reopened", t.title, { tag: `task-open-${t.id}`, href: "/tasks" })
        }
      }
    })

    const interval = setInterval(checkDueTasks, 5 * 60 * 1000)

    const unsubHabits = useHabitStore.subscribe((state, prevState) => {
      if (skip()) return
      const { habits } = state
      const { habits: prevHabits } = prevState
      for (const h of habits) {
        const prevH = prevHabits.find((p) => p.id === h.id)
        if (!prevH) {
          notify("Habit created", `${h.name} — let's go!`, { tag: `habit-new-${h.id}`, href: "/habits" })
          continue
        }
        const newCompleted = h.records.filter((r) => r.completed).length
        const prevCompleted = prevH.records.filter((r) => r.completed).length
        if (newCompleted > prevCompleted) {
          notify("Habit check-in", `${h.name} — day marked`, { tag: `habit-done-${h.id}`, href: "/habits" })
        }
      }
    })

    const unsubChallenges = useChallengeStore.subscribe((state, prevState) => {
      if (skip()) return
      const { challenges } = state
      const { challenges: prevChallenges } = prevState
      for (const c of challenges) {
        const prevC = prevChallenges.find((p) => p.id === c.id)
        if (!prevC) continue
        const newDone = c.days.filter((d) => d.completed).length
        const prevDone = prevC.days.filter((d) => d.completed).length
        if (newDone > prevDone) {
          notify("Challenge day done", `${c.title} — day ${newDone}/${c.days.length}`, { tag: `chal-${c.id}-${newDone}`, href: "/habits" })
        }
      }
    })

    const unsubSkills = useSkillStore.subscribe((state, prevState) => {
      if (skip()) return
      const { skills } = state
      const { skills: prevSkills } = prevState
      for (const s of skills) {
        const prevS = prevSkills.find((p) => p.id === s.id)
        if (!prevS) {
          notify("Skill started", s.name, { tag: `skill-new-${s.id}`, href: "/skills" })
          continue
        }
        if (s.completed && !prevS.completed) {
          notify("Skill completed", s.name, { tag: `skill-done-${s.id}`, href: "/skills" })
        }
      }
    })

    const unsubFinance = useFinanceStore.subscribe((state, prevState) => {
      if (skip()) return
      const tagOf = (kind: string, id: string) => `fin-${kind}-${id}`
      if (state.incomes.length > prevState.incomes.length) {
        const latest = state.incomes[0]
        if (latest) notify("Income added", `${latest.source} · ₹${latest.amount.toLocaleString("en-IN")}`, { tag: tagOf("income", latest.id), href: "/finance" })
      }
      if (state.expenses.length > prevState.expenses.length) {
        const latest = state.expenses[0]
        if (latest) notify("Expense logged", `${latest.category} · ₹${latest.amount.toLocaleString("en-IN")}`, { tag: tagOf("expense", latest.id), href: "/finance" })
      }
      if (state.sips.length > prevState.sips.length) {
        const latest = state.sips[0]
        if (latest) notify("New SIP started", `${latest.name} · ₹${latest.amount.toLocaleString("en-IN")}/mo`, { tag: tagOf("sip", latest.id), href: "/investments" })
      }
      if (state.stocks.length > prevState.stocks.length) {
        const latest = state.stocks[0]
        if (latest) notify("Stock added", `${latest.name} (${latest.ticker})`, { tag: tagOf("stock", latest.id), href: "/investments" })
      }
      if (state.mutualFunds.length > prevState.mutualFunds.length) {
        const latest = state.mutualFunds[0]
        if (latest) notify("Mutual fund added", `${latest.name}`, { tag: tagOf("fund", latest.id), href: "/investments" })
      }
      if (state.budgets.length > prevState.budgets.length) {
        const latest = state.budgets[0]
        if (latest) notify("Budget set", `${latest.category} · limit ₹${latest.limit.toLocaleString("en-IN")}`, { tag: tagOf("budget", latest.id), href: "/finance" })
      }
    })

    const unsubContent = useContentStore.subscribe((state, prevState) => {
      if (skip()) return
      const { items } = state
      const { items: prevItems } = prevState
      if (items.length > prevItems.length) {
        const added = items.find((i) => !prevItems.some((p) => p.id === i.id))
        if (added) notify("New content idea", added.title, { tag: `content-new-${added.id}`, href: "/content-hub" })
      }
      for (const item of items) {
        const prev = prevItems.find((p) => p.id === item.id)
        if (!prev || prev.status === item.status) continue
        if (item.status === "published") {
          notify("Content published", item.title, { tag: `content-pub-${item.id}`, href: "/content-hub" })
        } else {
          notify("Content moved", `${item.title} → ${item.status}`, { tag: `content-${item.id}-${item.status}`, href: "/content-hub" })
        }
      }
    })

    const unsubFuture = useFutureStore.subscribe((state, prevState) => {
      if (skip()) return
      if (state.goals.length > prevState.goals.length) {
        const added = state.goals[0]
        if (added) notify("Goal created", added.title, { tag: `goal-new-${added.id}`, href: "/future" })
      }
      for (const goal of state.goals) {
        const prev = prevState.goals.find((p) => p.id === goal.id)
        if (!prev) continue
        if (goal.completed && !prev.completed) {
          notify("Goal achieved!", goal.title, { tag: `goal-done-${goal.id}`, href: "/future" })
        }
      }
    })

    const unsubBucket = useBucketListStore.subscribe((state, prevState) => {
      if (skip()) return
      if (state.items.length > prevState.items.length) {
        const added = state.items[0]
        if (added) notify("Bucket list dream added", added.title, { tag: `bucket-new-${added.id}`, href: "/skills/bucket-list" })
      }
      for (const item of state.items) {
        const prev = prevState.items.find((p) => p.id === item.id)
        if (!prev) continue
        if (item.completed && !prev.completed) {
          notify("Bucket list goal done!", item.title, { tag: `bucket-done-${item.id}`, href: "/skills/bucket-list" })
        }
      }
    })

    const unsubTodos = useAdvanceTodoStore.subscribe((state, prevState) => {
      if (skip()) return
      if (state.todos.length > prevState.todos.length) {
        const added = state.todos[0]
        if (added) notify("Todo added", added.title, { tag: `todo-new-${added.id}`, href: "/dashboard" })
      }
      for (const todo of state.todos) {
        const prev = prevState.todos.find((p) => p.id === todo.id)
        if (!prev) continue
        if (todo.completed && !prev.completed) {
          notify("Todo done", todo.title, { tag: `todo-done-${todo.id}`, href: "/dashboard" })
        }
      }
    })

    const unsubSleep = useSleepStore.subscribe((state, prevState) => {
      if (skip()) return
      if (state.entries.length > prevState.entries.length) {
        const added = state.entries[0]
        if (added) notify("Sleep logged", `Bed ${added.bedtime} · ${added.hours}h · quality ${added.quality}/5`, { tag: `sleep-${added.id}`, href: "/habits" })
      }
    })

    return () => {
      clearTimeout(timer)
      unsubTasks()
      unsubHabits()
      unsubChallenges()
      unsubSkills()
      unsubFinance()
      unsubContent()
      unsubFuture()
      unsubBucket()
      unsubTodos()
      unsubSleep()
      clearInterval(interval)
    }
  }, [])
}