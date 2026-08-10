"use client"

import { useState, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Download, Trash2, Plus, Archive, ListTodo, LayoutGrid, List,
  FolderKanban, BarChart3, ChevronDown, X, FolderPlus,
} from "lucide-react"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { StatsCards } from "@/components/dashboard/stats-cards"
import { Filters } from "@/components/dashboard/filters"
import { TaskCardView } from "@/components/dashboard/task-card-view"
import { TaskListView } from "@/components/dashboard/task-list-view"
import { TaskCharts } from "@/components/dashboard/task-charts"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { useTaskStore } from "@/store/use-task-store"
import { cn } from "@/lib/shadcn-utils"
import type { Task } from "@/types"

type ViewMode = "tasks" | "projects" | "archive"

const PROJECT_COLORS = [
  "from-indigo-500 to-violet-500",
  "from-blue-500 to-cyan-500",
  "from-emerald-500 to-teal-500",
  "from-amber-500 to-orange-500",
  "from-rose-500 to-pink-500",
  "from-fuchsia-500 to-purple-500",
]

function NewProjectDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { addProject } = useTaskStore()
  const [name, setName] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    addProject(name)
    setName("")
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <FolderPlus className="h-5 w-5 text-indigo-500" />
            New Project
          </DialogTitle>
          <DialogDescription>Create a project to organize related tasks.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="project-name">Project name</Label>
            <Input
              id="project-name"
              placeholder="e.g. Website Redesign"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              required
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={!name.trim()}>Create</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function ProjectsPanel({ onOpenProject }: { onOpenProject: () => void }) {
  const { tasks, projects, getProjectStats, setProjectFilter, deleteProject } = useTaskStore()
  const [newOpen, setNewOpen] = useState(false)

  const stats = getProjectStats()
  const created = new Set(projects)
  const uncategorizedTasks = tasks.filter((t) => !t.project.trim())
  const projectNames = [
    ...Object.keys(stats),
    ...projects.filter((p) => !stats[p]),
  ]

  const openProject = (name: string) => {
    setProjectFilter(name === "Uncategorized" ? "" : name)
    onOpenProject()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          {projectNames.length} {projectNames.length === 1 ? "project" : "projects"} · tasks grouped by project
        </p>
        <Button onClick={() => setNewOpen(true)} className="gap-2 rounded-xl">
          <Plus className="h-4 w-4" /> New Project
        </Button>
      </div>

      {projectNames.length === 0 && uncategorizedTasks.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-neutral-300 py-12 text-neutral-400 dark:border-neutral-700">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/10">
            <FolderKanban className="h-6 w-6 text-indigo-500" />
          </div>
          <p className="text-sm">No projects yet.</p>
          <Button variant="outline" onClick={() => setNewOpen(true)}>Create your first project</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {projectNames.map((name, i) => {
            const s = stats[name] ?? { total: 0, completed: 0, active: 0, avgProgress: 0 }
            const progress = s.avgProgress
            const pct = s.total > 0 ? Math.round((s.completed / s.total) * 100) : 0
            const preview = tasks
              .filter((t) => (t.project.trim() || "Uncategorized") === name)
              .slice(0, 3)
            const color = PROJECT_COLORS[i % PROJECT_COLORS.length]
            const isCreated = created.has(name)

            return (
              <motion.div
                key={name}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="card-modern card-hover group relative cursor-pointer rounded-2xl border border-neutral-200 bg-white p-4 text-left dark:border-neutral-800 dark:bg-neutral-900"
                onClick={() => openProject(name)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-sm", color)}>
                      <FolderKanban className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold tracking-tight text-neutral-900 dark:text-neutral-50">{name}</h3>
                      <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                        {s.total} tasks · {pct}% done
                      </p>
                    </div>
                  </div>
                  {isCreated && (
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteProject(name) }}
                      className="rounded-lg p-1.5 text-neutral-300 opacity-0 transition-all hover:bg-red-50 hover:text-red-500 group-hover:opacity-100 dark:text-neutral-600 dark:hover:bg-red-950/40"
                      title="Delete project"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
                  <div className={cn("h-full rounded-full bg-gradient-to-r transition-all", color)} style={{ width: `${progress}%` }} />
                </div>

                {preview.length > 0 && (
                  <div className="mt-3 space-y-1">
                    {preview.map((t: Task) => (
                      <div key={t.id} className="flex items-center gap-1.5 text-[11px] text-neutral-500 dark:text-neutral-400">
                        <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", t.completed ? "bg-emerald-500" : "bg-amber-400")} />
                        <span className="truncate">{t.title}</span>
                      </div>
                    ))}
                    {s.total > 3 && <p className="pl-3 text-[10px] text-neutral-400">+{s.total - 3} more</p>}
                  </div>
                )}

                <div className="mt-3 flex items-center gap-2 border-t border-neutral-100 pt-2.5 text-[10px] font-medium text-neutral-400 dark:border-neutral-800">
                  <span className="flex items-center gap-1 text-emerald-500"><CheckDot /> {s.completed} done</span>
                  <span className="flex items-center gap-1 text-amber-500"><Dot /> {s.active} active</span>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      <NewProjectDialog open={newOpen} onOpenChange={setNewOpen} />
    </div>
  )
}

function CheckDot() {
  return <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
}

function Dot() {
  return <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-400" />
}

export default function TasksPage() {
  const [view, setView] = useState<ViewMode>("tasks")
  const [taskViewMode, setTaskViewMode] = useState<"card" | "list">("card")
  const [analyticsOpen, setAnalyticsOpen] = useState(false)
  const { setFilterStatus, clearCompleted, setIsCreateModalOpen, projectFilter, setProjectFilter, getProjects } = useTaskStore()
  const projects = getProjects()

  const handleViewChange = useCallback((v: ViewMode) => {
    setView(v)
    if (v === "archive") setFilterStatus("completed")
    else if (v === "tasks") setFilterStatus("active")
  }, [setFilterStatus])

  const titles: Record<ViewMode, { title: string; sub: string }> = {
    tasks: { title: "Projects & Tasks", sub: "Manage and track your tasks" },
    projects: { title: "Projects", sub: "Organize tasks into projects" },
    archive: { title: "Archive", sub: "Completed tasks" },
  }

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
              {titles[view].title}
            </h1>
            <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
              {titles[view].sub}
            </p>
          </div>
          {view === "tasks" && (
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

        {/* View tabs */}
        <div className="flex gap-1 rounded-xl bg-neutral-100 p-1 dark:bg-neutral-800">
          {([
            { key: "tasks" as const, label: "Tasks", icon: ListTodo },
            { key: "projects" as const, label: "Projects", icon: FolderKanban },
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

        {/* Tasks controls */}
        {view === "tasks" && (
          <div className="flex flex-wrap items-center gap-2">
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
              <div className="space-y-6">
                {/* Tasks first — the focus of the page */}
                {taskViewMode === "card" ? <TaskCardView /> : <TaskListView />}

                {/* Analytics — collapsed by default so tasks stay front and center */}
                <div className="card-modern overflow-hidden rounded-2xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
                  <button
                    onClick={() => setAnalyticsOpen((v) => !v)}
                    className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left"
                  >
                    <span className="flex items-center gap-2.5">
                      <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-500/10">
                        <BarChart3 className="h-4 w-4 text-indigo-500" />
                      </span>
                      <span>
                        <span className="block text-sm font-bold tracking-tight text-neutral-900 dark:text-neutral-50">
                          Analytics & Insights
                        </span>
                        <span className="block text-[11px] text-neutral-500 dark:text-neutral-400">
                          {analyticsOpen ? "Hide stats and charts" : "View task statistics and charts"}
                        </span>
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
                        <div className="space-y-6 border-t border-neutral-100 p-4 dark:border-neutral-800">
                          <StatsCards />
                          <TaskCharts />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            )}

            {view === "projects" && (
              <ProjectsPanel onOpenProject={() => handleViewChange("tasks")} />
            )}

            {view === "archive" && <TaskListView archive />}
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </DashboardShell>
  )
}
