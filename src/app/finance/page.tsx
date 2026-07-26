"use client"

import { motion } from "framer-motion"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { FinancePanel } from "@/components/finance/finance-panel"

export default function FinancePage() {
  return (
    <DashboardShell>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <FinancePanel />
      </motion.div>
    </DashboardShell>
  )
}
