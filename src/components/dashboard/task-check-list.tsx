"use client"

import { useState, type FormEvent } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Check, Plus, ChevronDown, ChevronRight, Calendar,
  Edit3, Trash2, X, FolderKanban,
} from "lucide-react"
import { useTaskStore } from "@/store/use-task-store"
import { cn } from "@/lib/shadcn-utils"
import type { Priority, Task } from "@/types"
import { formatDate } from "@/lib/utils"
import { getTaskStatus, TASK_STATUS_STYLES } from "@/lib/task-status"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { EmptyState } from "./empty-state"

const PRIORITY_META: Record<Priority, { label: string; text: string; badge: string; check: string }> = {
  high: {
    label: "High",
    text: "text-red-500",
    badge: "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400",
    check: "bg-red-500",
  },
  medium: {
    label: "Medium",
    text: "text-amber-500",
    badge: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400",
    check: "bg-amber-500",
  },
  low: {
    label: "Low",
    text: "text-blue-500",
    badge: "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400",
    check: "bg-blue-500",
  },
}

function Checkbox({ done, priority }: { done: boolean; priority: Priority }) {
  const meta = PRIORITY_META[priority]
  return (
    <span
      className={cn(
        "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-all",
        done
          ? cn("border-transparent", meta.check)
          : "border-neutral-300 bg-white hover:border-neutral-400 dark:border-neutral-600 dark:bg-neutral-900 dark:hover:border-neutral-500"
      )}
    >
      {done && <Check className="h-3 w-3 text-white" strokeWidth={3.5} />}
    </span>
  )
}

function SubtaskRow({ taskId, subtask }: { taskId: string; subtask: { id: string; title: string; completed: boolean } }) {
  const { toggleSubtask, removeSubtask } = useTaskStore()
  return (
    <div className="group/sub flex items-center gap-2 rounded-lg px-1.5 py-1 transition-colors hover:bg-neutral-100/70 dark:hover:bg-neutral-800/60">
      <button onClick={() => toggleSubtask(taskId, subtask.id)} aria-label="Toggle subtask">
        <span
          className={cn(
            "flex h-4 w-4 shrink-0 items-center justify-center rounded-[5px] border-2 transition-all",
            subtask.completed
              ? "border-transparent bg-emerald-500"
              : "border-neutral-300 bg-white hover:border-neutral-400 dark:border-neutral-600 dark:bg-neutral-900 dark:hover:border-neutral-500"
          )}
        >
          {subtask.completed && <Check className="h-2.5 w-2.5 text-white" strokeWidth={4} />}
        </span>
      </button>
      <span className={cn("min-w-0 flex-1 truncate text-xs", subtask.completed ? "text-neutral-400 line-through dark:text-neutral-600" : "text-neutral-600 dark:text-neutral-300")}>
        {subtask.title}
      </span>
      <button
        onClick={() => removeSubtask(taskId, subtask.id)}
        className="rounded p-0.5 text-neutral-300 opacity-0 transition-opacity hover:text-red-500 group-hover/sub:opacity-100 max-sm:opacity-100 dark:text-neutral-600"
        aria-label="Remove subtask"
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  )
}

function CheckRow({ task, index }: { task: Task; index: number }) {
  const {
    setSelectedTask, setIsEditSheetOpen, setIsDeleteDialogOpen,
    updateTask, requestComplete, addSubtask, getProjectIcon,
  } = useTaskStore()
  const [expanded, setExpanded] = useState(task.subtasks.length > 0)
  const [newSub, setNewSub] = useState("")
  const meta = PRIORITY_META[task.priority]
  const status = getTaskStatus(task)
  const doneCount = task.subtasks.filter((s) => s.completed).length

  const toggle = () => {
    if (task.completed) updateTask(task.id, { completed: false, progress: task.subtasks.length ? task.progress : 0 })
    else requestComplete(task.id)
  }

  const addSub = (e: FormEvent) => {
    e.preventDefault()
    if (!newSub.trim()) return
    addSubtask(task.id, newSub.trim())
    setNewSub("")
    setExpanded(true)
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ delay: index * 0.02, duration: 0.2 }}
      className={cn(
        "group rounded-xl border p-3 transition-all",
        task.completed
          ? "border-green-200/50 bg-green-50/40 dark:border-green-900/20 dark:bg-green-950/10"
          : "border-neutral-200/80 bg-white hover:border-neutral-300/80 hover:shadow-sm dark:border-neutral-800/80 dark:bg-neutral-900 dark:hover:border-neutral-700"
      )}
    >
      {/* Parent row */}
      <div className="flex items-start gap-2.5">
        <button onClick={toggle} aria-label="Toggle task">
          <Checkbox done={task.completed} priority={task.priority} />
        </button>

        <button onClick={() => setExpanded((v) => !v)} className="flex min-w-0 flex-1 items-start gap-1 text-left">
          <span
            className={cn(
              "min-w-0 flex-1",
              task.completed ? "text-neutral-400 line-through dark:text-neutral-500" : "text-neutral-900 dark:text-neutral-50"
            )}
          >
            <span className="block truncate text-sm font-semibold tracking-tight">{task.title}</span>
            {task.description && (
              <span className="mt-0.5 line-clamp-1 text-[11px] font-normal text-neutral-400 dark:text-neutral-500">
                {task.description}
              </span>
            )}
          </span>
          {task.subtasks.length > 0 &&
            (expanded ? <ChevronDown className="mt-0.5 h-3.5 w-3.5 shrink-0 text-neutral-300 dark:text-neutral-600" /> : <ChevronRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-neutral-300 dark:text-neutral-600" />)}
        </button>

        <div className="flex shrink-0 items-center gap-0.5">
          <button
            onClick={() => { setSelectedTask(task); setIsEditSheetOpen(true) }}
            className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 dark:hover:bg-neutral-800 dark:hover:text-neutral-300"
            aria-label="Edit task"
          >
            <Edit3 className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => { setSelectedTask(task); setIsDeleteDialogOpen(true) }}
            className="rounded-lg p-1.5 text-neutral-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/50"
            aria-label="Delete task"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Meta */}
      <div className="mt-1.5 flex flex-wrap items-center gap-1.5 pl-[30px]">
        <span className={cn("inline-flex items-center rounded-full border border-current/10 px-1.5 py-0.5 text-[10px] font-semibold", meta.badge, meta.text)}>
          {meta.label}
        </span>
        <span className={cn("inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold", TASK_STATUS_STYLES[status.key])}>
          {status.label}
        </span>
        {task.project && (
          <span className="inline-flex max-w-[140px] items-center gap-1 truncate rounded-full bg-neutral-100 px-1.5 py-0.5 text-[10px] font-medium text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400">
            <FolderKanban className="h-3 w-3 shrink-0" />
            {getProjectIcon(task.project)}
            <span className="truncate">{task.project}</span>
          </span>
        )}
        {task.dueDate && (
          <span className="flex items-center gap-1 text-[10px] font-medium text-neutral-400 dark:text-neutral-500">
            <Calendar className="h-3 w-3" /> {formatDate(task.dueDate, task.dueTime)}
          </span>
        )}
        {task.subtasks.length > 0 && (
          <span className="text-[10px] font-medium text-neutral-400 dark:text-neutral-500">
            {doneCount}/{task.subtasks.length} subtasks
          </span>
        )}
        {task.storyPoints != null && (
          <span className="rounded bg-violet-50 px-1.5 py-0.5 text-[10px] font-semibold text-violet-600 dark:bg-violet-500/10 dark:text-violet-300">
            {task.storyPoints} pts
          </span>
        )}
        <span className="ml-auto hidden items-center gap-1.5 sm:flex">
          <Progress value={task.progress} className="h-1 w-20" />
          <span className="w-7 text-right text-[11px] font-semibold tabular-nums text-neutral-400 dark:text-neutral-500">{task.progress}%</span>
        </span>
      </div>

      {/* Subtasks tree */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="ml-[9px] mt-2 space-y-0.5 border-l-2 border-neutral-100 pl-2.5 dark:border-neutral-800">
              {task.subtasks.map((s) => (
                <SubtaskRow key={s.id} taskId={task.id} subtask={s} />
              ))}
              {task.subtasks.length === 0 && (
                <p className="px-1.5 py-1 text-[10px] text-neutral-400">No subtasks yet.</p>
              )}
              <form onSubmit={addSub} className="flex items-center gap-1.5 py-0.5">
                <Input
                  value={newSub}
                  onChange={(e) => setNewSub(e.target.value)}
                  placeholder="+ Add subtask…"
                  className="h-7 flex-1 rounded-md text-xs"
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
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export function TaskCheckList() {
  const getFilteredTasks = useTaskStore((s) => s.getFilteredTasks)
  const tasks = getFilteredTasks().filter((t) => !t.completed)

  if (tasks.length === 0) return <EmptyState />

  return (
    <div className="-mx-4 overflow-x-auto px-4 pb-1">
      <div className="min-w-[320px] space-y-2">
        <AnimatePresence mode="popLayout">
          {tasks.map((task, index) => (
            <CheckRow key={task.id} task={task} index={index} />
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}