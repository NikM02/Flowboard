"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
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
import { ThemePicker } from "@/components/dashboard/theme-picker"

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
  const router = useRouter()
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

  // Check session on mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        const { createClient } = await import("@/lib/supabase/client")
        const client = createClient()
        const { data: { session } } = await client.auth.getSession()
        setAuthenticated(!!session)
      } catch {
        setAuthenticated(false)
      }
      setAuthChecked(true)
    }
    checkSession()
  }, [])

  // Apply theme class on mount
  useEffect(() => {
    const root = document.documentElement
    root.classList.remove("dark", "theme-ocean", "theme-aurora", "theme-sunset")
    if (colorTheme === "dark") root.classList.add("dark")
    else if (colorTheme === "ocean") { root.classList.add("dark", "theme-ocean") }
    else if (colorTheme === "aurora") { root.classList.add("theme-aurora") }
    else if (colorTheme === "sunset") { root.classList.add("dark", "theme-sunset") }
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

  return (
    <>
      {!authChecked && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-neutral-50 dark:bg-neutral-950">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
            <p className="text-sm text-neutral-500">Loading Nexus...</p>
          </div>
        </div>
      )}
      {authChecked && !authenticated && <LoginScreen onAuth={handleAuth} />}
      {authChecked && authenticated && dataLoading && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-neutral-50 dark:bg-neutral-950">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
            <p className="text-sm text-neutral-500">Loading your data...</p>
          </div>
        </div>
      )}
      {authChecked && authenticated && !dataLoading && (
        <div className="flex min-h-screen bg-neutral-50 dark:bg-neutral-950">
          <Sidebar
            open={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
            onLogout={handleLogout}
            collapsed={sidebarCollapsed}
            onToggleCollapse={toggleSidebarCollapsed}
          />

          <div className="flex min-w-0 flex-1 flex-col pb-16 md:pb-0">
            <Header onSearchOpen={() => setSearchOpen(true)} onLogout={handleLogout} />

            <main className="flex-1 space-y-6 p-4 lg:p-6 xl:p-8">
              {children}
            </main>
          </div>

          <BottomNav />

          {/* Theme picker - desktop */}
          <div className="fixed bottom-6 right-4 z-30 hidden md:block">
            <ThemePicker variant="desktop" />
          </div>

          {/* Notification permission button */}
          {permission === "default" && (
            <button
              onClick={requestPermission}
              className="fixed bottom-20 right-4 z-30 flex items-center gap-1.5 rounded-full bg-amber-500 px-3 py-2 text-xs font-medium text-white shadow-lg transition-all hover:bg-amber-600 hover:shadow-xl md:bottom-6 md:right-20"
            >
              <BellRing className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Enable Notifications</span>
            </button>
          )}

          {permission === "denied" && (
            <div className="fixed bottom-20 right-4 z-30 flex items-center gap-1.5 rounded-full bg-neutral-800 px-3 py-2 text-xs font-medium text-neutral-400 shadow-lg md:bottom-6 md:right-20">
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
      )}
    </>
  )
}
