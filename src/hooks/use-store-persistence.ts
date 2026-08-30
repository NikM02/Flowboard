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
import { useContentStore } from "@/store/use-content-store"
import { useNorthStarStore } from "@/store/use-north-star-store"
import { useBucketListStore } from "@/store/use-bucket-list-store"
import { useAdvanceTodoStore } from "@/store/use-advance-todo-store"
import { useSleepStore } from "@/store/use-sleep-store"
import { useThemeStore, type ColorTheme } from "@/store/use-theme-store"
import { useNotificationStore } from "@/store/use-notification-store"

const STORAGE_KEY = "flowboard-data-v2"
const META_KEY = "flowboard-meta-v2"
// Old un-versioned keys — purged on boot so stale local backups can never
// resurrect deleted data on this or another device.
const LEGACY_KEYS = ["flowboard-data", "flowboard-meta"]

type AppData = {
  tasks: unknown[]
  projects: string[]
  sleepEntries: unknown[]
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
  contentItems: unknown[]
  northStar: { vision: string; mission: string; identity: string; pillars: unknown[] }
  bucketListItems: unknown[]
  advanceTodos: unknown[]
  notifications: unknown[]
  colorTheme: ColorTheme
}

type LocalMeta = {
  savedAt: number
  userId: string | null
}

function collectData(): AppData {
  return {
    tasks: useTaskStore.getState().tasks,
    projects: useTaskStore.getState().projects,
    sleepEntries: useSleepStore.getState().entries,
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
    contentItems: useContentStore.getState().items,
    northStar: {
      vision: useNorthStarStore.getState().vision,
      mission: useNorthStarStore.getState().mission,
      identity: useNorthStarStore.getState().identity,
      pillars: useNorthStarStore.getState().pillars,
    },
    bucketListItems: useBucketListStore.getState().items,
    advanceTodos: useAdvanceTodoStore.getState().todos,
    notifications: useNotificationStore.getState().notifications,
    colorTheme: useThemeStore.getState().colorTheme,
  }
}

function saveToLocal(data: AppData, userId: string | null) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    const meta: LocalMeta = { savedAt: Date.now(), userId }
    localStorage.setItem(META_KEY, JSON.stringify(meta))
  } catch {}
}

function readLocalMeta(): LocalMeta | null {
  try {
    const raw = localStorage.getItem(META_KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

function loadFromLocal() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return
    const data: AppData = JSON.parse(raw)
    applyData(data)
  } catch {}
}

function applyData(d: AppData) {
  if (d.tasks?.length) useTaskStore.setState({ tasks: d.tasks as any })
  if (d.projects?.length) useTaskStore.setState({ projects: d.projects as any })
  if (d.sleepEntries?.length) useSleepStore.setState({ entries: d.sleepEntries as any })
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
  if (d.contentItems?.length) useContentStore.setState({ items: d.contentItems as any })
  if (d.northStar) {
    const ns = d.northStar
    const cur = useNorthStarStore.getState()
    // Merge strings preferring non-empty values so a stale/empty write can
    // never wipe real content (e.g. a hydration re-save writing "").
    const pick = (curVal: string, incVal: string | undefined) =>
      incVal === undefined ? curVal : incVal || curVal
    useNorthStarStore.setState({
      vision: pick(cur.vision, ns.vision),
      mission: pick(cur.mission, ns.mission),
      identity: pick(cur.identity, ns.identity),
    })
    if (ns.pillars?.length) useNorthStarStore.setState({ pillars: ns.pillars as any })
  }
  if (d.bucketListItems?.length) useBucketListStore.setState({ items: d.bucketListItems as any })
  if (d.advanceTodos?.length) useAdvanceTodoStore.setState({ todos: d.advanceTodos as any })
  if (d.notifications?.length) {
    useNotificationStore.setState({ notifications: d.notifications as any })
    const unreadCount = (d.notifications as any[]).filter((n) => !n.read).length
    useNotificationStore.setState({ unreadCount })
  }
}

// Applies cloud data EXACTLY — including empty collections. Used when
// Supabase is the newer source so deletes made on one device propagate
// to every other device (the merge version above would skip empties).
function applyDataReplace(d: AppData) {
  useTaskStore.setState({ tasks: (d.tasks ?? []) as any })
  useTaskStore.setState({ projects: (d.projects ?? []) as any })
  useSleepStore.setState({ entries: (d.sleepEntries ?? []) as any })
  useHabitStore.setState({ habits: (d.habits ?? []) as any })
  useChallengeStore.setState({ challenges: (d.challenges ?? []) as any })
  useDopamineStore.setState({ entries: (d.dopamine ?? []) as any })
  useSkillStore.setState({ skills: (d.skills ?? []) as any })
  useFinanceStore.setState({
    incomes: (d.incomes ?? []) as any,
    expenses: (d.expenses ?? []) as any,
    budgets: (d.budgets ?? []) as any,
    sips: (d.sips ?? []) as any,
    stocks: (d.stocks ?? []) as any,
    mutualFunds: (d.mutualFunds ?? []) as any,
  })
  useFutureStore.setState({ goals: (d.futureGoals ?? []) as any })
  useContentStore.setState({ items: (d.contentItems ?? []) as any })
  const ns = d.northStar
  useNorthStarStore.setState({
    vision: ns?.vision ?? "",
    mission: ns?.mission ?? "",
    identity: ns?.identity ?? "",
    pillars: (ns?.pillars ?? []) as any,
  })
  useBucketListStore.setState({ items: (d.bucketListItems ?? []) as any })
  useAdvanceTodoStore.setState({ todos: (d.advanceTodos ?? []) as any })
  useNotificationStore.setState({
    notifications: (d.notifications ?? []) as any,
    unreadCount: (d.notifications ?? []).filter((n: any) => !n.read).length,
  })
  if (d.colorTheme) useThemeStore.setState({ colorTheme: d.colorTheme })
}

export function useSupabasePersistence() {
  const [loading, setLoading] = useState(true)
  const [hydrated, setHydrated] = useState(false)
  const loadedRef = useRef(false)
  const dirtyRef = useRef(false)
  const hydratedRef = useRef(false)
  const userIdRef = useRef<string | null>(null)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const saveToSupabase = useCallback(async (data: AppData) => {
    const uid = userIdRef.current
    if (!uid) return
    try {
      const client = createClient()
      // Read-modify-write so any server-managed keys living alongside our
      // collections (legacy "integrations", etc.) survive the upload.
      const { data: row } = await client
        .from("user_data")
        .select("data")
        .eq("user_id", uid)
        .single()
      const prev = (row?.data as Record<string, unknown> | undefined) ?? {}
      const owned = new Set(Object.keys(data))
      const foreign: Record<string, unknown> = {}
      for (const k of Object.keys(prev)) {
        if (!owned.has(k)) foreign[k] = prev[k]
      }
      await client.from("user_data").upsert(
        { user_id: uid, data: { ...foreign, ...data } as any, updated_at: new Date().toISOString() },
        { onConflict: "user_id" }
      )
    } catch {}
  }, [])

  const flushSave = useCallback(() => {
    if (!loadedRef.current || !dirtyRef.current) return
    dirtyRef.current = false
    const data = collectData()
    saveToLocal(data, userIdRef.current)
    saveToSupabase(data)
  }, [saveToSupabase])

  const scheduleSave = useCallback(() => {
    if (!loadedRef.current) return
    dirtyRef.current = true
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(flushSave, 2000)
  }, [flushSave])

  // Flush pending changes immediately when the tab is being hidden or closed
  useEffect(() => {
    const flush = () => {
      if (!loadedRef.current || !dirtyRef.current) return
      const data = collectData()
      saveToLocal(data, userIdRef.current)
      saveToSupabase(data)
    }
    const onVisibility = () => {
      if (document.visibilityState === "hidden") flush()
    }
    window.addEventListener("pagehide", flush)
    window.addEventListener("beforeunload", flush)
    document.addEventListener("visibilitychange", onVisibility)
    return () => {
      window.removeEventListener("pagehide", flush)
      window.removeEventListener("beforeunload", flush)
      document.removeEventListener("visibilitychange", onVisibility)
    }
  }, [saveToSupabase])

  useEffect(() => {
    const client = createClient()

    client.auth.getSession().then(({ data: { session } }) => {
      if (hydratedRef.current) return

      // Remove old un-versioned local backups so stale data can never
      // re-enter the stores (or be pushed back up to Supabase).
      try {
        LEGACY_KEYS.forEach((k) => localStorage.removeItem(k))
      } catch {}

      if (session?.user) {
        userIdRef.current = session.user.id
        client
          .from("user_data")
          .select("data, updated_at")
          .eq("user_id", session.user.id)
          .single()
          .then(({ data, error }) => {
            if (hydratedRef.current) return
            hydratedRef.current = true

            const localMeta = readLocalMeta()
            const supabaseTs = data?.updated_at
              ? new Date(data.updated_at).getTime()
              : -1
            const localBelongs =
              !localMeta?.userId || localMeta.userId === session.user.id
            const localUsable = !!localMeta && localBelongs
            const localIsNewer =
              localUsable && localMeta.savedAt > supabaseTs + 5000

            if (localUsable && localIsNewer) {
              // Local backup is the newest copy — restore it. The next
              // change will push it back up to Supabase.
              loadFromLocal()
            } else if (data?.data) {
              // Cloud is the source of truth — apply exactly, including
              // empty collections, so deletions made on any device show
              // up everywhere.
              applyDataReplace(data.data as AppData)
            } else if (localBelongs) {
              // No cloud row yet — fall back to this device's backup.
              loadFromLocal()
            }

            loadedRef.current = true
            dirtyRef.current = false
            setLoading(false)
            setHydrated(true)
          })
      } else {
        hydratedRef.current = true
        loadFromLocal()
        loadedRef.current = true
        setLoading(false)
        setHydrated(true)
      }
    })

    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    }
  }, [])

  useEffect(() => {
    const unsubs = [
      useTaskStore.subscribe(scheduleSave),
      useSleepStore.subscribe(scheduleSave),
      useHabitStore.subscribe(scheduleSave),
      useChallengeStore.subscribe(scheduleSave),
      useDopamineStore.subscribe(scheduleSave),
      useSkillStore.subscribe(scheduleSave),
      useFinanceStore.subscribe(scheduleSave),
      useFutureStore.subscribe(scheduleSave),
      useContentStore.subscribe(scheduleSave),
      useNorthStarStore.subscribe(scheduleSave),
      useBucketListStore.subscribe(scheduleSave),
      useAdvanceTodoStore.subscribe(scheduleSave),
      useThemeStore.subscribe(scheduleSave),
      useNotificationStore.subscribe(scheduleSave),
    ]
    return () => unsubs.forEach((u) => u())
  }, [scheduleSave])

  return { loading, hydrated }
}

export function clearLocalData() {
  localStorage.removeItem(STORAGE_KEY)
  localStorage.removeItem(META_KEY)
}
