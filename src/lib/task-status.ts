import { format } from "date-fns"
import type { Task } from "@/types"

export type TaskStatusKey = "done" | "overdue" | "due-today" | "in-progress" | "todo"

export function getTaskStatus(task: Task): { key: TaskStatusKey; label: string } {
  if (task.completed) return { key: "done", label: "Done" }
  const today = format(new Date(), "yyyy-MM-dd")
  if (task.dueDate && task.dueDate < today) return { key: "overdue", label: "Overdue" }
  if (task.dueDate && task.dueDate === today) return { key: "due-today", label: "Due today" }
  if (task.progress > 0) return { key: "in-progress", label: "In progress" }
  return { key: "todo", label: "To do" }
}

export const TASK_STATUS_STYLES: Record<TaskStatusKey, string> = {
  done: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  overdue: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  "due-today": "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  "in-progress": "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  todo: "bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400",
}
