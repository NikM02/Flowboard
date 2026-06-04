"use client"

import { useEffect, useRef } from "react"
import { useTaskStore } from "@/store/use-task-store"
import { useHabitStore } from "@/store/use-habit-store"
import { useChallengeStore } from "@/store/use-challenge-store"
import { useDopamineStore } from "@/store/use-dopamine-store"
import { useSkillStore } from "@/store/use-skill-store"
import { useFinanceStore } from "@/store/use-finance-store"
import { useFutureStore } from "@/store/use-future-store"

const STORAGE_KEY = "flowboard-data"

type AppData = {
  tasks: unknown[]
  habits: unknown[]
  challenges: unknown[]
  dopamine: unknown[]
  skills: unknown[]
  incomes: unknown[]
  expenses: unknown[]
  budgets: unknown[]
  sips: unknown[]
  stocks: unknown[]
  mutualFunds: unknown[]
  futureGoals: unknown[]
}

function save() {
  try {
    const data: AppData = {
      tasks: useTaskStore.getState().tasks,
      habits: useHabitStore.getState().habits,
      challenges: useChallengeStore.getState().challenges,
      dopamine: useDopamineStore.getState().entries,
      skills: useSkillStore.getState().skills,
      incomes: useFinanceStore.getState().incomes,
      expenses: useFinanceStore.getState().expenses,
      budgets: useFinanceStore.getState().budgets,
      sips: useFinanceStore.getState().sips,
      stocks: useFinanceStore.getState().stocks,
      mutualFunds: useFinanceStore.getState().mutualFunds,
      futureGoals: useFutureStore.getState().goals,
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch {}
}

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return
    const data: AppData = JSON.parse(raw)

    if (data.tasks?.length) useTaskStore.setState({ tasks: data.tasks as any })
    if (data.habits?.length) useHabitStore.setState({ habits: data.habits as any })
    if (data.challenges?.length) useChallengeStore.setState({ challenges: data.challenges as any })
    if (data.dopamine?.length) useDopamineStore.setState({ entries: data.dopamine as any })
    if (data.skills?.length) useSkillStore.setState({ skills: data.skills as any })
    if (data.incomes?.length) useFinanceStore.setState({ incomes: data.incomes as any })
    if (data.expenses?.length) useFinanceStore.setState({ expenses: data.expenses as any })
    if (data.budgets?.length) useFinanceStore.setState({ budgets: data.budgets as any })
    if (data.sips?.length) useFinanceStore.setState({ sips: data.sips as any })
    if (data.stocks?.length) useFinanceStore.setState({ stocks: data.stocks as any })
    if (data.mutualFunds?.length) useFinanceStore.setState({ mutualFunds: data.mutualFunds as any })
    if (data.futureGoals?.length) useFutureStore.setState({ goals: data.futureGoals as any })
  } catch {}
}

export function useLocalPersistence() {
  const loaded = useRef(false)

  useEffect(() => {
    if (loaded.current) return
    loaded.current = true
    load()
  }, [])

  useEffect(() => {
    const unsubs = [
      useTaskStore.subscribe(save),
      useHabitStore.subscribe(save),
      useChallengeStore.subscribe(save),
      useDopamineStore.subscribe(save),
      useSkillStore.subscribe(save),
      useFinanceStore.subscribe(save),
      useFutureStore.subscribe(save),
    ]
    return () => unsubs.forEach((u) => u())
  }, [])
}

export function clearLocalData() {
  localStorage.removeItem(STORAGE_KEY)
}
