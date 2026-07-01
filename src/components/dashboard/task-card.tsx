"use client"

import { motion } from "framer-motion"
import {
  Calendar,
  Edit3,
  Trash2,
  CheckCircle2,
  Circle,
  ChevronDown,
  ChevronRight,
  CheckSquare,
  Plus,
  Minus,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import type { Task } from "@/types"
import { useTaskStore } from "@/store/use-task-store"
import { formatDate } from "@/lib/utils"
import { useState } from "react"

const priorityConfig = {
  high: { label: "High", variant: "high" as const },
  medium: { label: "Medium", variant: "medium" as const },
  low: { label: "Low", variant: "low" as const },
}

function subtaskCount(subtasks: { completed: boolean }[]) {
  const done = subtasks.filter((s) => s.completed).length
  return `${done}/${subtasks.length}`
}

export function TaskCard({ task, index }: { task: Task; index: number }) {
  const { setSelectedTask, setIsEditSheetOpen, setIsDeleteDialogOpen, toggleSubtask, updateTask } = useTaskStore()
  const [expanded, setExpanded] = useState(false)

  const priority = priorityConfig[task.priority]

  const adjustProgress = (delta: number) => {
    const step = 25
    const current = task.progress
    let next = Math.round(current / step) * step + delta
    next = Math.max(0, Math.min(100, next))
    if (next >= 100) {
      updateTask(task.id, { progress: 100, completed: true })
    } else {
      updateTask(task.id, { progress: next, completed: false })
    }
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: -10 }}
      transition={{ delay: index * 0.03, duration: 0.3, ease: "easeOut" }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="group relative overflow-hidden rounded-2xl border border-neutral-200/60 bg-white p-5 shadow-sm transition-shadow hover:shadow-lg dark:border-neutral-800/60 dark:bg-neutral-950"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="mb-1 flex items-center gap-2">
            <h3 className={`text-base font-semibold truncate ${task.completed ? "text-neutral-400 line-through dark:text-neutral-500" : "text-neutral-900 dark:text-neutral-50"}`}>
              {task.title}
            </h3>
            <Badge variant={priority.variant} className="shrink-0">
              {priority.label}
            </Badge>
          </div>
          {task.description && (
            <p className="mb-3 line-clamp-2 text-sm text-neutral-500 dark:text-neutral-400">
              {task.description}
            </p>
          )}
        </div>
        <div className="flex shrink-0 gap-1 sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => {
              setSelectedTask(task)
              setIsEditSheetOpen(true)
            }}
          >
            <Edit3 className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50"
            onClick={() => {
              setSelectedTask(task)
              setIsDeleteDialogOpen(true)
            }}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <div className="mb-3 flex items-center gap-3 text-xs text-neutral-500 dark:text-neutral-400">
        <div className="flex items-center gap-1">
          <Calendar className="h-3.5 w-3.5" />
          {formatDate(task.dueDate)}
        </div>
        <div className="flex items-center gap-1">
          <CheckCircle2 className="h-3.5 w-3.5" />
          {subtaskCount(task.subtasks)} subtasks
        </div>
        {task.completed && (
          <Badge variant="secondary" className="h-5 gap-1 px-1.5 text-[10px]">
            <CheckCircle2 className="h-3 w-3" />
            Done
          </Badge>
        )}
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="font-medium text-neutral-600 dark:text-neutral-400">Progress</span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => adjustProgress(-25)}
              disabled={task.progress <= 0}
              className="flex h-5 w-5 items-center justify-center rounded border border-neutral-200 text-neutral-500 hover:bg-neutral-100 disabled:opacity-30 dark:border-neutral-700 dark:hover:bg-neutral-800"
            >
              <Minus className="h-3 w-3" />
            </button>
            <span className="min-w-[28px] text-center font-semibold text-neutral-700 dark:text-neutral-300">{task.progress}%</span>
            <button
              onClick={() => adjustProgress(25)}
              disabled={task.progress >= 100}
              className="flex h-5 w-5 items-center justify-center rounded border border-neutral-200 text-neutral-500 hover:bg-neutral-100 disabled:opacity-30 dark:border-neutral-700 dark:hover:bg-neutral-800"
            >
              <Plus className="h-3 w-3" />
            </button>
          </div>
        </div>
        <Progress value={task.progress} className="h-2" />
      </div>

      {task.subtasks.length > 0 && (
        <>
          <button
            onClick={() => setExpanded(!expanded)}
            className="mt-3 flex items-center gap-1 text-xs font-medium text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-300"
          >
            {expanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
            {task.subtasks.filter((s) => s.completed).length}/{task.subtasks.length} subtasks
          </button>

          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mt-2 space-y-1"
            >
              {task.subtasks.map((sub) => (
                <motion.div
                  key={sub.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
                >
                  <button
                    onClick={() => toggleSubtask(task.id, sub.id)}
                    className="shrink-0"
                  >
                    {sub.completed ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    ) : (
                      <Circle className="h-4 w-4 text-neutral-300 dark:text-neutral-600" />
                    )}
                  </button>
                  <span
                    className={`text-sm ${
                      sub.completed
                        ? "text-neutral-400 line-through dark:text-neutral-500"
                        : "text-neutral-700 dark:text-neutral-300"
                    }`}
                  >
                    {sub.title}
                  </span>
                </motion.div>
              ))}
            </motion.div>
          )}
        </>
      )}
    </motion.div>
  )
}
