"use client"

import { motion } from "framer-motion"
import {
  Calendar, Edit3, Trash2, CheckCircle2, Circle,
  ChevronDown, ChevronRight, Plus, Minus, FolderKanban,
  CalendarClock,
} from "lucide-react"
import type { Task } from "@/types"
import { useTaskStore } from "@/store/use-task-store"
import { useRoutineStore } from "@/store/use-routine-store"
import { formatDate } from "@/lib/utils"
import { useState } from "react"
import { cn } from "@/lib/shadcn-utils"
import { format } from "date-fns"

const priorityConfig = {
  high: { label: "High", variant: "high" as const, color: "text-red-500", bg: "bg-red-50 dark:bg-red-950/20", border: "border-red-200 dark:border-red-900/30" },
  medium: { label: "Medium", variant: "medium" as const, color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-950/20", border: "border-amber-200 dark:border-amber-900/30" },
  low: { label: "Low", variant: "low" as const, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-950/20", border: "border-blue-200 dark:border-blue-900/30" },
}

export function TaskCard({ task, index }: { task: Task; index: number }) {
  const { setSelectedTask, setIsEditSheetOpen, setIsDeleteDialogOpen, toggleSubtask, updateTask, requestComplete } = useTaskStore()
  const addTaskToRoutine = useRoutineStore((s) => s.addTaskToRoutine)
  const [expanded, setExpanded] = useState(false)

  const priority = priorityConfig[task.priority]
  const completedSubs = task.subtasks.filter((s) => s.completed).length
  const totalSubs = task.subtasks.length

  const adjustProgress = (delta: number) => {
    const step = 25
    let next = Math.round(task.progress / step) * step + delta
    next = Math.max(0, Math.min(100, next))
    if (next >= 100) requestComplete(task.id)
    else updateTask(task.id, { progress: next, completed: false })
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ delay: index * 0.03, duration: 0.25 }}
      className={cn(
        "card-modern card-hover group relative rounded-2xl p-5",
        task.completed
          ? "border border-green-200/60 dark:border-green-900/20"
          : "glass"
      )}
    >
      {/* Top row: title + actions */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className={cn(
              "text-[15px] font-semibold truncate",
              task.completed ? "text-neutral-400 line-through dark:text-neutral-600" : "text-neutral-900 dark:text-neutral-50"
            )}>
              {task.title}
            </h3>
            <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold", priority.bg, priority.color, priority.border, "border")}>
              {priority.label}
            </span>
            {task.project && (
              <span className="inline-flex items-center gap-1 rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-medium text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400">
                <FolderKanban className="h-2.5 w-2.5" /> {task.project}
              </span>
            )}
          </div>
          {task.description && (
            <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-neutral-500 dark:text-neutral-400">
              {task.description}
            </p>
          )}
        </div>
        <div className="flex shrink-0 gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            onClick={() => {
              const date = task.dueDate || format(new Date(), "yyyy-MM-dd")
              addTaskToRoutine(date, task.id, task.title, 9, 10)
            }}
            className="rounded-[10px] p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 dark:hover:bg-neutral-800"
            title="Add to Routine"
          >
            <CalendarClock className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => { setSelectedTask(task); setIsEditSheetOpen(true) }}
            className="rounded-[10px] p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 dark:hover:bg-neutral-800"
          >
            <Edit3 className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => { setSelectedTask(task); setIsDeleteDialogOpen(true) }}
            className="rounded-[10px] p-1.5 text-neutral-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/50"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Meta row */}
      <div className="mt-3 flex items-center gap-3 text-[11px] text-neutral-400 dark:text-neutral-500">
        {task.dueDate && (
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" /> {formatDate(task.dueDate, task.dueTime)}
          </span>
        )}
        {totalSubs > 0 && (
          <span className="flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" /> {completedSubs}/{totalSubs}
          </span>
        )}
        {task.completed && (
          <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
            <CheckCircle2 className="h-3 w-3" /> Done
          </span>
        )}
      </div>

      {/* Progress */}
      <div className="mt-3.5">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-neutral-400 dark:text-neutral-500">Progress</span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => adjustProgress(-25)}
              disabled={task.progress <= 0}
              className="flex h-5 w-5 items-center justify-center rounded-[10px] border border-neutral-200 text-neutral-400 hover:bg-neutral-100 disabled:opacity-30 dark:border-neutral-700 dark:hover:bg-neutral-800"
            >
              <Minus className="h-3 w-3" />
            </button>
            <span className="min-w-[32px] text-center text-xs font-semibold text-neutral-700 dark:text-neutral-300">{task.progress}%</span>
            <button
              onClick={() => adjustProgress(25)}
              disabled={task.progress >= 100}
              className="flex h-5 w-5 items-center justify-center rounded-[10px] border border-neutral-200 text-neutral-400 hover:bg-neutral-100 disabled:opacity-30 dark:border-neutral-700 dark:hover:bg-neutral-800"
            >
              <Plus className="h-3 w-3" />
            </button>
          </div>
        </div>
        <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
          <motion.div
            className={cn("h-full rounded-full", task.progress >= 100 ? "bg-green-500" : task.progress >= 50 ? "bg-blue-500" : "bg-neutral-900 dark:bg-neutral-50")}
            initial={{ width: 0 }}
            animate={{ width: `${task.progress}%` }}
            transition={{ duration: 0.4 }}
          />
        </div>
      </div>

      {/* Subtasks toggle */}
      {totalSubs > 0 && (
        <>
          <button
            onClick={() => setExpanded(!expanded)}
            className="mt-3 flex items-center gap-1 text-[11px] font-medium text-neutral-400 transition-colors hover:text-neutral-600 dark:hover:text-neutral-300"
          >
            {expanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
            {completedSubs}/{totalSubs} subtasks
          </button>

          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              className="mt-2 space-y-1 overflow-hidden"
            >
              {task.subtasks.map((sub) => (
                <div
                  key={sub.id}
                  className="flex items-center gap-2 rounded-lg bg-neutral-50 px-2.5 py-1.5 dark:bg-neutral-800/50"
                >
                  <button onClick={() => toggleSubtask(task.id, sub.id)} className="shrink-0">
                    {sub.completed ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                    ) : (
                      <Circle className="h-3.5 w-3.5 text-neutral-300 dark:text-neutral-600" />
                    )}
                  </button>
                  <span className={cn(
                    "text-xs",
                    sub.completed ? "text-neutral-400 line-through dark:text-neutral-600" : "text-neutral-700 dark:text-neutral-300"
                  )}>
                    {sub.title}
                  </span>
                </div>
              ))}
            </motion.div>
          )}
        </>
      )}
    </motion.div>
  )
}
