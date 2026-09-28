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
import type {
  Task, Habit, Challenge, SkillEntry, Income, Expense, SIP, Stock, MutualFund, Budget,
  FutureGoal, BucketListItem, AdvanceTodo, SleepEntry,
} from "@/types"

function trunc(s: string, n = 60): string {
  return s.length > n ? `${s.slice(0, n)}…` : s
}

function removedItems<T extends { id: string }>(cur: T[], prev: T[]): T[] {
  return prev.filter((p) => !cur.some((i) => i.id === p.id))
}

function editedItems<T extends { id: string }>(cur: T[], prev: T[], keys: (keyof T)[]): { cur: T; prev: T; changed: string[] }[] {
  const res: { cur: T; prev: T; changed: string[] }[] = []
  for (const item of cur) {
    const prevItem = prev.find((p) => p.id === item.id)
    if (!prevItem) continue
    const changed = keys.filter((k) => item[k] !== prevItem[k]).map(String)
    if (changed.length) res.push({ cur: item, prev: prevItem, changed })
  }
  return res
}

function labels(defs: Record<string, string>, changed: string[]): string {
  return changed.map((k) => defs[k] ?? k).join(", ")
}

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

function finDiff<T extends { id: string }>(
  cur: T[],
  prev: T[],
  href: string,
  base: string,
  describe: {
    add: (x: T) => string
    remove: (x: T) => string
    edit: (x: T, changed: string[]) => string
  },
  editKeys: (keyof T)[]
) {
  const tagOf = (kind: string, id: string) => `fin-${kind}-${id}`
  if (cur.length > prev.length) {
    const latest = cur[0]
    if (latest) notify(`${base} added`, describe.add(latest), { tag: tagOf("add", latest.id), href, icon: "add" })
  }
  for (const removed of removedItems(cur, prev)) {
    notify(`${base} deleted`, describe.remove(removed), { tag: tagOf("del", removed.id), href, icon: "delete" })
  }
  for (const { cur: item, changed } of editedItems(cur, prev, editKeys)) {
    notify(`${base} edited`, describe.edit(item, changed), { tag: tagOf(`edit-${changed.join("|")}`, item.id), href, icon: "edit" })
  }
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
          notify("Task overdue!", `${t.title} was due ${Math.abs(daysUntilDue)} day(s) ago${detail ? ` — ${detail}` : ""}`, { tag: `due-${t.id}-over`, href: "/tasks", icon: "info" })
          notifiedDueTaskIds.current.add(key)
        } else if (daysUntilDue === 0) {
          notify("Task due today", detail ? `${t.title} — ${detail}` : t.title, { tag: `due-${t.id}-today`, href: "/tasks", icon: "info" })
          notifiedDueTaskIds.current.add(key)
        } else if (daysUntilDue <= 3) {
          notify(`Task due in ${daysUntilDue} day(s)`, detail ? `${t.title} — ${detail}` : t.title, { tag: `due-${t.id}-soon`, href: "/tasks", icon: "info" })
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
        if (!prevT) {
          notify("Task added", taskDetail(t) ? `${t.title} — ${taskDetail(t)}` : t.title, { tag: `task-new-${t.id}`, href: "/tasks", icon: "add" })
          continue
        }
        if (t.completed && !prevT.completed) {
          const detail = taskDetail(t)
          notify("Task completed ✓", detail ? `${t.title} — ${detail}` : t.title, { tag: `task-done-${t.id}`, href: "/tasks", icon: "done" })
        } else if (!t.completed && prevT.completed) {
          notify("Task reopened", t.title, { tag: `task-open-${t.id}`, href: "/tasks", icon: "edit" })
        }
      }

      for (const t of removedItems(tasks, prevTasks)) {
        notify("Task deleted", `${trunc(t.title)} — removed from ${t.project.trim() || "no project"}`, { tag: `task-del-${t.id}`, href: "/tasks", icon: "delete" })
      }
      for (const { cur, prev } of editedItems(tasks, prevTasks, ["title", "description", "project", "priority", "dueDate", "dueTime", "storyPoints"] as (keyof Task)[])) {
        const changed = labels(
          { title: "title", description: "description", project: "project", priority: "priority", dueDate: "due date", dueTime: "time", storyPoints: "points" },
          ["title", "description", "project", "priority", "dueDate", "dueTime", "storyPoints"].filter((k) => cur[k as keyof Task] !== prev[k as keyof Task])
        )
        const label = cur.title !== prev.title ? `"${prev.title}" → "${cur.title}"` : `"${cur.title}"`
        notify("Task edited", `${label} · ${changed}`, { tag: `task-edit-${cur.id}-${changed}`, href: "/tasks", icon: "edit" })
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
          notify("Habit created", `${h.name} — let's go!`, { tag: `habit-new-${h.id}`, href: "/habits", icon: "add" })
          continue
        }
        const newCompleted = h.records.filter((r) => r.completed).length
        const prevCompleted = prevH.records.filter((r) => r.completed).length
        if (newCompleted > prevCompleted) {
          let streak = 0
          try {
            streak = useHabitStore.getState().getStreak(h.id)
          } catch {}
          notify("Habit check-in ✓", `${h.name} — ${newCompleted} day(s) logged${streak > 0 ? ` · ${streak}-day streak 🔥` : ""}`, { tag: `habit-done-${h.id}`, href: "/habits", icon: "done" })
        }
      }
      for (const h of removedItems(habits, prevHabits)) {
        notify("Habit deleted", `${trunc(h.name)} removed from your routine`, { tag: `habit-del-${h.id}`, href: "/habits", icon: "delete" })
      }
      for (const { cur, prev } of editedItems(habits, prevHabits, ["name", "category", "frequency"] as (keyof Habit)[])) {
        const changed = labels({ name: "name", category: "category", frequency: "schedule" }, ["name", "category", "frequency"].filter((k) => cur[k as keyof Habit] !== prev[k as keyof Habit]))
        notify("Habit edited", `${trunc(cur.name)} · ${changed}`, { tag: `habit-edit-${cur.id}-${changed}`, href: "/habits", icon: "edit" })
      }
    })

    const unsubChallenges = useChallengeStore.subscribe((state, prevState) => {
      if (skip()) return
      const { challenges } = state
      const { challenges: prevChallenges } = prevState
      for (const c of challenges) {
        const prevC = prevChallenges.find((p) => p.id === c.id)
        if (!prevC) {
          notify("Challenge started", `${c.title} — ${c.days.length}-day${c.endDate ? ` · ends ${c.endDate}` : ""}`, { tag: `chal-new-${c.id}`, href: "/habits", icon: "add" })
          continue
        }
        const newDone = c.days.filter((d) => d.completed).length
        const prevDone = prevC.days.filter((d) => d.completed).length
        if (newDone > prevDone) {
          notify("Challenge day done ✓", `${c.title} — day ${newDone}/${c.days.length}${c.endDate ? ` · ends ${c.endDate}` : ""}`, { tag: `chal-${c.id}-${newDone}`, href: "/habits", icon: "done" })
        }
      }
      for (const c of removedItems(challenges, prevChallenges)) {
        notify("Challenge removed", `${trunc(c.title)} — stopped`, { tag: `chal-del-${c.id}`, href: "/habits", icon: "delete" })
      }
      for (const { cur, prev } of editedItems(challenges, prevChallenges, ["title", "description"] as (keyof Challenge)[])) {
        const changed = labels({ title: "title", description: "description" }, ["title", "description"].filter((k) => cur[k as keyof Challenge] !== prev[k as keyof Challenge]))
        notify("Challenge edited", `${trunc(cur.title)} · ${changed}`, { tag: `chal-edit-${cur.id}-${changed}`, href: "/habits", icon: "edit" })
      }
    })

    const unsubSkills = useSkillStore.subscribe((state, prevState) => {
      if (skip()) return
      const { skills } = state
      const { skills: prevSkills } = prevState
      for (const s of skills) {
        const prevS = prevSkills.find((p) => p.id === s.id)
        if (!prevS) {
          notify("Skill started", `${s.name} via ${s.source}${s.sourceDetail ? ` (${s.sourceDetail})` : ""}${s.endDate ? ` · target ${s.endDate}` : ""}`, { tag: `skill-new-${s.id}`, href: "/skills", icon: "add" })
          continue
        }
        if (s.completed && !prevS.completed) {
          notify("Skill completed 🎉", `${s.name} — ${s.progress}% · ${s.source}${s.notes ? ` · "${s.notes.slice(0, 60)}"` : ""}`, { tag: `skill-done-${s.id}`, href: "/skills", icon: "done" })
        } else if (s.progress !== prevS.progress) {
          notify("Skill progress", `${s.name} — now ${s.progress}% (was ${prevS.progress}%)`, { tag: `skill-prog-${s.id}-${s.progress}`, href: "/skills", icon: "info" })
        }
      }
      for (const s of removedItems(skills, prevSkills)) {
        notify("Skill deleted", `${trunc(s.name)} — removed from your journey`, { tag: `skill-del-${s.id}`, href: "/skills", icon: "delete" })
      }
      for (const { cur, prev } of editedItems(skills, prevSkills, ["name", "source", "sourceDetail", "endDate"] as (keyof SkillEntry)[])) {
        const changed = labels({ name: "name", source: "source", sourceDetail: "source detail", endDate: "target date" }, ["name", "source", "sourceDetail", "endDate"].filter((k) => cur[k as keyof SkillEntry] !== prev[k as keyof SkillEntry]))
        notify("Skill edited", `${trunc(cur.name)} · ${changed}`, { tag: `skill-edit-${cur.id}-${changed}`, href: "/skills", icon: "edit" })
      }
    })

    const unsubFinance = useFinanceStore.subscribe((state, prevState) => {
      if (skip()) return
      finDiff<Income>(state.incomes, prevState.incomes, "/finance", "Income", {
        add: (i) => `${i.source} · ₹${i.amount.toLocaleString("en-IN")}${i.description ? ` — ${i.description}` : ""} · ${i.date}`,
        remove: (i) => `${i.source} · ₹${i.amount.toLocaleString("en-IN")} · ${i.date} — removed`,
        edit: (i, c) => `${labels({ source: "source", amount: "amount", date: "date", description: "description" }, c)} — ₹${i.amount.toLocaleString("en-IN")}`,
      }, ["source", "amount", "date", "description"] as (keyof Income)[])
      finDiff<Expense>(state.expenses, prevState.expenses, "/finance", "Expense", {
        add: (e) => `${e.category} · ₹${e.amount.toLocaleString("en-IN")}${e.description ? ` — ${e.description}` : ""} · ${e.date}`,
        remove: (e) => `${e.category} · ₹${e.amount.toLocaleString("en-IN")} · ${e.date} — removed`,
        edit: (e, c) => `${labels({ category: "category", amount: "amount", date: "date", description: "description" }, c)} — ₹${e.amount.toLocaleString("en-IN")}`,
      }, ["category", "amount", "date", "description"] as (keyof Expense)[])
      finDiff<SIP>(state.sips, prevState.sips, "/investments", "SIP", {
        add: (s) => `${s.name} · ₹${s.amount.toLocaleString("en-IN")}/mo · ${s.expectedReturn}% expected`,
        remove: (s) => `${s.name} — stopped`,
        edit: (s, c) => `${trunc(s.name)} · ${labels({ name: "name", amount: "amount", expectedReturn: "expected return" }, c)}`,
      }, ["name", "amount", "expectedReturn"] as (keyof SIP)[])
      finDiff<Stock>(state.stocks, prevState.stocks, "/investments", "Stock", {
        add: (s) => `${s.name} (${s.ticker}) · ${s.quantity} × ₹${s.buyPrice.toLocaleString("en-IN")}`,
        remove: (s) => `${s.name} (${s.ticker}) — sold or removed`,
        edit: (s, c) => `${s.name} (${s.ticker}) · ${labels({ buyPrice: "buy price", quantity: "quantity", currentPrice: "current price" }, c)}`,
      }, ["buyPrice", "quantity", "currentPrice"] as (keyof Stock)[])
      finDiff<MutualFund>(state.mutualFunds, prevState.mutualFunds, "/investments", "Mutual fund", {
        add: (m) => `${m.name} · ${m.units} units @ ₹${m.nav}`,
        remove: (m) => `${m.name} — redeemed or removed`,
        edit: (m, c) => `${trunc(m.name)} · ${labels({ units: "units", nav: "nav" }, c)}`,
      }, ["units", "nav"] as (keyof MutualFund)[])
      finDiff<Budget>(state.budgets, prevState.budgets, "/finance", "Budget", {
        add: (b) => `${b.category} · limit ₹${b.limit.toLocaleString("en-IN")} · ${b.month}`,
        remove: (b) => `Limit ₹${b.limit.toLocaleString("en-IN")} on ${b.category} removed`,
        edit: (b, c) => `${b.category} · ${labels({ limit: "limit", month: "month" }, c)}`,
      }, ["limit", "month"] as (keyof Budget)[])
    })

    const unsubFuture = useFutureStore.subscribe((state, prevState) => {
      if (skip()) return
      for (const goal of state.goals) {
        const prev = prevState.goals.find((p) => p.id === goal.id)
        if (!prev) {
          notify("Goal created", `${goal.title} — target ${goal.targetValue} (${goal.period})`, { tag: `goal-new-${goal.id}`, href: "/future", icon: "add" })
          continue
        }
        if (goal.completed && !prev.completed) {
          notify("Goal achieved! 🎉", `${goal.title} — ${goal.currentValue}/${goal.targetValue}`, { tag: `goal-done-${goal.id}`, href: "/future", icon: "done" })
        } else if (goal.currentValue !== prev.currentValue) {
          notify("Goal progress", `${goal.title} — ${goal.currentValue}/${goal.targetValue}`, { tag: `goal-prog-${goal.id}-${goal.currentValue}`, href: "/future", icon: "info" })
        }
      }
      for (const g of removedItems(state.goals, prevState.goals)) {
        notify("Goal deleted", `${trunc(g.title)} — removed`, { tag: `goal-del-${g.id}`, href: "/future", icon: "delete" })
      }
      for (const { cur, prev } of editedItems<FutureGoal>(state.goals, prevState.goals, ["title", "targetValue", "period"] as (keyof FutureGoal)[])) {
        const changed = labels({ title: "title", targetValue: "target", period: "period" }, ["title", "targetValue", "period"].filter((k) => cur[k as keyof FutureGoal] !== prev[k as keyof FutureGoal]))
        notify("Goal edited", `${trunc(cur.title)} · ${changed}`, { tag: `goal-edit-${cur.id}-${changed}`, href: "/future", icon: "edit" })
      }
    })

    const unsubBucket = useBucketListStore.subscribe((state, prevState) => {
      if (skip()) return
      for (const item of state.items) {
        const prev = prevState.items.find((p) => p.id === item.id)
        if (!prev) {
          notify("Bucket list dream added ✨", `${item.title}${item.timeframe ? ` · ${item.timeframe}` : ""}${item.expectedDate ? ` · by ${item.expectedDate}` : ""}`, { tag: `bucket-new-${item.id}`, href: "/skills/bucket-list", icon: "add" })
          continue
        }
        if (item.completed && !prev.completed) {
          notify("Bucket list goal done! 🎉", `${item.title}${item.description ? ` — ${item.description.slice(0, 60)}` : ""}`, { tag: `bucket-done-${item.id}`, href: "/skills/bucket-list", icon: "done" })
        }
      }
      for (const item of removedItems(state.items, prevState.items)) {
        notify("Bucket list item deleted", `${trunc(item.title)} — removed`, { tag: `bucket-del-${item.id}`, href: "/skills/bucket-list", icon: "delete" })
      }
      for (const { cur, prev } of editedItems<BucketListItem>(state.items, prevState.items, ["title", "timeframe", "expectedDate"] as (keyof BucketListItem)[])) {
        const changed = labels({ title: "title", timeframe: "timeframe", expectedDate: "by date" }, ["title", "timeframe", "expectedDate"].filter((k) => cur[k as keyof BucketListItem] !== prev[k as keyof BucketListItem]))
        notify("Bucket list item edited", `${trunc(cur.title)} · ${changed}`, { tag: `bucket-edit-${cur.id}-${changed}`, href: "/skills/bucket-list", icon: "edit" })
      }
    })

    const unsubTodos = useAdvanceTodoStore.subscribe((state, prevState) => {
      if (skip()) return
      for (const todo of state.todos) {
        const prev = prevState.todos.find((p) => p.id === todo.id)
        if (!prev) {
          notify("Todo added", `${todo.title} · ${todo.date}${todo.reminder ? ` · ⏰ ${todo.reminder}` : ""}`, { tag: `todo-new-${todo.id}`, href: "/dashboard", icon: "add" })
          continue
        }
        if (todo.completed && !prev.completed) {
          notify("Todo done ✓", `${todo.title} · ${todo.date}`, { tag: `todo-done-${todo.id}`, href: "/dashboard", icon: "done" })
        }
      }
      for (const todo of removedItems(state.todos, prevState.todos)) {
        notify("Todo deleted", `${trunc(todo.title)} — removed`, { tag: `todo-del-${todo.id}`, href: "/dashboard", icon: "delete" })
      }
      for (const { cur, prev } of editedItems<AdvanceTodo>(state.todos, prevState.todos, ["title", "date", "reminder"] as (keyof AdvanceTodo)[])) {
        const changed = labels({ title: "title", date: "date", reminder: "reminder" }, ["title", "date", "reminder"].filter((k) => cur[k as keyof AdvanceTodo] !== prev[k as keyof AdvanceTodo]))
        notify("Todo edited", `${trunc(cur.title)} · ${changed}`, { tag: `todo-edit-${cur.id}-${changed}`, href: "/dashboard", icon: "edit" })
      }
    })

    const unsubSleep = useSleepStore.subscribe((state, prevState) => {
      if (skip()) return
      for (const e of state.entries) {
        const prev = prevState.entries.find((p) => p.id === e.id)
        if (!prev) {
          notify("Sleep logged 😴", `Bed ${e.bedtime} → ${e.wakeTime} · ${e.hours}h · quality ${e.quality}/5${e.notes ? ` · "${e.notes.slice(0, 50)}"` : ""}`, { tag: `sleep-${e.id}`, href: "/habits", icon: "add" })
          continue
        }
        if (e.bedtime !== prev.bedtime || e.wakeTime !== prev.wakeTime || e.quality !== prev.quality) {
          notify("Sleep record edited", `${e.date} · ${e.hours}h · quality ${e.quality}/5`, { tag: `sleep-edit-${e.id}-${e.hours}`, href: "/habits", icon: "edit" })
        }
      }
      for (const e of removedItems(state.entries, prevState.entries)) {
        notify("Sleep record deleted", `${e.date}${e.hours ? ` · ${e.hours}h` : ""} — removed`, { tag: `sleep-del-${e.id}`, href: "/habits", icon: "delete" })
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