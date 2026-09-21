"use client"

import { motion } from "framer-motion"
import { Pencil, Trash2, Target, CalendarDays } from "lucide-react"
import { useState } from "react"
import { cn } from "@/lib/shadcn-utils"
import { formatShortDate, CATEGORY_META, PRIORITY_META, HEALTH_META } from "./roadmap-meta"
import { getRoadmapHealth, useRoadmapStore } from "@/store/use-roadmap-store"
import { EditRoadmapDialog } from "./roadmap-dialogs"
import type { Roadmap } from "@/types"

export function RoadmapCard({ roadmap, onOpen }: { roadmap: Roadmap; onOpen: () => void }) {
  const [editOpen, setEditOpen] = useState(false)
  const deleteRoadmap = useRoadmapStore((s) => s.deleteRoadmap)
  const donePhases = roadmap.phases.filter((p) => p.status === "completed").length
  const blocked = roadmap.phases.filter((p) => p.status === "blocked").length
  const inProgress = roadmap.phases.filter((p) => p.status === "in-progress").length
  const totalTasks = roadmap.phases.reduce((n, p) => n + p.tasks.length, 0)
  const doneTasks = roadmap.phases.reduce((n, p) => n + p.tasks.filter((t) => t.completed).length, 0)
  const pct = roadmap.phases.length ? Math.round((donePhases / roadmap.phases.length) * 100) : 0
  const health = getRoadmapHealth(roadmap)
  const healthMeta = HEALTH_META[health]
  const nextPhase = roadmap.phases.find((p) => p.status !== "completed" && p.status !== "blocked") ?? roadmap.phases.find((p) => p.status === "blocked")

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="group relative overflow-hidden rounded-2xl border border-neutral-200 bg-white p-5 transition-all hover:-translate-y-0.5 hover:border-neutral-300 hover:shadow-lg hover:shadow-neutral-200/50 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-neutral-700 dark:hover:shadow-black/30"
    >
      <button onClick={onOpen} className="absolute inset-0 z-0" aria-label={`Open ${roadmap.title}`} />

      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-neutral-100 text-2xl dark:bg-neutral-800">{roadmap.emoji}</div>
          <div className="min-w-0">
            <h3 className="truncate font-semibold text-neutral-900 dark:text-neutral-50">{roadmap.title}</h3>
            <div className="mt-1 flex flex-wrap items-center gap-1.5">
              <span className={cn("rounded-md px-1.5 py-0.5 text-[10px] font-semibold", PRIORITY_META[roadmap.priority].badge)}>{PRIORITY_META[roadmap.priority].label}</span>
              <span className="rounded-md bg-neutral-100 px-1.5 py-0.5 text-[10px] font-medium text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400">{CATEGORY_META[roadmap.category].label}</span>
              <span className={cn("rounded-md px-1.5 py-0.5 text-[10px] font-semibold", healthMeta.badge)}>{healthMeta.label}</span>
            </div>
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-1 opacity-0 transition-all group-hover:opacity-100 max-sm:opacity-100">
          <button onClick={() => setEditOpen(true)} className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 dark:hover:bg-neutral-800 dark:hover:text-neutral-300">
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button onClick={() => { if (confirm(`Delete "${roadmap.title}" and all its milestones?`)) deleteRoadmap(roadmap.id) }} className="rounded-lg p-1.5 text-neutral-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/50">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {nextPhase && (
        <p className="mt-3 truncate text-xs text-neutral-500 dark:text-neutral-400">
          <span className="font-semibold text-neutral-700 dark:text-neutral-200">Next:</span> {nextPhase.title}
        </p>
      )}
      {roadmap.target && (
        <p className="mt-1.5 flex items-center gap-1.5 truncate text-xs text-neutral-400 dark:text-neutral-500">
          <Target className="h-3.5 w-3.5 shrink-0" /> {roadmap.target}
          {roadmap.deadline && <span className="flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" /> by {formatShortDate(roadmap.deadline)}</span>}
        </p>
      )}

      <div className="mt-4">
        <div className="flex items-center justify-between text-[11px] font-medium text-neutral-400">
          <span>{donePhases}/{roadmap.phases.length || 0} milestones done</span>
          <span>{pct}%</span>
        </div>
        <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
          <div className="h-full rounded-full bg-neutral-900 transition-all dark:bg-white" style={{ width: `${pct}%` }} />
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {inProgress > 0 && <span className="rounded-md border border-blue-200 bg-blue-50 px-1.5 py-0.5 text-[10px] font-medium text-blue-600 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-300">{inProgress} in progress</span>}
        {blocked > 0 && <span className="rounded-md border border-rose-200 bg-rose-50 px-1.5 py-0.5 text-[10px] font-medium text-rose-600 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">{blocked} blocked</span>}
        {totalTasks > 0 && (
          <span className="rounded-md border border-neutral-200 bg-neutral-50 px-1.5 py-0.5 text-[10px] font-medium text-neutral-500 dark:border-neutral-800 dark:bg-neutral-800 dark:text-neutral-400">{doneTasks}/{totalTasks} tasks</span>
        )}
      </div>

      <EditRoadmapDialog roadmap={roadmap} open={editOpen} onOpenChange={setEditOpen} />
    </motion.div>
  )
}