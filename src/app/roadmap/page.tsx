"use client"

import { motion } from "framer-motion"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { RoadmapPanel } from "@/components/roadmap/roadmap-panel"

export default function RoadmapPage() {
  return (
    <DashboardShell>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <RoadmapPanel />
      </motion.div>
    </DashboardShell>
  )
}