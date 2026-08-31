"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Loader2, Bell, BellOff, BellRing, Download, WifiOff } from "lucide-react"
import { Sidebar } from "@/components/dashboard/sidebar"
import { Header } from "@/components/dashboard/header"
import { BottomNav } from "@/components/dashboard/bottom-nav"
import { GlobalSearch } from "@/components/dashboard/global-search"
import { LoginScreen } from "@/components/dashboard/login-screen"
import { CreateTaskModal } from "@/components/dashboard/create-task-modal"
import { EditTaskSheet } from "@/components/dashboard/edit-task-sheet"
import { DeleteConfirmDialog } from "@/components/dashboard/delete-confirm-dialog"
import { CompleteTaskDialog } from "@/components/dashboard/complete-task-dialog"
import { PwaInstallSheet } from "@/components/dashboard/pwa-install-sheet"

import { useNotificationGenerator } from "@/hooks/use-notification-generator"
import { useReminderScheduler } from "@/hooks/use-reminder-scheduler"
import { usePushNotifications } from "@/hooks/use-push-notifications"
import { usePwaPush } from "@/hooks/use-pwa-push"
import { useSupabasePersistence } from "@/hooks/use-store-persistence"
import { setStoredUserId } from "@/lib/push-client"
import { useThemeStore } from "@/store/use-theme-store"

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
  const { loading: dataLoading } = useSupabasePersistence()

  useNotificationGenerator()
  useReminderScheduler()
  const { permission } = usePushNotifications()
  const { supported: pwaSupported, subscribed: pushSubscribed, enable: enablePush } = usePwaPush()

  // PWA install / alert state.
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isIOS, setIsIOS] = useState(false)
  const [installed, setInstalled] = useState(false)
  const [showInstallSheet, setShowInstallSheet] = useState(false)
  const [offline, setOffline] = useState(false)
  const autoEnabled = useRef(false)

  const isStandalone = useCallback(() => {
    if (typeof window === "undefined") return false
    return (
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true
    )
  }, [])

  useEffect(() => {
    if (/iphone|ipad|ipod/i.test(navigator.userAgent) && !("standalone" in navigator)) {
      setIsIOS(true)
    }
    if (isStandalone()) setInstalled(true)
    const onPrompt = (e: Event) => {
      e.preventDefault()
      setInstallPrompt(e as BeforeInstallPromptEvent)
    }
    const onInstalled = () => {
      setInstalled(true)
      setInstallPrompt(null)
    }
    const onDisplayMode = (e: MediaQueryListEvent) => {
      if (e.matches) setInstalled(true)
    }
    const offlineHandler = () => setOffline(true)
    const onlineHandler = () => setOffline(false)
    window.addEventListener("beforeinstallprompt", onPrompt)
    window.addEventListener("appinstalled", onInstalled)
    window.addEventListener("online", onlineHandler)
    window.addEventListener("offline", offlineHandler)
    const mql = window.matchMedia("(display-mode: standalone)")
    if (mql.addEventListener) mql.addEventListener("change", onDisplayMode)
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt)
      window.removeEventListener("appinstalled", onInstalled)
      window.removeEventListener("online", onlineHandler)
      window.removeEventListener("offline", offlineHandler)
      if (mql.removeEventListener) mql.removeEventListener("change", onDisplayMode)
    }
  }, [isStandalone])

  const handlePromptInstall = useCallback(async () => {
    if (installPrompt) {
      installPrompt.prompt()
      const choice = await installPrompt.userChoice
      setInstallPrompt(null)
      if (choice.outcome === "accepted") setInstalled(true)
    } else {
      setShowInstallSheet(true)
    }
  }, [installPrompt])

  // Once installed, auto-enable alerts (first time only).
  useEffect(() => {
    if (installed && !autoEnabled.current && permission === "granted" && !pushSubscribed) {
      autoEnabled.current = true
      void enablePush()
    }
  }, [installed, permission, pushSubscribed, enablePush])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const { createClient } = await import("@/lib/supabase/client")
        const client = createClient()
        const { data } = await client.auth.getSession()
        if (!cancelled) {
          setAuthenticated(!!data.session)
          if (data.session?.user?.id) setStoredUserId(data.session.user.id)
          else setStoredUserId(null)
        }
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

  // A notification action button (e.g. "✓ Done") mutates data server-side; the
  // service worker broadcasts this when the app is open so the UI stays in sync.
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return
    const onMessage = (event: MessageEvent) => {
      if (event.data?.type === "vault-refresh") window.location.reload()
    }
    navigator.serviceWorker.addEventListener("message", onMessage)
    return () => navigator.serviceWorker.removeEventListener("message", onMessage)
  }, [])

  const handleAuth = useCallback(() => {
    setAuthenticated(true)
    ;(async () => {
      try {
        const { createClient } = await import("@/lib/supabase/client")
        const client = createClient()
        const { data } = await client.auth.getSession()
        setStoredUserId(data.session?.user?.id ?? null)
      } catch {}
    })()
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

        <main className="flex-1 overflow-y-auto pb-[calc(env(safe-area-inset-bottom)+5rem)] md:pb-0">
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>

      <BottomNav />

      {offline && (
        <div className="fixed inset-x-0 top-16 z-30 flex items-center justify-center md:top-0">
          <div className="flex items-center gap-2 rounded-full bg-neutral-900 px-4 py-2 text-xs font-medium text-white shadow-xl dark:bg-white dark:text-neutral-900">
            <WifiOff className="h-3.5 w-3.5" />
            Offline — showing saved copy
          </div>
        </div>
      )}

      {permission === "default" && (
        <button
          onClick={() => void enablePush()}
          className="fixed bottom-20 right-4 z-30 flex items-center gap-2 rounded-[10px] border border-neutral-200 bg-white px-4 py-2.5 text-xs font-medium text-neutral-900 shadow-lg transition-all hover:bg-neutral-900 hover:text-white hover:border-neutral-900 dark:border-neutral-800 dark:bg-neutral-950 dark:text-white dark:hover:bg-white dark:hover:text-neutral-900 dark:hover:border-neutral-200 md:bottom-6 md:right-20"
        >
          <BellRing className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Enable Notifications</span>
        </button>
      )}

      {permission === "granted" && pwaSupported && !pushSubscribed && !installed && (
        <button
          onClick={() => void handlePromptInstall()}
          className="fixed bottom-20 right-4 z-30 flex items-center gap-2 rounded-[10px] border border-neutral-200 bg-white px-4 py-2.5 text-xs font-medium text-neutral-900 shadow-lg transition-all hover:bg-neutral-900 hover:text-white hover:border-neutral-900 dark:border-neutral-800 dark:bg-neutral-950 dark:text-white dark:hover:bg-white dark:hover:text-neutral-900 dark:hover:border-neutral-200 md:bottom-6 md:right-20"
        >
          <Download className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">{isIOS ? "Install for Alerts" : "Get Alerts"}</span>
        </button>
      )}

      {permission === "granted" && pwaSupported && !pushSubscribed && installed && (
        <button
          onClick={() => void enablePush()}
          className="fixed bottom-20 right-4 z-30 flex items-center gap-2 rounded-[10px] border border-neutral-200 bg-white px-4 py-2.5 text-xs font-medium text-neutral-900 shadow-lg transition-all hover:bg-neutral-900 hover:text-white hover:border-neutral-900 dark:border-neutral-800 dark:bg-neutral-950 dark:text-white dark:hover:bg-white dark:hover:text-neutral-900 dark:hover:border-neutral-200 md:bottom-6 md:right-20"
        >
          <BellRing className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Turn on Alerts</span>
        </button>
      )}

      {permission === "denied" && (
        <div className="fixed bottom-20 right-4 z-30 flex items-center gap-2 rounded-[10px] bg-neutral-100 px-4 py-2.5 text-xs font-medium text-neutral-500 shadow-lg dark:bg-neutral-800 dark:text-neutral-400 md:bottom-6 md:right-20">
          <BellOff className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Notifications blocked</span>
        </div>
      )}

      <PwaInstallSheet
        open={showInstallSheet}
        onClose={() => setShowInstallSheet(false)}
        isIOS={isIOS}
        canPrompt={!!installPrompt}
        onPrompt={() => void handlePromptInstall()}
        onEnablePush={() => void enablePush()}
      />

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
