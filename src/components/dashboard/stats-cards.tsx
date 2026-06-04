"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { ListTodo, CheckCircle2, Circle, TrendingUp } from "lucide-react"
import { useTaskStore } from "@/store/use-task-store"

const statConfigs = [
  { key: "total", icon: ListTodo, label: "Total Tasks", color: "from-blue-500/10 to-blue-500/5", iconColor: "text-blue-600 dark:text-blue-400", barColor: "bg-blue-500" },
  { key: "active", icon: Circle, label: "Active Tasks", color: "from-amber-500/10 to-amber-500/5", iconColor: "text-amber-600 dark:text-amber-400", barColor: "bg-amber-500" },
  { key: "completed", icon: CheckCircle2, label: "Completed", color: "from-emerald-500/10 to-emerald-500/5", iconColor: "text-emerald-600 dark:text-emerald-400", barColor: "bg-emerald-500" },
  { key: "progress", icon: TrendingUp, label: "Overall Progress", color: "from-violet-500/10 to-violet-500/5", iconColor: "text-violet-600 dark:text-violet-400", barColor: "bg-violet-500" },
]

function AnimatedNumber({ value, label }: { value: number; label?: string }) {
  const [displayed, setDisplayed] = useState(0)

  useEffect(() => {
    const duration = 800
    const steps = 30
    const increment = value / steps
    let current = 0
    const timer = setInterval(() => {
      current += increment
      if (current >= value) {
        setDisplayed(value)
        clearInterval(timer)
      } else {
        setDisplayed(Math.round(current))
      }
    }, duration / steps)
    return () => clearInterval(timer)
  }, [value])

  return (
    <span className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">
      {displayed}{label}
    </span>
  )
}

export function StatsCards() {
  const { getStats } = useTaskStore()
  const stats = getStats()

  const values: Record<string, number | string> = {
    total: stats.total,
    active: stats.active,
    completed: stats.completed,
    progress: stats.progress,
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {statConfigs.map((config, index) => (
        <motion.div
          key={config.key}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.08, duration: 0.4, ease: "easeOut" }}
          whileHover={{ y: -4, transition: { duration: 0.2 } }}
          className="group relative overflow-hidden rounded-2xl border border-neutral-200/60 bg-white p-5 shadow-sm transition-shadow hover:shadow-md dark:border-neutral-800/60 dark:bg-neutral-950"
        >
          <div className={`absolute inset-0 bg-gradient-to-br ${config.color} opacity-50`} />
          <div className="relative z-10">
            <div className="mb-3 flex items-center justify-between">
              <div className={`rounded-xl bg-neutral-100 p-2.5 dark:bg-neutral-800 ${config.iconColor}`}>
                <config.icon className="h-5 w-5" />
              </div>
            </div>
            <div className="flex items-baseline gap-1">
              <AnimatedNumber
                value={typeof values[config.key] === "number" ? (values[config.key] as number) : 0}
                label={config.key === "progress" ? "%" : ""}
              />
            </div>
            <p className="mt-1 text-sm font-medium text-neutral-500 dark:text-neutral-400">
              {config.label}
            </p>
            {config.key === "progress" && (
              <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${stats.progress}%` }}
                  transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
                  className={`h-full rounded-full ${config.barColor}`}
                />
              </div>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  )
}
