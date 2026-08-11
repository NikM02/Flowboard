"use client"

import { motion, AnimatePresence } from "framer-motion"
import { Calendar, Edit3, Trash2, CheckCircle2, Circle, FolderKanban } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import type { Task, Priority } from "@/types"
import { useTaskStore } from "@/store/use-task-store"
import { formatDate } from "@/lib/utils"
import { EmptyState } from "./empty-state"
import { cn } from "@/lib/shadcn-utils"

const priorityConfig: Record<Priority, { label: string; variant: "low" | "medium" | "high"; color: string; bg: string }> = {
  high: { label: "High", variant: "high", color: "text-red-500", bg: "bg-red-50 dark:bg-red-950/20" },
  medium: { label: "Medium", variant: "medium", color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-950/20" },
  low: { label: "Low", variant: "low", color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-950/20" },
}

function ListRow({ task, index }: { task: Task; index: number }) {
  const { setSelectedTask, setIsEditSheetOpen, setIsDeleteDialogOpen, updateTask, requestComplete } = useTaskStore()
  const priority = priorityConfig[task.priority]

  const handleToggleComplete = () => {
    if (task.completed) updateTask(task.id, { completed: false })
    else requestComplete(task.id)
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ delay: index * 0.02 }}
      className={cn(
        "group flex items-center gap-3 rounded-xl border p-3.5 transition-all sm:grid sm:grid-cols-[1fr_100px_90px_110px_120px_80px] sm:items-center sm:gap-4",
        task.completed
          ? "border-green-200/40 bg-green-50/30 dark:border-green-900/20 dark:bg-green-950/10"
          : "border-neutral-200/60 bg-white hover:border-neutral-300/60 hover:shadow-sm dark:border-neutral-800/60 dark:bg-neutral-900"
      )}
    >
      {/* Title */}
      <div className="flex items-center gap-2.5 min-w-0 flex-1">
        <button onClick={handleToggleComplete} className="shrink-0">
          {task.completed ? (
            <CheckCircle2 className="h-5 w-5 text-green-500" />
          ) : (
            <Circle className="h-5 w-5 text-neutral-300 dark:text-neutral-600" />
          )}
        </button>
        <div className="min-w-0">
          <span className={cn(
            "block truncate text-sm font-medium",
            task.completed ? "text-neutral-400 line-through dark:text-neutral-600" : "text-neutral-900 dark:text-neutral-50"
          )}>
            {task.title}
          </span>
          {task.description && (
            <span className="block truncate text-[11px] text-neutral-400 dark:text-neutral-500">{task.description}</span>
          )}
        </div>
      </div>

      {/* Project — hidden on mobile */}
      <div className="hidden sm:block">
        {task.project ? (
          <span className="inline-flex items-center gap-1 truncate text-xs text-neutral-500 dark:text-neutral-400">
            <FolderKanban className="h-3 w-3 shrink-0" />
            <span className="truncate">{task.project}</span>
          </span>
        ) : (
          <span className="text-xs text-neutral-300 dark:text-neutral-600">—</span>
        )}
      </div>

      {/* Priority — hidden on mobile */}
      <div className="hidden sm:block">
        <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold border", priority.bg, priority.color, "border-current/20")}>
          {priority.label}
        </span>
      </div>

      {/* Due date — hidden on mobile */}
      <div className="hidden sm:flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400">
        <Calendar className="h-3 w-3 shrink-0" />
        <span className="truncate">{formatDate(task.dueDate)}</span>
      </div>

      {/* Progress — hidden on mobile */}
      <div className="hidden sm:flex items-center gap-2">
        <Progress value={task.progress} className="h-1.5 flex-1" />
        <span className="w-8 text-right text-[11px] font-medium text-neutral-500 dark:text-neutral-400">{task.progress}%</span>
      </div>

      {/* Status — hidden on mobile */}
      <div className="hidden sm:block">
        {task.completed ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-semibold text-green-700 dark:bg-green-900/30 dark:text-green-400">
            <CheckCircle2 className="h-3 w-3" /> Done
          </span>
        ) : (
          <span className="text-xs text-neutral-400">Active</span>
        )}
      </div>

      {/* Mobile meta */}
      <div className="flex items-center gap-3 text-[11px] text-neutral-400 sm:hidden">
        <span className={cn("rounded-full px-1.5 py-0.5 font-semibold", priority.bg, priority.color)}>{priority.label}</span>
        {task.dueDate && <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{formatDate(task.dueDate)}</span>}
        <span>{task.progress}%</span>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-0.5 sm:justify-end">
        <button
          onClick={() => { setSelectedTask(task); setIsEditSheetOpen(true) }}
          className="rounded-lg p-1.5 text-neutral-400 opacity-0 transition-opacity hover:bg-neutral-100 hover:text-neutral-600 group-hover:opacity-100 dark:hover:bg-neutral-800 sm:opacity-0"
        >
          <Edit3 className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={() => { setSelectedTask(task); setIsDeleteDialogOpen(true) }}
          className="rounded-lg p-1.5 text-neutral-400 opacity-0 transition-opacity hover:bg-red-50 hover:text-red-500 group-hover:opacity-100 dark:hover:bg-red-950/50 sm:opacity-0"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </motion.div>
  )
}

export function TaskListView({ archive }: { archive?: boolean }) {
  const tasks = useTaskStore((s) => s.tasks)
  const getFilteredTasks = useTaskStore((s) => s.getFilteredTasks)
  const filtered = archive ? tasks.filter((t) => t.completed) : getFilteredTasks()

  if (filtered.length === 0) return <EmptyState archive={archive} />

  return (
    <div className="space-y-2">
      <AnimatePresence mode="popLayout">
        {filtered.map((task, index) => (
          <ListRow key={task.id} task={task} index={index} />
        ))}
      </AnimatePresence>
    </div>
  )
}
