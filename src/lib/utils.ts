import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Date.now().toString(36)
}

export function calculateProgress(subtasks: { completed: boolean }[]): number {
  if (subtasks.length === 0) return 0
  const completed = subtasks.filter((s) => s.completed).length
  return Math.round((completed / subtasks.length) * 100)
}

export function isAllSubtasksComplete(subtasks: { completed: boolean }[]): boolean {
  return subtasks.length > 0 && subtasks.every((s) => s.completed)
}

export function formatDate(date: string): string {
  if (!date) return "No date"
  const d = new Date(date)
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}
