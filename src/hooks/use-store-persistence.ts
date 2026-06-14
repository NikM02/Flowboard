"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
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

function collectData(): AppData {
  return {
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
}

function saveToLocal(data: AppData) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch {}
}

function loadFromLocal() {
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

export function useSupabasePersistence() {
  const [loading, setLoading] = useState(true)
  const loadedRef = useRef(false)
  const userIdRef = useRef<string | null>(null)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const saveToSupabase = useCallback(async (data: AppData) => {
    const uid = userIdRef.current
    if (!uid) return
    try {
      const client = createClient()
      await client.from("user_data").upsert(
        { user_id: uid, data: data as any, updated_at: new Date().toISOString() },
        { onConflict: "user_id" }
      )
    } catch {}
  }, [])

  const scheduleSave = useCallback(() => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => {
      if (!loadedRef.current) return
      const data = collectData()
      saveToLocal(data)
      saveToSupabase(data)
    }, 2000)
  }, [saveToSupabase])

  useEffect(() => {
    const client = createClient()

    client.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        userIdRef.current = session.user.id
        client
          .from("user_data")
          .select("data")
          .eq("user_id", session.user.id)
          .single()
          .then(({ data, error }) => {
            if (data?.data) {
              const d = data.data as AppData
              if (d.tasks?.length) useTaskStore.setState({ tasks: d.tasks as any })
              if (d.habits?.length) useHabitStore.setState({ habits: d.habits as any })
              if (d.challenges?.length) useChallengeStore.setState({ challenges: d.challenges as any })
              if (d.dopamine?.length) useDopamineStore.setState({ entries: d.dopamine as any })
              if (d.skills?.length) useSkillStore.setState({ skills: d.skills as any })
              if (d.incomes?.length) useFinanceStore.setState({ incomes: d.incomes as any })
              if (d.expenses?.length) useFinanceStore.setState({ expenses: d.expenses as any })
              if (d.budgets?.length) useFinanceStore.setState({ budgets: d.budgets as any })
              if (d.sips?.length) useFinanceStore.setState({ sips: d.sips as any })
              if (d.stocks?.length) useFinanceStore.setState({ stocks: d.stocks as any })
              if (d.mutualFunds?.length) useFinanceStore.setState({ mutualFunds: d.mutualFunds as any })
              if (d.futureGoals?.length) useFutureStore.setState({ goals: d.futureGoals as any })
            } else if (error?.code === "PGRST116") {
            } else {
              loadFromLocal()
            }
            loadedRef.current = true
            setLoading(false)
          })
      } else {
        loadFromLocal()
        loadedRef.current = true
        setLoading(false)
      }
    })

    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    }
  }, [])

  useEffect(() => {
    const unsubs = [
      useTaskStore.subscribe(scheduleSave),
      useHabitStore.subscribe(scheduleSave),
      useChallengeStore.subscribe(scheduleSave),
      useDopamineStore.subscribe(scheduleSave),
      useSkillStore.subscribe(scheduleSave),
      useFinanceStore.subscribe(scheduleSave),
      useFutureStore.subscribe(scheduleSave),
    ]
    return () => unsubs.forEach((u) => u())
  }, [scheduleSave])

  return { loading }
}

export function clearLocalData() {
  localStorage.removeItem(STORAGE_KEY)
}
