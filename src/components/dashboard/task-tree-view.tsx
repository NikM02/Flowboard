"use client"

import { useMemo, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  ChevronDown, CheckCircle2, Circle, Calendar,
  Clock, ListChecks, Edit3, Trash2, Plus, X,
} from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { useTaskStore } from "@/store/use-task-store"
import { formatDate } from "@/lib/utils"
import { getTaskStatus, TASK_STATUS_STYLES } from "@/lib/task-status"
import { cn } from "@/lib/shadcn-utils"
import type { Task, Subtask, Priority } from "@/types"
import { EmptyState } from "./empty-state"

const priorityConfig: Record<Priority, { label: string; color: string; bg: string }> = {
  high: { label: "High", color: "text-red-500", bg: "bg-red-50 dark:bg-red-950/20" },
  medium: { label: "Medium", color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-950/20" },
  low: { label: "Low", color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-950/20" },
}

const PROJECT_DOTS = [
  "#0066cc", "#34c759", "#ff9f0a", "#af52de",
  "#3fd0c9", "#ff3b30", "#2b8bf7", "#ff375f",
]

function SubtaskRow({ taskId, subtask }: { taskId: string; subtask: Subtask }) {
  const { toggleSubtask, removeSubtask } = useTaskStore()

  return (
    <div className="group/sub flex items-center gap-2 rounded-lg px-2 py-1 transition-colors hover:bg-neutral-100/70 dark:hover:bg-neutral-800/70">
      <button
        onClick={() => toggleSubtask(taskId, subtask.id)}
        className="flex min-w-0 flex-1 items-center gap-2 text-left"
      >
        <span className={cn("shrink-0 transition-colors", subtask.completed ? "text-green-500" : "text-neutral-300 dark:text-neutral-600")}>
          {subtask.completed ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : (
            <Circle className="h-4 w-4" />
          )}
        </span>
        <span className={cn(
          "truncate text-xs",
          subtask.completed ? "text-neutral-400 line-through dark:text-neutral-600" : "text-neutral-600 dark:text-neutral-300"
        )}>
          {subtask.title}
        </span>
      </button>
      <button
        onClick={() => removeSubtask(taskId, subtask.id)}
        className="shrink-0 rounded p-0.5 text-neutral-300 opacity-0 transition-opacity hover:text-red-500 group-hover/sub:opacity-100 max-sm:opacity-100 dark:text-neutral-600"
        aria-label="Remove subtask"
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  )
}

function TaskNode({ task, index }: { task: Task; index: number }) {
  const { setSelectedTask, setIsEditSheetOpen, setIsDeleteDialogOpen, updateTask, addSubtask, requestComplete } = useTaskStore()
  const [newSub, setNewSub] = useState("")
  const priority = priorityConfig[task.priority]
  const doneCount = task.subtasks.filter((s) => s.completed).length
  const status = getTaskStatus(task)

  const handleToggleComplete = () => {
    if (task.completed) updateTask(task.id, { completed: false })
    else requestComplete(task.id)
  }

  const addSub = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!newSub.trim()) return
    addSubtask(task.id, newSub.trim())
    setNewSub("")
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      className={cn(
        "group rounded-xl border p-3.5 transition-all",
        task.completed
          ? "border-green-200/40 bg-green-50/30 dark:border-green-900/20 dark:bg-green-950/10"
          : "border-neutral-200/60 bg-white hover:border-neutral-300/70 hover:shadow-sm dark:border-neutral-800/60 dark:bg-neutral-900"
      )}
    >
      <div className="flex items-start gap-2.5">
        <button onClick={handleToggleComplete} className="mt-0.5 shrink-0">
          {task.completed ? (
            <CheckCircle2 className="h-5 w-5 text-green-500" />
          ) : (
            <Circle className="h-5 w-5 text-neutral-300 dark:text-neutral-600" />
          )}
        </button>

        <div className="min-w-0 flex-1">
          <span className={cn(
            "block truncate text-sm font-semibold tracking-tight",
            task.completed ? "text-neutral-400 line-through dark:text-neutral-600" : "text-neutral-900 dark:text-neutral-50"
          )}>
            {task.title}
          </span>
          {task.description && (
            <span className="mt-0.5 block line-clamp-2 text-xs text-neutral-500 dark:text-neutral-400">{task.description}</span>
          )}

          {/* Details row */}
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[11px] font-medium">
            <span className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold", priority.bg, priority.color)}>
              {priority.label}
            </span>
            <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold", TASK_STATUS_STYLES[status.key])}>
              {status.label}
            </span>
            {task.storyPoints != null && (
              <span className="inline-flex items-center gap-1 rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-semibold text-violet-700 dark:bg-violet-900/30 dark:text-violet-300" title="Story points">
                {task.storyPoints} pts
              </span>
            )}
            {task.dueDate && (
              <span className="flex items-center gap-1 text-neutral-500 dark:text-neutral-400">
                <Calendar className="h-3 w-3" />
                {formatDate(task.dueDate, task.dueTime)}
              </span>
            )}
            {task.reminder && (
              <span className="flex items-center gap-1 text-neutral-500 dark:text-neutral-400" title="Reminder set">
                <Clock className="h-3 w-3" />
                Reminder
              </span>
            )}
            {task.subtasks.length > 0 && (
              <span className="flex items-center gap-1 text-neutral-500 dark:text-neutral-400">
                <ListChecks className="h-3 w-3" />
                {doneCount}/{task.subtasks.length} subtasks
              </span>
            )}
            <span className="flex items-center gap-1.5">
              <Progress value={task.progress} className="h-1 w-16" />
              <span className="w-7 text-right text-[11px] font-medium tabular-nums text-neutral-500 dark:text-neutral-400">{task.progress}%</span>
            </span>
          </div>

          {/* Subtasks */}
          {task.subtasks.length > 0 && (
            <div className="mt-2 flex flex-col gap-0.5 border-l-2 border-neutral-100 pl-2 dark:border-neutral-800">
              {task.subtasks.map((s) => (
                <SubtaskRow key={s.id} taskId={task.id} subtask={s} />
              ))}
            </div>
          )}

          {/* Quick add subtask */}
          <form onSubmit={addSub} className="mt-1.5 flex items-center gap-1.5">
            <Input
              value={newSub}
              onChange={(e) => setNewSub(e.target.value)}
              placeholder="+ Add subtask…"
              className="h-7 min-w-0 flex-1 rounded-md text-xs"
            />
            <button
              type="submit"
              disabled={!newSub.trim()}
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-neutral-900 text-white transition-opacity hover:opacity-80 disabled:opacity-30 dark:bg-white dark:text-neutral-900"
              aria-label="Add subtask"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </form>
        </div>

        {/* Actions */}
        <div className="flex shrink-0 justify-end gap-0.5">
          <button
            onClick={() => { setSelectedTask(task); setIsEditSheetOpen(true) }}
            className="rounded-lg p-1.5 text-neutral-400 opacity-0 transition-opacity hover:bg-neutral-100 hover:text-neutral-600 group-hover:opacity-100 max-sm:opacity-100 dark:hover:bg-neutral-800"
          >
            <Edit3 className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => { setSelectedTask(task); setIsDeleteDialogOpen(true) }}
            className="rounded-lg p-1.5 text-neutral-400 opacity-0 transition-opacity hover:bg-red-50 hover:text-red-500 group-hover:opacity-100 max-sm:opacity-100 dark:hover:bg-red-950/50"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </motion.div>
  )
}

function ProjectGroup({ name, groupTasks, dot, index }: {
  name: string
  groupTasks: Task[]
  dot: string
  index: number
}) {
  const { updateTask, getProjectIcon } = useTaskStore()
  const [collapsed, setCollapsed] = useState(false)
  const done = groupTasks.filter((t) => t.completed).length
  const pct = groupTasks.length > 0 ? Math.round((done / groupTasks.length) * 100) : 0
  const allDone = done === groupTasks.length
  const totalPoints = groupTasks.reduce((s, t) => s + (t.storyPoints ?? 0), 0)
  const totalSubs = groupTasks.reduce((n, t) => n + t.subtasks.length, 0)
  const icon = getProjectIcon(name)

  const toggleAll = () => {
    const next = !allDone
    for (const t of groupTasks) {
      if (t.completed !== next) {
        updateTask(t.id, { completed: next, progress: next ? 100 : t.progress })
      }
    }
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className="card-modern overflow-hidden rounded-[18px] border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900"
    >
      <div className="flex items-center gap-2.5 px-4 py-3">
        <button
          onClick={toggleAll}
          className={cn("shrink-0 transition-colors", allDone ? "text-green-500" : "text-neutral-300 hover:text-neutral-400 dark:text-neutral-600 dark:hover:text-neutral-500")}
          title={allDone ? "Reopen all tasks in this project" : "Mark all tasks in this project as done"}
        >
          {allDone ? <CheckCircle2 className="h-5 w-5" /> : <Circle className="h-5 w-5" />}
        </button>

        <button
          onClick={() => setCollapsed((c) => !c)}
          className="flex min-w-0 flex-1 items-center gap-2.5 text-left"
        >
          <span
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] text-base"
            style={{ backgroundColor: `${dot}1a` }}
            title={name}
          >
            {icon}
          </span>
          <span className="min-w-0 flex-1">
            <span className={cn("block truncate text-sm font-bold tracking-tight", allDone ? "text-neutral-400 line-through dark:text-neutral-600" : "text-neutral-900 dark:text-neutral-50")}>
              {name}
            </span>
            <span className="block text-[11px] text-neutral-500 dark:text-neutral-400">
              {done}/{groupTasks.length} done · {pct}%
              {totalSubs > 0 ? ` · ${totalSubs} subtasks` : ""}
              {totalPoints > 0 ? ` · ${totalPoints} pts` : ""}
            </span>
          </span>
          <span className="hidden w-24 sm:block">
            <Progress value={pct} className="h-1.5" />
          </span>
        </button>

        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-neutral-400 transition-transform duration-200",
            collapsed && "-rotate-90"
          )}
        />
      </div>

      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="flex flex-col gap-2 border-t border-neutral-100 p-3 dark:border-neutral-800">
              <div className="flex flex-col gap-2 border-l-2 border-neutral-100 pl-2 dark:border-neutral-800">
                {groupTasks.map((t, i) => (
                  <TaskNode key={t.id} task={t} index={i} />
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export function TaskTreeView() {
  const tasks = useTaskStore((s) => s.tasks)
  const projects = useTaskStore((s) => s.projects)

  const groups = useMemo(() => {
    const map = new Map<string, Task[]>()
    for (const t of tasks) {
      const key = t.project.trim() || "Uncategorized"
      const list = map.get(key)
      if (list) list.push(t)
      else map.set(key, [t])
    }
    const derived = [...new Set(tasks.map((t) => t.project.trim()).filter(Boolean))]
    const keys: string[] = []
    for (const p of projects) if (map.has(p)) keys.push(p)
    for (const d of derived) if (!keys.includes(d)) keys.push(d)
    if (map.has("Uncategorized")) keys.push("Uncategorized")
    return keys.map((k) => ({ name: k, tasks: map.get(k) ?? [] }))
  }, [tasks, projects])

  if (tasks.length === 0) return <EmptyState />

  const taskCount = tasks.length
  const projectCount = new Set(tasks.map((t) => t.project.trim() || "Uncategorized")).size

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-sm text-neutral-500 dark:text-neutral-400">
        <p>
          {taskCount} {taskCount === 1 ? "task" : "tasks"} · {projectCount} {projectCount === 1 ? "group" : "groups"}
        </p>
      </div>

      <AnimatePresence mode="popLayout">
        {groups.map((g, i) => (
          <ProjectGroup
            key={g.name}
            name={g.name}
            groupTasks={g.tasks}
            dot={PROJECT_DOTS[i % PROJECT_DOTS.length]}
            index={i}
          />
        ))}
      </AnimatePresence>
    </div>
  )
}