"use client"

import { motion } from "framer-motion"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { FuturePanel } from "@/components/future/future-panel"

export default function FuturePage() {
  return (
    <DashboardShell>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <FuturePanel />
      </motion.div>
    </DashboardShell>
  )
}
