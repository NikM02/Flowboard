"use client"

import { motion } from "framer-motion"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { NetworthPanel } from "@/components/finance/networth-panel"

export default function NetworthPage() {
  return (
    <DashboardShell>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <NetworthPanel />
      </motion.div>
    </DashboardShell>
  )
}
