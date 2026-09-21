import { Circle, PenTool, Play, Pause, Ban, CheckCircle2 } from "lucide-react"
import type { PhaseStatus, RoadmapPriority, RoadmapCategory } from "@/types"

export const STATUS_META: Record<
  PhaseStatus,
  { label: string; icon: any; badge: string; dot: string; soft: string }
> = {
  "not-started": {
    label: "Not started",
    icon: Circle,
    badge: "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300",
    dot: "bg-neutral-300 dark:bg-neutral-600",
    soft: "text-neutral-400",
  },
  planning: {
    label: "Planning",
    icon: PenTool,
    badge: "bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300",
    dot: "bg-violet-500",
    soft: "text-violet-400",
  },
  "in-progress": {
    label: "In progress",
    icon: Play,
    badge: "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300",
    dot: "bg-blue-500",
    soft: "text-blue-500",
  },
  "on-hold": {
    label: "On hold",
    icon: Pause,
    badge: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
    dot: "bg-amber-500",
    soft: "text-amber-500",
  },
  blocked: {
    label: "Blocked",
    icon: Ban,
    badge: "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300",
    dot: "bg-rose-500",
    soft: "text-rose-500",
  },
  completed: {
    label: "Completed",
    icon: CheckCircle2,
    badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
    dot: "bg-emerald-500",
    soft: "text-emerald-500",
  },
}

export const STATUS_LIST: PhaseStatus[] = Object.keys(STATUS_META) as PhaseStatus[]

export const PRIORITY_META: Record<RoadmapPriority, { label: string; badge: string }> = {
  low: { label: "Low", badge: "bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400" },
  medium: { label: "Medium", badge: "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-300" },
  high: { label: "High", badge: "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-300" },
  urgent: { label: "Urgent", badge: "bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-300" },
}

export const PRIORITY_LIST: RoadmapPriority[] = ["low", "medium", "high", "urgent"]

export const CATEGORY_META: Record<RoadmapCategory, { label: string }> = {
  content: { label: "Content Creator" },
  business: { label: "Business" },
  career: { label: "Career" },
  learning: { label: "Learning" },
  financial: { label: "Finance" },
  personal: { label: "Personal" },
  product: { label: "Product" },
  health: { label: "Health" },
}

export const CATEGORY_LIST = Object.keys(CATEGORY_META) as RoadmapCategory[]

export const HEALTH_META = {
  draft: { label: "Draft", badge: "bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400" },
  "on-track": { label: "On track", badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300" },
  "at-risk": { label: "At risk", badge: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300" },
  blocked: { label: "Blocked", badge: "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300" },
  overdue: { label: "Overdue", badge: "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300" },
  completed: { label: "Completed", badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300" },
} as const

export function formatShortDate(iso?: string): string | null {
  if (!iso) return null
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return null
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" })
}