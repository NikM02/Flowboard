"use client"

import { motion, AnimatePresence } from "framer-motion"
import {
  Calendar,
  Edit3,
  Trash2,
  CheckCircle2,
  Circle,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import type { Task, Priority } from "@/types"
import { useTaskStore } from "@/store/use-task-store"
import { formatDate } from "@/lib/utils"
import { EmptyState } from "./empty-state"
import { useMediaQuery } from "@/hooks/use-media-query"

const priorityConfig: Record<Priority, { label: string; variant: "low" | "medium" | "high" }> = {
  high: { label: "High", variant: "high" },
  medium: { label: "Medium", variant: "medium" },
  low: { label: "Low", variant: "low" },
}

function ListRow({ task, index }: { task: Task; index: number }) {
  const { setSelectedTask, setIsEditSheetOpen, setIsDeleteDialogOpen, updateTask } = useTaskStore()
  const priority = priorityConfig[task.priority]
  const isMobile = useMediaQuery("(max-width: 640px)")

  const handleToggleComplete = () => {
    if (task.completed) {
      updateTask(task.id, { completed: false })
    } else {
      updateTask(task.id, { completed: true, progress: 100 })
    }
  }

  if (isMobile) {
    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ delay: index * 0.02 }}
        className="rounded-xl border border-neutral-200/60 bg-white p-4 dark:border-neutral-800/60 dark:bg-neutral-950"
      >
        <div className="mb-2 flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <button onClick={handleToggleComplete} className="p-1">
              {task.completed ? (
                <CheckCircle2 className="h-6 w-6 text-emerald-500" />
              ) : (
                <Circle className="h-6 w-6 text-neutral-300 dark:text-neutral-600" />
              )}
            </button>
            <div>
              <span className={`font-medium text-sm ${task.completed ? "text-neutral-400 line-through" : "text-neutral-900 dark:text-neutral-50"}`}>
                {task.title}
              </span>
              <Badge variant={priority.variant} className="ml-2 text-[10px]">
                {priority.label}
              </Badge>
            </div>
          </div>
          <div className="flex gap-1 shrink-0">
            <Button variant="ghost" size="icon" className="h-9 w-9 sm:h-7 sm:w-7" onClick={() => { setSelectedTask(task); setIsEditSheetOpen(true) }}>
              <Edit3 className="h-4 w-4 sm:h-3 sm:w-3" />
            </Button>
            <Button variant="ghost" size="icon" className="h-9 w-9 sm:h-7 sm:w-7 text-red-500" onClick={() => { setSelectedTask(task); setIsDeleteDialogOpen(true) }}>
              <Trash2 className="h-4 w-4 sm:h-3 sm:w-3" />
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-3 text-xs text-neutral-500 ml-7">
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {formatDate(task.dueDate)}
          </span>
          <span>{task.progress}%</span>
        </div>
        <div className="ml-7 mt-2">
          <Progress value={task.progress} className="h-1.5" />
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ delay: index * 0.02 }}
      className="grid grid-cols-[1fr_100px_120px_120px_100px_80px] items-center gap-4 rounded-xl border border-neutral-200/60 bg-white px-5 py-3.5 transition-all hover:border-neutral-300/60 hover:shadow-sm dark:border-neutral-800/60 dark:bg-neutral-950 dark:hover:border-neutral-700/60"
    >
      <div className="flex items-center gap-3 min-w-0">
        <button onClick={handleToggleComplete}>
          {task.completed ? (
            <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" />
          ) : (
            <Circle className="h-5 w-5 shrink-0 text-neutral-300 dark:text-neutral-600" />
          )}
        </button>
        <div className="min-w-0">
          <span
            className={`block truncate text-sm font-medium ${
              task.completed
                ? "text-neutral-400 line-through dark:text-neutral-500"
                : "text-neutral-900 dark:text-neutral-50"
            }`}
          >
            {task.title}
          </span>
        </div>
      </div>

      <div>
        <Badge variant={priority.variant} className="text-xs">
          {priority.label}
        </Badge>
      </div>

      <div className="flex items-center gap-1.5 text-sm text-neutral-500 dark:text-neutral-400">
        <Calendar className="h-3.5 w-3.5 shrink-0" />
        <span className="truncate">{formatDate(task.dueDate)}</span>
      </div>

      <div className="flex items-center gap-2">
        <Progress value={task.progress} className="h-1.5 flex-1" />
        <span className="w-8 text-right text-xs font-medium text-neutral-600 dark:text-neutral-400">
          {task.progress}%
        </span>
      </div>

      <div>
        {task.completed ? (
          <Badge variant="secondary" className="gap-1 text-xs">
            <CheckCircle2 className="h-3 w-3" />
            Done
          </Badge>
        ) : (
          <span className="text-sm text-neutral-500 dark:text-neutral-400">Active</span>
        )}
      </div>

      <div className="flex justify-end gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => { setSelectedTask(task); setIsEditSheetOpen(true) }}
        >
          <Edit3 className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50"
          onClick={() => { setSelectedTask(task); setIsDeleteDialogOpen(true) }}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </motion.div>
  )
}

export function TaskListView({ archive }: { archive?: boolean }) {
  const { getFilteredTasks } = useTaskStore()
  const tasks = getFilteredTasks()
  const isMobile = useMediaQuery("(max-width: 640px)")

  if (tasks.length === 0) {
    return <EmptyState archive={archive} />
  }

  if (isMobile) {
    return (
      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {tasks.map((task, index) => (
            <ListRow key={task.id} task={task} index={index} />
          ))}
        </AnimatePresence>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-neutral-200/60 bg-white dark:border-neutral-800/60 dark:bg-neutral-950">
      <div className="grid grid-cols-[1fr_100px_120px_120px_100px_80px] items-center gap-4 border-b border-neutral-100 bg-neutral-50/50 px-5 py-3 min-w-[600px] dark:border-neutral-800 dark:bg-neutral-900/50">
        <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">Task</span>
        <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">Priority</span>
        <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">Due Date</span>
        <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">Progress</span>
        <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">Status</span>
        <span className="text-right text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">Actions</span>
      </div>
      <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
        <AnimatePresence mode="popLayout">
          {tasks.map((task, index) => (
            <ListRow key={task.id} task={task} index={index} />
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}
