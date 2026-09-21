"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useRouter } from "next/navigation"
import { Map, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRoadmapStore } from "@/store/use-roadmap-store"
import { CreateRoadmapDialog } from "./roadmap-wizard"
import { RoadmapCard } from "./roadmap-card"

export function RoadmapPanel() {
  const router = useRouter()
  const roadmaps = useRoadmapStore((s) => s.roadmaps)
  const [createOpen, setCreateOpen] = useState(false)

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
          <p className="mt-1 max-w-md text-center text-sm text-neutral-400 dark:text-neutral-500">
            Use the Roadmap Builder — tell it your end goal and milestones, and it generates a full roadmap with dates, briefs, and tasks.
          </p>
          <Button onClick={() => setCreateOpen(true)} variant="outline" className="mt-4 gap-2">
            <Plus className="h-4 w-4" />
            Build your first roadmap
          </Button>
        </motion.div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          <AnimatePresence mode="popLayout">
            {roadmaps.map((r) => (
              <RoadmapCard key={r.id} roadmap={r} onOpen={() => router.push(`/roadmap/${r.id}`)} />
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