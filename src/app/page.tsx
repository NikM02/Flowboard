"use client"

import { useState, useEffect, useCallback } from "react"
import { motion } from "framer-motion"
import { Moon, Sun, Download, Trash2, Plus, Archive, Loader2 } from "lucide-react"
import { Sidebar } from "@/components/dashboard/sidebar"
import { Header } from "@/components/dashboard/header"
import { BottomNav } from "@/components/dashboard/bottom-nav"
import { GlobalSearch } from "@/components/dashboard/global-search"
import { Confetti } from "@/components/dashboard/confetti"
import { Toaster } from "@/components/ui/toaster"
import { useToastWatcher } from "@/hooks/use-toast-watcher"
import { useNotificationGenerator } from "@/hooks/use-notification-generator"
import { useSupabasePersistence } from "@/hooks/use-store-persistence"
import { StatsCards } from "@/components/dashboard/stats-cards"
import { Filters } from "@/components/dashboard/filters"
import { TaskCardView } from "@/components/dashboard/task-card-view"
import { TaskListView } from "@/components/dashboard/task-list-view"
import { CreateTaskModal } from "@/components/dashboard/create-task-modal"
import { EditTaskSheet } from "@/components/dashboard/edit-task-sheet"
import { DeleteConfirmDialog } from "@/components/dashboard/delete-confirm-dialog"

import { LoginScreen } from "@/components/dashboard/login-screen"
import { Button } from "@/components/ui/button"
import { HabitTrackerSection } from "@/components/habits/habit-tracker-section"
import { SkillPanel } from "@/components/skills/skill-panel"
import { FinancePanel } from "@/components/finance/finance-panel"
import { FuturePanel } from "@/components/future/future-panel"

import { useTaskStore } from "@/store/use-task-store"
import { useThemeStore } from "@/store/use-theme-store"
import { useMediaQuery } from "@/hooks/use-media-query"
import type { DashboardSection } from "@/types"

export default function DashboardPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activeSection, setActiveSection] = useState<DashboardSection>("habits")
  const [searchOpen, setSearchOpen] = useState(false)
  const [confettiTrigger, setConfettiTrigger] = useState(0)
  const [authenticated, setAuthenticated] = useState(false)
  const [showTaskArchive, setShowTaskArchive] = useState(false)
  const { viewMode, setFilterStatus, clearCompleted, setIsCreateModalOpen } = useTaskStore()
  const { darkMode, toggleDarkMode } = useThemeStore()
  const isMobile = useMediaQuery("(max-width: 768px)")

  const handleSectionChange = useCallback((section: DashboardSection) => {
    setActiveSection(section)
    if (section === "tasks") {
      setFilterStatus("active")
      setShowTaskArchive(false)
    }
  }, [setFilterStatus])

  const handleShowArchive = useCallback(() => {
    setFilterStatus("completed")
    setShowTaskArchive(true)
  }, [setFilterStatus])

  const handleHideArchive = useCallback(() => {
    setFilterStatus("active")
    setShowTaskArchive(false)
  }, [setFilterStatus])

  const onAdd = useCallback(() => setConfettiTrigger((c) => c + 1), [])
  useToastWatcher(onAdd)
  useNotificationGenerator()
  const { loading: dataLoading } = useSupabasePersistence()

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

  return (
    <>
      {!authenticated && <LoginScreen onAuth={handleAuth} />}
      {authenticated && dataLoading && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-neutral-50 dark:bg-neutral-950">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
            <p className="text-sm text-neutral-500">Loading your data...</p>
          </div>
        </div>
      )}
      {authenticated && !dataLoading && (
    <div className="flex min-h-screen bg-neutral-50 dark:bg-neutral-950">
          <Sidebar
            open={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
            activeSection={activeSection}
            onSectionChange={handleSectionChange}
            onLogout={handleLogout}
          />

      <div className="flex flex-1 flex-col pb-16 md:pb-0">
        <Header onSearchOpen={() => setSearchOpen(true)} />

        <main className="flex-1 space-y-6 p-4 lg:p-6 xl:p-8">
          {activeSection === "tasks" && (
            <>
              {showTaskArchive ? (
                <>
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">
                        Task Archive
                      </h1>
                      <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                        Completed tasks archive
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={handleHideArchive} className="gap-2">
                        Back to Active
                      </Button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        const { useTaskStore } = await import("@/store/use-task-store")
                        const completed = useTaskStore.getState().tasks.filter((t) => t.completed)
                        const XLSX = await import("xlsx")
                        const data = completed.map((t) => ({
                          Title: t.title,
                          Description: t.description,
                          Priority: t.priority,
                          "Due Date": t.dueDate,
                          Progress: `${t.progress}%`,
                          Subtasks: t.subtasks.filter((s) => s.completed).length + "/" + t.subtasks.length,
                        }))
                        const wb = XLSX.utils.book_new()
                        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data), "Completed Tasks")
                        XLSX.writeFile(wb, "completed-tasks.xlsx")
                      }}
                      className="gap-2"
                    >
                      <Download className="h-3.5 w-3.5" />
                      Export
                    </Button>
                    <Button variant="outline" size="sm" onClick={clearCompleted} className="gap-2 text-red-500 hover:text-red-600">
                      <Trash2 className="h-3.5 w-3.5" />
                      Clear All
                    </Button>
                  </div>
                  <TaskListView archive />
                </>
              ) : (
                <>
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">
                        Active Tasks
                      </h1>
                      <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                        Manage and track your tasks
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button onClick={() => setIsCreateModalOpen(true)} className="gap-2">
                        <Plus className="h-4 w-4" />
                        Add Task
                      </Button>
                      <Button variant="outline" size="sm" onClick={handleShowArchive} className="gap-2">
                        <Archive className="h-4 w-4" />
                        Archive
                      </Button>
                      <Filters />
                    </div>
                  </div>
                  <StatsCards />
                  {viewMode === "card" ? <TaskCardView /> : <TaskListView />}
                </>
              )}
            </>
          )}

          {activeSection === "habits" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="mb-6">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">
                  Habits & Challenges
                </h1>
                <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                  Build habits and take on challenges
                </p>
              </div>
              <HabitTrackerSection />
            </motion.div>
          )}

          {activeSection === "skills" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <SkillPanel />
            </motion.div>
          )}

          {activeSection === "finance" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <FinancePanel />
            </motion.div>
          )}

          {activeSection === "future" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <FuturePanel />
            </motion.div>
          )}
        </main>
      </div>

      <BottomNav activeSection={activeSection} onSectionChange={handleSectionChange} />

      {/* Floating dark mode toggle */}
      <button
        onClick={toggleDarkMode}
        className="fixed bottom-20 right-4 z-30 flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-lg border border-neutral-200 text-neutral-600 transition-all hover:shadow-xl dark:bg-neutral-800 dark:border-neutral-700 dark:text-neutral-300 md:bottom-6"
      >
        {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      </button>

      <CreateTaskModal />
      <EditTaskSheet />
      <DeleteConfirmDialog />

      <GlobalSearch
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        onNavigate={handleSectionChange}
      />

      <Toaster />
      <Confetti trigger={confettiTrigger} />
    </div>
      )}
    </>
  )
}
