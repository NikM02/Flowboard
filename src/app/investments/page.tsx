"use client"

import { motion } from "framer-motion"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { InvestmentsPanel } from "@/components/finance/investments-panel"

export default function InvestmentsPage() {
  return (
    <DashboardShell>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <InvestmentsPanel />
      </motion.div>
    </DashboardShell>
  )
}
