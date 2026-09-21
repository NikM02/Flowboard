"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Map, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRoadmapStore } from "@/store/use-roadmap-store"
import { CreateRoadmapDialog } from "./roadmap-dialogs"
import { RoadmapCard } from "./roadmap-card"
import { RoadmapDetail } from "./roadmap-detail"
import { RoadmapPhaseView } from "./roadmap-phase-view"

type View =
  | { mode: "list" }
  | { mode: "roadmap"; roadmapId: string }
  | { mode: "phase"; roadmapId: string; phaseId: string }

export function RoadmapPanel() {
  const roadmaps = useRoadmapStore((s) => s.roadmaps)
  const [createOpen, setCreateOpen] = useState(false)
  const [view, setView] = useState<View>({ mode: "list" })

  if (view.mode === "roadmap") {
    const roadmap = roadmaps.find((r) => r.id === view.roadmapId)
    if (!roadmap) return <Fallback onBack={() => setView({ mode: "list" })} />
    return (
      <RoadmapDetail
        roadmap={roadmap}
        onBack={() => setView({ mode: "list" })}
        onOpenPhase={(phaseId) => setView({ mode: "phase", roadmapId: roadmap.id, phaseId })}
      />
    )
  }

  if (view.mode === "phase") {
    const roadmap = roadmaps.find((r) => r.id === view.roadmapId)
    if (!roadmap) return <Fallback onBack={() => setView({ mode: "list" })} />
    const phase = roadmap.phases.find((p) => p.id === view.phaseId)
    if (!phase) return <Fallback onBack={() => setView({ mode: "roadmap", roadmapId: roadmap.id })} />
    return (
      <RoadmapPhaseView
        roadmap={roadmap}
        phase={phase}
        onBack={() => setView({ mode: "roadmap", roadmapId: roadmap.id })}
        onOpenPhase={(phaseId) => setView({ mode: "phase", roadmapId: roadmap.id, phaseId })}
      />
    )
  }

  const totalPhases = roadmaps.reduce((n, r) => n + r.phases.length, 0)
  const donePhases = roadmaps.reduce((n, r) => n + r.phases.filter((p) => p.status === "completed").length, 0)
  const inProgress = roadmaps.reduce((n, r) => n + r.phases.filter((p) => p.status === "in-progress").length, 0)
  const blocked = roadmaps.reduce((n, r) => n + r.phases.filter((p) => p.status === "blocked").length, 0)

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Button onClick={() => setCreateOpen(true)} className="gap-2 self-start">
          <Plus className="h-4 w-4" />
          New Roadmap
        </Button>
        {roadmaps.length > 0 && (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
            <Stat label="roadmaps" value={roadmaps.length} />
            <Stat label="milestones" value={totalPhases} />
            {inProgress > 0 && <Stat label="in progress" value={inProgress} className="text-blue-500" />}
            {blocked > 0 && <Stat label="blocked" value={blocked} className="text-rose-500" />}
            <Stat label="done" value={donePhases} className={donePhases > 0 ? "text-emerald-600 dark:text-emerald-400" : ""} />
          </div>
        )}
      </div>

      {roadmaps.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-neutral-200 py-20 dark:border-neutral-800"
        >
          <Map className="mb-4 h-12 w-12 text-neutral-300 dark:text-neutral-600" />
          <p className="text-lg font-medium text-neutral-500 dark:text-neutral-400">No roadmaps yet</p>
          <p className="mt-1 max-w-sm text-center text-sm text-neutral-400 dark:text-neutral-500">
            Plan big goals, set a type and priority, then break them into tracked milestones with status, dates, and tasks.
          </p>
          <Button onClick={() => setCreateOpen(true)} variant="outline" className="mt-4 gap-2">
            <Plus className="h-4 w-4" />
            Create your first roadmap
          </Button>
        </motion.div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          <AnimatePresence mode="popLayout">
            {roadmaps.map((r) => (
              <RoadmapCard key={r.id} roadmap={r} onOpen={() => setView({ mode: "roadmap", roadmapId: r.id })} />
            ))}
          </AnimatePresence>
        </div>
      )}

      <CreateRoadmapDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  )
}

function Stat({ label, value, className }: { label: string; value: number; className?: string }) {
  return (
    <span className="flex items-center gap-1">
      <span className={className ?? "text-neutral-900 dark:text-white"}>{value}</span>
      <span className="text-neutral-400">{label}</span>
    </span>
  )
}

function Fallback({ onBack }: { onBack: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-neutral-200 py-20 dark:border-neutral-800">
      <p className="text-sm text-neutral-400">This roadmap no longer exists.</p>
      <Button variant="outline" size="sm" className="mt-4" onClick={onBack}>Go back</Button>
    </div>
  )
}