"use client"

import { useEffect, useState, useMemo } from "react"
import { motion } from "framer-motion"
import { ListTodo, CheckCircle2, Circle, TrendingUp } from "lucide-react"
import { useTaskStore } from "@/store/use-task-store"
import { Sparkline, RadialGauge } from "@/components/charts/chart-components"

const statConfigs = [
  { key: "total", icon: ListTodo, label: "Total", color: "#0066cc", gauge: ["#0066cc", "#2b8bf7"] },
  { key: "active", icon: Circle, label: "Active", color: "#2b8bf7", gauge: ["#2b8bf7", "#5a9eff"] },
  { key: "completed", icon: CheckCircle2, label: "Done", color: "#34c759", gauge: ["#34c759", "#45c86f"] },
  { key: "progress", icon: TrendingUp, label: "Progress", color: "#0066cc", gauge: ["#0066cc", "#2b8bf7"] },
]

function AnimatedNumber({ value, suffix }: { value: number; suffix?: string }) {
  const [displayed, setDisplayed] = useState(0)

  useEffect(() => {
    const duration = 650
    const steps = 24
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
    <span className="text-[26px] font-black tracking-tight text-neutral-900 tabular-nums dark:text-white">
      {displayed}{suffix}
    </span>
  )
}

export function StatsCards() {
  const { getStats } = useTaskStore()
  const tasks = useTaskStore((s) => s.tasks)
  const stats = getStats()

  const trend = useMemo(() => {
    const days = 7
    const buckets = new Array(days).fill(0)
    const now = Date.now()
    const dayMs = 86400000
    for (const t of tasks) {
      const age = Math.floor((now - (t.createdAt || now)) / dayMs)
      if (age >= 0 && age < days) buckets[days - 1 - age]++
    }
    return buckets
  }, [tasks])

  const values: Record<string, number> = {
    total: stats.total,
    active: stats.active,
    completed: stats.completed,
    progress: stats.progress,
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
      {statConfigs.map((config, index) => {
        const isProgress = config.key === "progress"
        return (
          <motion.div
            key={config.key}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.07, duration: 0.3 }}
            whileHover={{ y: -3 }}
            className="relative overflow-hidden rounded-[18px] border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
          >
            <div className="relative flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">{config.label}</p>
                <AnimatedNumber
                  value={values[config.key]}
                  suffix={isProgress ? "%" : undefined}
                />
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-[10px]" style={{ backgroundColor: `${config.color}1a` }}>
                <config.icon className="h-4 w-4" style={{ color: config.color }} />
              </div>
            </div>
            <div className="mt-2">
              {isProgress ? (
                <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
                  <motion.div
                    className="absolute inset-y-0 left-0 rounded-full"
                    style={{ background: config.color }}
                    initial={{ width: 0 }}
                    animate={{ width: `${stats.progress}%` }}
                    transition={{ duration: 1, delay: 0.3 }}
                  />
                </div>
              ) : (
                <Sparkline
                  data={trend}
                  height={32}
                  color={config.color}
                />
              )}
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}
