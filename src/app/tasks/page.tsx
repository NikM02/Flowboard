"use client"

import { useState, useCallback, Suspense, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import {
  Download, Trash2, Plus, Archive, ListTodo, BarChart3, ChevronDown,
} from "lucide-react"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { StatsCards } from "@/components/dashboard/stats-cards"
import { Filters } from "@/components/dashboard/filters"
import { TodayPanel } from "@/components/dashboard/today-panel"
import { TaskCheckList } from "@/components/dashboard/task-check-list"
import { TaskListView } from "@/components/dashboard/task-list-view"
import { TaskCharts } from "@/components/dashboard/task-charts"
import { Button } from "@/components/ui/button"
import { useTaskStore } from "@/store/use-task-store"
import { usePageTitleStore } from "@/store/use-page-title-store"
import { cn } from "@/lib/shadcn-utils"

type ViewMode = "tasks" | "archive"

export default function TasksPage() {
  return (
    <Suspense fallback={null}>
      <TasksPageContent />
    </Suspense>
  )
}

function TasksPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const viewParam = searchParams.get("view")
  const view: ViewMode = viewParam === "archive" ? "archive" : "tasks"
  const [analyticsOpen, setAnalyticsOpen] = useState(true)
  const { setFilterStatus, clearCompleted, openCreateModal } = useTaskStore()

  const handleViewChange = useCallback((v: ViewMode) => {
    router.replace(v === "tasks" ? "/tasks" : `/tasks?view=${v}`, { scroll: false })
    if (v === "archive") setFilterStatus("completed")
    else setFilterStatus("active")
  }, [router, setFilterStatus])

  const { setPageTitle } = usePageTitleStore()
  useEffect(() => {
    setPageTitle(view === "archive" ? "Archive" : "Tasks")
    return () => setPageTitle(null)
  }, [view, setPageTitle])

  return (
    <DashboardShell>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="space-y-6"
      >
        {/* Toolbar */}
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          {/* View tabs */}
          <div className="flex w-full gap-1 overflow-x-auto rounded-[10px] border border-neutral-200 bg-neutral-100 p-1 lg:w-auto">
            {([
              { key: "tasks" as const, label: "Tasks", icon: ListTodo },
              { key: "archive" as const, label: "Archive", icon: Archive },
            ]).map((t) => (
              <button
                key={t.key}
                onClick={() => handleViewChange(t.key)}
                className={cn(
                  "flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-[10px] px-3 py-2 text-sm font-medium transition-all lg:flex-none",
                  view === t.key
                    ? "bg-white text-neutral-900 shadow-sm "
                    : "text-neutral-500 hover:text-neutral-800 "
                )}
              >
                <t.icon className="h-4 w-4" /> {t.label}
              </button>
            ))}
          </div>

          {/* Controls */}
          <div className="flex flex-wrap items-center justify-end gap-2">
            {view === "tasks" && (
              <>
                <Filters />
                <Button onClick={() => openCreateModal()} className="gap-2 sm:ml-0 ml-auto">
                  <Plus className="h-4 w-4" /> New Task
                </Button>
              </>
            )}

            {view === "archive" && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
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
                  className="ml-auto gap-2 sm:ml-0"
                >
                  <Download className="h-4 w-4" /> Export
                </Button>
                <Button variant="outline" size="sm" onClick={clearCompleted} className="gap-2 text-red-500 hover:text-red-600">
                  <Trash2 className="h-4 w-4" /> Clear
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={view}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            {view === "tasks" && (
              <div className="space-y-5">
                {/* Today — daily 3 urgent / 2 focus / 3 easy planner */}
                <TodayPanel />

                {/* Tasks — checkbox tree, subtasks nested under each task */}
                <TaskCheckList />

                {/* Analytics — colored charts, responsive on mobile */}
                <div className="overflow-hidden rounded-[10px] border border-neutral-200 bg-white">
                  <button
                    onClick={() => setAnalyticsOpen((v) => !v)}
                    className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left"
                  >
                    <span className="flex items-center gap-2.5">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-blue-50">
                        <BarChart3 className="h-4 w-4 text-blue-600" />
                      </span>
                      <span className="text-sm font-bold tracking-tight text-neutral-900">
                        Analytics &amp; Insights
                      </span>
                    </span>
                    <ChevronDown
                      className={cn("h-4 w-4 text-neutral-400 transition-transform duration-200", analyticsOpen && "rotate-180")}
                    />
                  </button>
                  <AnimatePresence>
                    {analyticsOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="overflow-hidden"
                      >
                        <div className="space-y-6 border-t border-neutral-100 p-4 ">
                          <StatsCards />
                          <TaskCharts />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            )}

            {view === "archive" && <TaskListView archive />}
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </DashboardShell>
  )
}
