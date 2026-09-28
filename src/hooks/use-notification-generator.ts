"use client"

import { useEffect, useRef } from "react"
import { differenceInDays, parseISO, startOfDay, format } from "date-fns"
import { notify } from "@/lib/notify"
import { useTaskStore } from "@/store/use-task-store"
import { useHabitStore } from "@/store/use-habit-store"
import { useChallengeStore } from "@/store/use-challenge-store"
import { useSkillStore } from "@/store/use-skill-store"
import { useFinanceStore } from "@/store/use-finance-store"
import { useFutureStore } from "@/store/use-future-store"
import { useBucketListStore } from "@/store/use-bucket-list-store"
import { useAdvanceTodoStore } from "@/store/use-advance-todo-store"
import { useSleepStore } from "@/store/use-sleep-store"
import type { Task } from "@/types"

function taskDetail(t: Task): string {
  const bits: string[] = []
  if (t.project) bits.push(t.project)
  bits.push(t.priority === "high" ? "High priority" : t.priority === "medium" ? "Medium priority" : "Low priority")
  if (t.storyPoints != null) bits.push(`${t.storyPoints} pts`)
  if (t.subtasks.length > 0) {
    const done = t.subtasks.filter((s) => s.completed).length
    bits.push(`${done}/${t.subtasks.length} subtasks`)
  }
  if (t.progress > 0 && t.progress < 100) bits.push(`${t.progress}% done`)
  if (t.dueTime) {
    try {
      bits.push(`due ${format(parseISO(`${t.dueDate}T${t.dueTime}`), "h:mm a")}`)
    } catch {}
  }
  return bits.join(" · ")
}

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

        const detail = taskDetail(t)
        if (daysUntilDue < 0) {
          notify("Task overdue!", `${t.title} was due ${Math.abs(daysUntilDue)} day(s) ago${detail ? ` — ${detail}` : ""}`, { tag: `due-${t.id}-over`, href: "/tasks" })
          notifiedDueTaskIds.current.add(key)
        } else if (daysUntilDue === 0) {
          notify("Task due today", detail ? `${t.title} — ${detail}` : t.title, { tag: `due-${t.id}-today`, href: "/tasks" })
          notifiedDueTaskIds.current.add(key)
        } else if (daysUntilDue <= 3) {
          notify(`Task due in ${daysUntilDue} day(s)`, detail ? `${t.title} — ${detail}` : t.title, { tag: `due-${t.id}-soon`, href: "/tasks" })
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
          const detail = taskDetail(t)
          notify("Task completed ✓", detail ? `${t.title} — ${detail}` : t.title, { tag: `task-done-${t.id}`, href: "/tasks" })
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
          let streak = 0
          try {
            streak = useHabitStore.getState().getStreak(h.id)
          } catch {}
          notify("Habit check-in ✓", `${h.name} — ${newCompleted} day(s) logged${streak > 0 ? ` · ${streak}-day streak 🔥` : ""}`, { tag: `habit-done-${h.id}`, href: "/habits" })
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
          notify("Challenge day done ✓", `${c.title} — day ${newDone}/${c.days.length}${c.endDate ? ` · ends ${c.endDate}` : ""}`, { tag: `chal-${c.id}-${newDone}`, href: "/habits" })
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
          notify("Skill started", `${s.name} via ${s.source}${s.sourceDetail ? ` (${s.sourceDetail})` : ""}${s.endDate ? ` · target ${s.endDate}` : ""}`, { tag: `skill-new-${s.id}`, href: "/skills" })
          continue
        }
        if (s.completed && !prevS.completed) {
          notify("Skill completed 🎉", `${s.name} — ${s.progress}% · ${s.source}${s.notes ? ` · "${s.notes.slice(0, 60)}"` : ""}`, { tag: `skill-done-${s.id}`, href: "/skills" })
        } else if (s.progress !== prevS.progress) {
          notify("Skill progress", `${s.name} — now ${s.progress}% (was ${prevS.progress}%)`, { tag: `skill-prog-${s.id}-${s.progress}`, href: "/skills" })
        }
      }
    })

    const unsubFinance = useFinanceStore.subscribe((state, prevState) => {
      if (skip()) return
      const tagOf = (kind: string, id: string) => `fin-${kind}-${id}`
      if (state.incomes.length > prevState.incomes.length) {
        const latest = state.incomes[0]
        if (latest) notify("Income added 💰", `${latest.source} · ₹${latest.amount.toLocaleString("en-IN")}${latest.description ? ` — ${latest.description}` : ""} · ${latest.date}`, { tag: tagOf("income", latest.id), href: "/finance" })
      }
      if (state.expenses.length > prevState.expenses.length) {
        const latest = state.expenses[0]
        if (latest) notify("Expense logged", `${latest.category} · ₹${latest.amount.toLocaleString("en-IN")}${latest.description ? ` — ${latest.description}` : ""} · ${latest.date}`, { tag: tagOf("expense", latest.id), href: "/finance" })
      }
      if (state.sips.length > prevState.sips.length) {
        const latest = state.sips[0]
        if (latest) notify("New SIP started", `${latest.name} · ₹${latest.amount.toLocaleString("en-IN")}/mo · ${latest.expectedReturn}% expected`, { tag: tagOf("sip", latest.id), href: "/investments" })
      }
      if (state.stocks.length > prevState.stocks.length) {
        const latest = state.stocks[0]
        if (latest) notify("Stock added", `${latest.name} (${latest.ticker}) · ${latest.quantity} × ₹${latest.buyPrice.toLocaleString("en-IN")}`, { tag: tagOf("stock", latest.id), href: "/investments" })
      }
      if (state.mutualFunds.length > prevState.mutualFunds.length) {
        const latest = state.mutualFunds[0]
        if (latest) notify("Mutual fund added", `${latest.name} · ${latest.units} units @ ₹${latest.nav}`, { tag: tagOf("fund", latest.id), href: "/investments" })
      }
      if (state.budgets.length > prevState.budgets.length) {
        const latest = state.budgets[0]
        if (latest) notify("Budget set", `${latest.category} · limit ₹${latest.limit.toLocaleString("en-IN")} · ${latest.month}`, { tag: tagOf("budget", latest.id), href: "/finance" })
      }
    })

    const unsubFuture = useFutureStore.subscribe((state, prevState) => {
      if (skip()) return
      if (state.goals.length > prevState.goals.length) {
        const added = state.goals[0]
        if (added) notify("Goal created", `${added.title} — target ${added.targetValue} (${added.period})`, { tag: `goal-new-${added.id}`, href: "/future" })
      }
      for (const goal of state.goals) {
        const prev = prevState.goals.find((p) => p.id === goal.id)
        if (!prev) continue
        if (goal.completed && !prev.completed) {
          notify("Goal achieved! 🎉", `${goal.title} — ${goal.currentValue}/${goal.targetValue}`, { tag: `goal-done-${goal.id}`, href: "/future" })
        } else if (goal.currentValue !== prev.currentValue) {
          notify("Goal progress", `${goal.title} — ${goal.currentValue}/${goal.targetValue}`, { tag: `goal-prog-${goal.id}-${goal.currentValue}`, href: "/future" })
        }
      }
    })

    const unsubBucket = useBucketListStore.subscribe((state, prevState) => {
      if (skip()) return
      if (state.items.length > prevState.items.length) {
        const added = state.items[0]
        if (added) notify("Bucket list dream added ✨", `${added.title}${added.timeframe ? ` · ${added.timeframe}` : ""}${added.expectedDate ? ` · by ${added.expectedDate}` : ""}`, { tag: `bucket-new-${added.id}`, href: "/skills/bucket-list" })
      }
      for (const item of state.items) {
        const prev = prevState.items.find((p) => p.id === item.id)
        if (!prev) continue
        if (item.completed && !prev.completed) {
          notify("Bucket list goal done! 🎉", `${item.title}${item.description ? ` — ${item.description.slice(0, 60)}` : ""}`, { tag: `bucket-done-${item.id}`, href: "/skills/bucket-list" })
        }
      }
    })

    const unsubTodos = useAdvanceTodoStore.subscribe((state, prevState) => {
      if (skip()) return
      if (state.todos.length > prevState.todos.length) {
        const added = state.todos[0]
        if (added) notify("Todo added", `${added.title} · ${added.date}${added.reminder ? ` · ⏰ ${added.reminder}` : ""}`, { tag: `todo-new-${added.id}`, href: "/dashboard" })
      }
      for (const todo of state.todos) {
        const prev = prevState.todos.find((p) => p.id === todo.id)
        if (!prev) continue
        if (todo.completed && !prev.completed) {
          notify("Todo done ✓", `${todo.title} · ${todo.date}`, { tag: `todo-done-${todo.id}`, href: "/dashboard" })
        }
      }
    })

    const unsubSleep = useSleepStore.subscribe((state, prevState) => {
      if (skip()) return
      if (state.entries.length > prevState.entries.length) {
        const added = state.entries[0]
        if (added) notify("Sleep logged 😴", `Bed ${added.bedtime} → ${added.wakeTime} · ${added.hours}h · quality ${added.quality}/5${added.notes ? ` · "${added.notes.slice(0, 50)}"` : ""}`, { tag: `sleep-${added.id}`, href: "/habits" })
      }
    })

    return () => {
      clearTimeout(timer)
      unsubTasks()
      unsubHabits()
      unsubChallenges()
      unsubSkills()
      unsubFinance()
      unsubFuture()
      unsubBucket()
      unsubTodos()
      unsubSleep()
      clearInterval(interval)
    }
  }, [])
}