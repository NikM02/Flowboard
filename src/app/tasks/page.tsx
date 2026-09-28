"use client"

import { useState, useCallback, Suspense, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import {
  Download, Trash2, Plus, Archive, ListTodo,
  FolderKanban, BarChart3, ChevronDown, FolderPlus, ListTree,
} from "lucide-react"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { StatsCards } from "@/components/dashboard/stats-cards"
import { Filters } from "@/components/dashboard/filters"
import { TodayPanel } from "@/components/dashboard/today-panel"
import { TaskCheckList } from "@/components/dashboard/task-check-list"
import { TaskListView } from "@/components/dashboard/task-list-view"
import { TaskTreeView } from "@/components/dashboard/task-tree-view"
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
import { usePageTitleStore } from "@/store/use-page-title-store"
import { cn } from "@/lib/shadcn-utils"
import { PROJECT_ICONS, defaultProjectColor } from "@/lib/project-icons"
import type { Task, Priority } from "@/types"

type ViewMode = "tasks" | "tree" | "projects" | "archive"

const PROJECT_COLORS = [
  "bg-blue-500",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-violet-500",
  "bg-teal-500",
  "bg-pink-500",
  "bg-indigo-500",
  "bg-orange-500",
]

/* ── Today panel — daily 3 / 2 / 3 planner ────────────── */

function NewProjectDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { addProject } = useTaskStore()
  const [name, setName] = useState("")
  const [icon, setIcon] = useState<string>(PROJECT_ICONS[0])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    addProject(name, icon)
    setName("")
    setIcon(PROJECT_ICONS[0])
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
          <div className="space-y-2">
            <Label>Project icon</Label>
            <div className="flex flex-wrap gap-1.5">
              {PROJECT_ICONS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setIcon(emoji)}
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-xl text-lg transition-all",
                    icon === emoji
                      ? "bg-neutral-900 text-white ring-2 ring-neutral-900 ring-offset-2 dark:bg-white dark:text-neutral-900 dark:ring-white"
                      : "bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700"
                  )}
                >
                  {emoji}
                </button>
              ))}
            </div>
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
  const { tasks, projects, getProjectStats, setProjectFilter, deleteProject, getProjectIcon, setProjectIcon } = useTaskStore()
  const [newOpen, setNewOpen] = useState(false)
  const [iconEdit, setIconEdit] = useState<string | null>(null)

  const stats = getProjectStats()
  const created = new Set(projects)
  const uncategorizedTasks = tasks.filter((t) => !t.project.trim())
  const projectNames = [
    ...Object.keys(stats),
    ...projects.filter((p) => !stats[p]),
  ]

  const openProject = (name: string) => {
    setProjectFilter(name)
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
          <div className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-neutral-100 dark:bg-neutral-800">
            <FolderKanban className="h-4 w-4 text-indigo-500" />
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
            const points = tasks
              .filter((t) => (t.project.trim() || "Uncategorized") === name)
              .reduce((sum, t) => sum + (t.storyPoints ?? 0), 0)
            const gradient = PROJECT_COLORS[i % PROJECT_COLORS.length]
            const tileColor = defaultProjectColor(name)
            const icon = getProjectIcon(name)
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
                    <button
                      onClick={(e) => { e.stopPropagation(); setIconEdit(iconEdit === name ? null : name) }}
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] text-lg transition-transform hover:scale-105"
                      style={{ backgroundColor: `${tileColor}1a` }}
                      title="Change project icon"
                    >
                      {icon}
                    </button>
                    <div>
                      <h3 className="text-sm font-bold tracking-tight text-neutral-900 dark:text-neutral-50">{name}</h3>
                      <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                        {s.total} tasks · {pct}% done{points > 0 ? ` · ${points} pts` : ""}
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

                {iconEdit === name && (
                  <div className="mt-2.5 flex flex-wrap gap-1" onClick={(e) => e.stopPropagation()}>
                    {PROJECT_ICONS.map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => { setProjectIcon(name, emoji); setIconEdit(null) }}
                        className={cn(
                          "flex h-8 w-8 items-center justify-center rounded-lg text-base transition-all",
                          icon === emoji
                            ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
                            : "bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700"
                        )}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                )}

                <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
                  <div className={cn("h-full rounded-full transition-all", gradient)} style={{ width: `${progress}%` }} />
                </div>

                {preview.length > 0 && (
                  <div className="mt-3 space-y-1">
                    {preview.map((t: Task) => (
                      <div key={t.id}>
                        <div className="flex items-center gap-1.5 text-[11px] text-neutral-500 dark:text-neutral-400">
                          <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", t.completed ? "bg-emerald-500" : "bg-amber-400")} />
                          <span className="truncate">{t.title}</span>
                          {t.subtasks.length > 0 && (
                            <span className="ml-auto shrink-0 rounded bg-neutral-100 px-1 py-px text-[9px] font-semibold text-neutral-400 dark:bg-neutral-800 dark:text-neutral-500">
                              {t.subtasks.filter((x) => x.completed).length}/{t.subtasks.length}
                            </span>
                          )}
                        </div>
                        {t.subtasks.length > 0 && (
                          <div className="ml-3 mt-0.5 space-y-0.5 border-l-2 border-neutral-100 pl-2 dark:border-neutral-800">
                            {t.subtasks.slice(0, 2).map((sb) => (
                              <div key={sb.id} className="flex items-center gap-1.5 text-[10px] text-neutral-400 dark:text-neutral-500">
                                <span className={cn("h-1 w-1 shrink-0 rounded-full", sb.completed ? "bg-emerald-500" : "bg-neutral-300 dark:bg-neutral-600")} />
                                <span className="truncate">{sb.title}</span>
                              </div>
                            ))}
                            {t.subtasks.length > 2 && <p className="pl-2 text-[9px] text-neutral-400">+{t.subtasks.length - 2} more</p>}
                          </div>
                        )}
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
  const view: ViewMode = viewParam === "projects" ? "projects" : viewParam === "archive" ? "archive" : viewParam === "tree" ? "tree" : "tasks"
  const [analyticsOpen, setAnalyticsOpen] = useState(true)
  const { setFilterStatus, clearCompleted, openCreateModal, projectFilter, setProjectFilter, getProjects } = useTaskStore()
  const projects = getProjects()

  const handleViewChange = useCallback((v: ViewMode) => {
    router.replace(v === "tasks" ? "/tasks" : `/tasks?view=${v}`, { scroll: false })
    if (v === "archive") setFilterStatus("completed")
    else if (v === "tasks" || v === "tree") setFilterStatus("active")
  }, [router, setFilterStatus])

  const { setPageTitle } = usePageTitleStore()
  useEffect(() => {
    setPageTitle(view === "tree" ? "Tree" : view === "projects" ? "Projects" : view === "archive" ? "Archive" : "Tasks")
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
        {/* Archive actions */}
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

        {/* View tabs */}
        <div className="flex gap-1 rounded-xl bg-neutral-100 p-1 dark:bg-neutral-800">
          {([
            { key: "tasks" as const, label: "Tasks", icon: ListTodo },
            { key: "tree" as const, label: "Tree", icon: ListTree },
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
          <div className="flex items-center gap-2">
            {projects.length > 0 && (
              <Select value={projectFilter} onValueChange={setProjectFilter}>
                <SelectTrigger className="h-9 w-[104px] gap-1 border-neutral-200/60 bg-white text-xs dark:border-neutral-800/60 dark:bg-neutral-950 sm:w-[160px] sm:text-sm">
                  <FolderKanban className="h-3.5 w-3.5 shrink-0 text-neutral-500" />
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
            <Filters />
            <Button onClick={() => openCreateModal()} className="ml-auto max-sm:h-9 max-sm:px-3 max-sm:text-xs gap-2 rounded-xl">
              <Plus className="h-4 w-4" /> New Task
            </Button>
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
                {/* Today — daily 3 urgent / 2 focus / 3 easy planner */}
                <TodayPanel />

                {/* Tasks — checkbox tree, subtasks nested under each task */}
                <TaskCheckList />

                {/* Analytics — colored charts, responsive on mobile */}
                <div className="card-modern overflow-hidden rounded-2xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
                  <button
                    onClick={() => setAnalyticsOpen((v) => !v)}
                    className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left"
                  >
                    <span className="flex items-center gap-2.5">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-neutral-100 dark:bg-neutral-800">
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

            {view === "tree" && <TaskTreeView />}

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
