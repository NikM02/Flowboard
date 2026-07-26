"use client"

import { useState, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Download, Trash2, Plus, Archive, ListTodo,
  LayoutGrid, List, FolderKanban,
} from "lucide-react"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { StatsCards } from "@/components/dashboard/stats-cards"
import { Filters } from "@/components/dashboard/filters"
import { TaskCardView } from "@/components/dashboard/task-card-view"
import { TaskListView } from "@/components/dashboard/task-list-view"
import { TaskCharts } from "@/components/dashboard/task-charts"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useTaskStore } from "@/store/use-task-store"
import { cn } from "@/lib/shadcn-utils"

type ViewMode = "active" | "archive"

export default function TasksPage() {
  const [view, setView] = useState<ViewMode>("active")
  const [taskViewMode, setTaskViewMode] = useState<"card" | "list">("card")
  const { setFilterStatus, clearCompleted, setIsCreateModalOpen, projectFilter, setProjectFilter, getProjects } = useTaskStore()
  const projects = getProjects()

  const handleViewChange = useCallback((v: ViewMode) => {
    setView(v)
    setFilterStatus(v === "archive" ? "completed" : "active")
  }, [setFilterStatus])

  return (
    <DashboardShell>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="space-y-6"
      >
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">
              {view === "active" ? "Tasks" : "Archive"}
            </h1>
            <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
              {view === "active" ? "Manage and track your tasks" : "Completed tasks"}
            </p>
          </div>
          {view === "active" && (
            <Button onClick={() => setIsCreateModalOpen(true)} className="gap-2 self-start rounded-xl">
              <Plus className="h-4 w-4" /> New Task
            </Button>
          )}
          {view === "archive" && (
            <div className="flex gap-2 self-start">
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  const completed = useTaskStore.getState().tasks.filter((t) => t.completed)
                  const XLSX = await import("xlsx")
                  const data = completed.map((t) => ({
                    Title: t.title,
                    Description: t.description,
                    Project: t.project,
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
                <Download className="h-3.5 w-3.5" /> Export
              </Button>
              <Button variant="outline" size="sm" onClick={clearCompleted} className="gap-2 text-red-500 hover:text-red-600">
                <Trash2 className="h-3.5 w-3.5" /> Clear
              </Button>
            </div>
          )}
        </div>

        {/* View tabs + controls */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-1 rounded-xl bg-neutral-100 p-1 dark:bg-neutral-800">
            {([
              { key: "active" as const, label: "Tasks", icon: ListTodo },
              { key: "archive" as const, label: "Archive", icon: Archive },
            ]).map((t) => (
              <button
                key={t.key}
                onClick={() => handleViewChange(t.key)}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-all",
                  view === t.key
                    ? "bg-white text-neutral-900 shadow-sm dark:bg-neutral-900 dark:text-neutral-50"
                    : "text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
                )}
              >
                <t.icon className="h-4 w-4" /> {t.label}
              </button>
            ))}
          </div>

          {view === "active" && (
            <div className="flex items-center gap-2">
              {projects.length > 0 && (
                <Select value={projectFilter} onValueChange={setProjectFilter}>
                  <SelectTrigger className="h-9 w-[140px] gap-1 border-neutral-200/60 bg-white text-xs dark:border-neutral-800/60 dark:bg-neutral-950 sm:w-[160px] sm:text-sm">
                    <FolderKanban className="h-3.5 w-3.5 text-neutral-500" />
                    <SelectValue placeholder="All Projects" />
                  </SelectTrigger>
                  <SelectContent align="end">
                    <SelectItem value="all">All Projects</SelectItem>
                    {projects.map((p) => (
                      <SelectItem key={p} value={p}>{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <div className="flex gap-1 rounded-lg bg-neutral-100 p-0.5 dark:bg-neutral-800">
                <button
                  onClick={() => setTaskViewMode("card")}
                  className={cn(
                    "rounded-md p-1.5 transition-all",
                    taskViewMode === "card"
                      ? "bg-white text-neutral-900 shadow-sm dark:bg-neutral-900 dark:text-neutral-50"
                      : "text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
                  )}
                >
                  <LayoutGrid className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setTaskViewMode("list")}
                  className={cn(
                    "rounded-md p-1.5 transition-all",
                    taskViewMode === "list"
                      ? "bg-white text-neutral-900 shadow-sm dark:bg-neutral-900 dark:text-neutral-50"
                      : "text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
                  )}
                >
                  <List className="h-4 w-4" />
                </button>
              </div>
              <Filters />
            </div>
          )}
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
            {view === "active" && (
              <div className="space-y-6">
                <StatsCards />
                <TaskCharts />
                {taskViewMode === "card" ? <TaskCardView /> : <TaskListView />}
              </div>
            )}
            {view === "archive" && <TaskListView archive />}
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </DashboardShell>
  )
}
