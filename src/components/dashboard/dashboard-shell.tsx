"use client"

import { useState, useEffect, useCallback } from "react"
import { Loader2, Bell, BellOff, BellRing } from "lucide-react"
import { Sidebar } from "@/components/dashboard/sidebar"
import { Header } from "@/components/dashboard/header"
import { BottomNav } from "@/components/dashboard/bottom-nav"
import { GlobalSearch } from "@/components/dashboard/global-search"
import { LoginScreen } from "@/components/dashboard/login-screen"
import { CreateTaskModal } from "@/components/dashboard/create-task-modal"
import { EditTaskSheet } from "@/components/dashboard/edit-task-sheet"
import { DeleteConfirmDialog } from "@/components/dashboard/delete-confirm-dialog"
import { CompleteTaskDialog } from "@/components/dashboard/complete-task-dialog"

import { useNotificationGenerator } from "@/hooks/use-notification-generator"
import { useIntegrationWatcher } from "@/hooks/use-integration-watcher"
import { usePushNotifications } from "@/hooks/use-push-notifications"
import { useSupabasePersistence } from "@/hooks/use-store-persistence"
import { useThemeStore } from "@/store/use-theme-store"
import { useEmailStore } from "@/store/use-email-store"
import { useCalendarStore } from "@/store/use-calendar-store"

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [authenticated, setAuthenticated] = useState(false)
  const [authChecked, setAuthChecked] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    if (typeof window === "undefined") return true
    try {
      const stored = localStorage.getItem("nexus-sidebar-collapsed")
      if (stored) return stored === "1"
    } catch {}
    return true
  })
  const { colorTheme } = useThemeStore()
  const { loading: dataLoading, hydrated } = useSupabasePersistence()

  useNotificationGenerator()
  useIntegrationWatcher(hydrated)
  const { permission, requestPermission } = usePushNotifications()

  useEffect(() => {
    if (!authenticated) return
    useEmailStore.getState().load()
    useCalendarStore.getState().load()
  }, [authenticated])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const { createClient } = await import("@/lib/supabase/client")
        const client = createClient()
        const { data } = await client.auth.getSession()
        if (!cancelled) setAuthenticated(!!data.session)
      } catch {
        if (!cancelled) setAuthenticated(false)
      }
      if (!cancelled) setAuthChecked(true)
    })()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    const root = document.documentElement
    root.classList.remove("dark")
    if (colorTheme === "dark") root.classList.add("dark")
  }, [colorTheme])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        setSearchOpen((v) => !v)
      }
    }
    document.addEventListener("keydown", handler)
    return () => document.removeEventListener("keydown", handler)
  }, [])

  const handleAuth = useCallback(() => {
    setAuthenticated(true)
  }, [])

  const handleLogout = useCallback(async () => {
    try {
      const { createClient } = await import("@/lib/supabase/client")
      const client = createClient()
      await client.auth.signOut()
    } catch {}
    setAuthenticated(false)
  }, [])

  const toggleSidebarCollapsed = useCallback(() => {
    setSidebarCollapsed((c) => {
      const next = !c
      try {
        localStorage.setItem("nexus-sidebar-collapsed", next ? "1" : "0")
      } catch {}
      return next
    })
  }, [])

  if (!authChecked) {
    return (
      <div className="fixed inset-0 z-[200] flex items-center justify-center bg-white dark:bg-neutral-950">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-neutral-400 dark:text-neutral-500" />
          <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Loading...</p>
        </div>
      </div>
    )
  }

  if (!authenticated) {
    return <LoginScreen onAuth={handleAuth} />
  }

  if (dataLoading) {
    return (
      <div className="fixed inset-0 z-[200] flex items-center justify-center bg-white dark:bg-neutral-950">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-neutral-400 dark:text-neutral-500" />
          <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Syncing data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen overflow-hidden bg-neutral-50 dark:bg-neutral-950">
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onLogout={handleLogout}
        collapsed={sidebarCollapsed}
        onToggleCollapse={toggleSidebarCollapsed}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <Header
          onSearchOpen={() => setSearchOpen(true)}
          onLogout={handleLogout}
          onMenuToggle={() => setSidebarOpen(true)}
          sidebarCollapsed={sidebarCollapsed}
        />

        <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>

      <BottomNav />

      {permission === "default" && (
        <button
          onClick={requestPermission}
          className="fixed bottom-20 right-4 z-30 flex items-center gap-2 rounded-[10px] border border-neutral-200 bg-white px-4 py-2.5 text-xs font-medium text-neutral-900 shadow-lg transition-all hover:bg-neutral-900 hover:text-white hover:border-neutral-900 dark:border-neutral-800 dark:bg-neutral-950 dark:text-white dark:hover:bg-white dark:hover:text-neutral-900 dark:hover:border-neutral-200 md:bottom-6 md:right-20"
        >
          <BellRing className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Enable Notifications</span>
        </button>
      )}

      {permission === "denied" && (
        <div className="fixed bottom-20 right-4 z-30 flex items-center gap-2 rounded-[10px] bg-neutral-100 px-4 py-2.5 text-xs font-medium text-neutral-500 shadow-lg dark:bg-neutral-800 dark:text-neutral-400 md:bottom-6 md:right-20">
          <BellOff className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Notifications blocked</span>
        </div>
      )}

      <CreateTaskModal />
      <EditTaskSheet />
      <DeleteConfirmDialog />
      <CompleteTaskDialog />

      <GlobalSearch
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
      />
    </div>
  )
}
