"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { ListTodo, CheckCircle2, Circle, TrendingUp } from "lucide-react"
import { useTaskStore } from "@/store/use-task-store"

const statConfigs = [
  { key: "total", icon: ListTodo, label: "Total", color: "#3b82f6" },
  { key: "active", icon: Circle, label: "Active", color: "#f97316" },
  { key: "completed", icon: CheckCircle2, label: "Done", color: "#10b981" },
  { key: "progress", icon: TrendingUp, label: "Progress", color: "#a855f7" },
]

function AnimatedNumber({ value, suffix }: { value: number; suffix?: string }) {
  const [displayed, setDisplayed] = useState(0)

  useEffect(() => {
    const duration = 600
    const steps = 20
    const increment = value / steps
    let current = 0
    const timer = setInterval(() => {
      current += increment
      if (current >= value) { setDisplayed(value); clearInterval(timer) }
      else setDisplayed(Math.round(current))
    }, duration / steps)
    return () => clearInterval(timer)
  }, [value])

  return (
    <span className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">
      {displayed}{suffix}
    </span>
  )
}

export function StatsCards() {
  const { getStats } = useTaskStore()
  const stats = getStats()

  const values: Record<string, number> = {
    total: stats.total,
    active: stats.active,
    completed: stats.completed,
    progress: stats.progress,
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {statConfigs.map((config, index) => (
        <motion.div
          key={config.key}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.06, duration: 0.25 }}
          className="rounded-2xl border border-neutral-200/60 bg-white p-4 dark:border-neutral-800/60 dark:bg-neutral-900"
        >
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl" style={{ backgroundColor: `${config.color}15` }}>
              <config.icon className="h-4 w-4" style={{ color: config.color }} />
            </div>
            <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">{config.label}</span>
          </div>
          <div className="mt-2.5">
            <AnimatedNumber
              value={values[config.key] ?? 0}
              suffix={config.key === "progress" ? "%" : ""}
            />
          </div>
          {config.key === "progress" && (
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${stats.progress}%` }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="h-full rounded-full"
                style={{ backgroundColor: config.color }}
              />
            </div>
          )}
        </motion.div>
      ))}
    </div>
  )
}
