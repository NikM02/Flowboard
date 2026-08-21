"use client"

import { motion } from "framer-motion"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { HabitTrackerSection } from "@/components/habits/habit-tracker-section"

export default function HabitsPage() {
  return (
    <DashboardShell>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <HabitTrackerSection />
      </motion.div>
    </DashboardShell>
  )
}
