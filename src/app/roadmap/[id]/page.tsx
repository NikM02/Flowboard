"use client"

import { useParams } from "next/navigation"
import { motion } from "framer-motion"
import { Map, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { useRoadmapStore } from "@/store/use-roadmap-store"
import { RoadmapDashboard } from "@/components/roadmap/roadmap-dashboard"

export default function RoadmapDetailPage() {
  const params = useParams<{ id: string }>()
  const roadmap = useRoadmapStore((s) => s.roadmaps.find((r) => r.id === params.id))

  return (
    <DashboardShell>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        {roadmap ? (
          <RoadmapDashboard roadmap={roadmap} />
        ) : (
          <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-neutral-200 py-20 dark:border-neutral-800">
            <Map className="mb-4 h-12 w-12 text-neutral-300 dark:text-neutral-600" />
            <p className="text-lg font-medium text-neutral-500 dark:text-neutral-400">Roadmap not found</p>
            <p className="mt-1 text-sm text-neutral-400 dark:text-neutral-500">It may have been deleted.</p>
            <Button variant="outline" className="mt-4 gap-2" onClick={() => (window.location.href = "/roadmap")}>
              <Plus className="h-4 w-4" /> Go to roadmaps
            </Button>
          </div>
        )}
      </motion.div>
    </DashboardShell>
  )
}