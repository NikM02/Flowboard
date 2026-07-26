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
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">
            Health
          </h1>
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
            Track habits, challenges, and daily wellness
          </p>
        </div>
        <HabitTrackerSection />
      </motion.div>
    </DashboardShell>
  )
}
