"use client"

import { useEffect } from "react"
import { useToastStore } from "@/store/use-toast-store"
import { useTaskStore } from "@/store/use-task-store"
import { useHabitStore } from "@/store/use-habit-store"
import { useChallengeStore } from "@/store/use-challenge-store"
import { useDopamineStore } from "@/store/use-dopamine-store"
import { useSkillStore } from "@/store/use-skill-store"
import { useFinanceStore } from "@/store/use-finance-store"

export function useToastWatcher(onAdd: () => void) {
  const show = useToastStore((s) => s.show)

  useEffect(() => {
    const unsubTasks = useTaskStore.subscribe((state, prevState) => {
      const { tasks } = state
      const { tasks: prevTasks } = prevState
      if (tasks.length > prevTasks.length) {
        const added = tasks[0]
        show({ type: "success", title: "Task added", description: added.title })
        onAdd()
      } else if (tasks.length < prevTasks.length) {
        show({ type: "info", title: "Task deleted" })
      } else {
        for (const t of tasks) {
          const prevT = prevTasks.find((p) => p.id === t.id)
          if (!prevT) continue
          if (t.completed !== prevT.completed) {
            show({ type: "success", title: t.completed ? "Task completed" : "Task reopened", description: t.title })
            return
          }
        }
      }
    })

    const unsubHabits = useHabitStore.subscribe((state, prevState) => {
      const { habits } = state
      const { habits: prevHabits } = prevState
      if (habits.length > prevHabits.length) {
        const added = habits[0]
        show({ type: "success", title: "Habit created", description: added.name })
        onAdd()
      } else if (habits.length < prevHabits.length) {
        show({ type: "info", title: "Habit deleted" })
      } else {
        for (const h of habits) {
          const prevH = prevHabits.find((p) => p.id === h.id)
          if (!prevH) continue
          const newCompleted = h.records.filter((r) => r.completed).length
          const prevCompleted = prevH.records.filter((r) => r.completed).length
          if (newCompleted > prevCompleted) {
            show({ type: "success", title: "Day marked for", description: h.name })
            return
          } else if (newCompleted < prevCompleted) {
            show({ type: "info", title: "Day unmarked for", description: h.name })
            return
          }
        }
      }
    })

    const unsubChallenges = useChallengeStore.subscribe((state, prevState) => {
      const { challenges } = state
      const { challenges: prevChallenges } = prevState
      if (challenges.length > prevChallenges.length) {
        const added = challenges[0]
        show({ type: "success", title: "Challenge created", description: added.title })
        onAdd()
      } else if (challenges.length < prevChallenges.length) {
        show({ type: "info", title: "Challenge deleted" })
      } else {
        for (const c of challenges) {
          const prevC = prevChallenges.find((p) => p.id === c.id)
          if (!prevC) continue
          const newDone = c.days.filter((d) => d.completed).length
          const prevDone = prevC.days.filter((d) => d.completed).length
          if (newDone > prevDone) {
            show({ type: "success", title: "Day completed", description: c.title })
            return
          }
        }
      }
    })

    const unsubDopamine = useDopamineStore.subscribe((state, prevState) => {
      if (state.entries.length > prevState.entries.length) {
        show({ type: "success", title: "Daily check-in saved" })
        onAdd()
      }
    })

    const unsubSkills = useSkillStore.subscribe((state, prevState) => {
      const { skills } = state
      const { skills: prevSkills } = prevState
      if (skills.length > prevSkills.length) {
        const added = skills[0]
        show({ type: "success", title: "Skill added", description: added.name })
        onAdd()
      } else if (skills.length < prevSkills.length) {
        show({ type: "info", title: "Skill deleted" })
      } else {
        for (const s of skills) {
          const prevS = prevSkills.find((p) => p.id === s.id)
          if (!prevS) continue
          if (s.completed && !prevS.completed) {
            show({ type: "success", title: "Skill completed", description: s.name })
            return
          }
          if (s.progress !== prevS.progress) {
            show({ type: "info", title: `Progress updated: ${s.name}`, description: `${prevS.progress}% → ${s.progress}%` })
            return
          }
        }
      }
    })

    const unsubFinance = useFinanceStore.subscribe((state, prevState) => {
      if (state.incomes.length > prevState.incomes.length) {
        const added = state.incomes[0]
        show({ type: "success", title: "Income added", description: `₹${added.amount} — ${added.description}` })
        onAdd()
      } else if (state.incomes.length < prevState.incomes.length) {
        show({ type: "info", title: "Income deleted" })
      }

      if (state.expenses.length > prevState.expenses.length) {
        const added = state.expenses[0]
        show({ type: "success", title: "Expense added", description: `₹${added.amount} — ${added.description}` })
        onAdd()
      } else if (state.expenses.length < prevState.expenses.length) {
        show({ type: "info", title: "Expense deleted" })
      }

      if (state.sips.length > prevState.sips.length) {
        show({ type: "success", title: "SIP added", description: state.sips[0].name })
        onAdd()
      } else if (state.sips.length < prevState.sips.length) {
        show({ type: "info", title: "SIP deleted" })
      }

      if (state.stocks.length > prevState.stocks.length) {
        show({ type: "success", title: "Stock added", description: state.stocks[0].name })
        onAdd()
      } else if (state.stocks.length < prevState.stocks.length) {
        show({ type: "info", title: "Stock deleted" })
      }

      if (state.mutualFunds.length > prevState.mutualFunds.length) {
        show({ type: "success", title: "Mutual fund added", description: state.mutualFunds[0].name })
        onAdd()
      } else if (state.mutualFunds.length < prevState.mutualFunds.length) {
        show({ type: "info", title: "Mutual fund deleted" })
      }
    })

    return () => {
      unsubTasks()
      unsubHabits()
      unsubChallenges()
      unsubDopamine()
      unsubSkills()
      unsubFinance()
    }
  }, [show, onAdd])
}
