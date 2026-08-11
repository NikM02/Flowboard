"use client"

import { useEffect, useState, useMemo } from "react"
import { motion } from "framer-motion"
import { ListTodo, CheckCircle2, Circle, TrendingUp } from "lucide-react"
import { useTaskStore } from "@/store/use-task-store"
import { Sparkline, RadialGauge, GradientIconTile } from "@/components/charts/chart-components"

const statConfigs = [
  { key: "total", icon: ListTodo, label: "Total", color: "#1da1f2", gauge: ["#1da1f2", "#0e8be0"] },
  { key: "active", icon: Circle, label: "Active", color: "#fb923c", gauge: ["#fb923c", "#ea580c"] },
  { key: "completed", icon: CheckCircle2, label: "Done", color: "#34d399", gauge: ["#34d399", "#059669"] },
  { key: "progress", icon: TrendingUp, label: "Progress", color: "#2f6ee0", gauge: ["#1da1f2", "#0e8be0"] },
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
    <span className="text-[26px] font-black tracking-tight text-neutral-900 tabular-nums dark:text-neutral-50">
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
            className="card-modern card-hover glass relative overflow-hidden rounded-2xl p-4"
          >
            <div
              className="glow-blob -right-8 -top-8 h-24 w-24 animate-pulse-glow"
              style={{ background: `radial-gradient(circle, ${config.color}26, transparent 70%)` }}
            />
            <div className="relative flex items-center justify-between">
              <GradientIconTile icon={config.icon} color={config.color} />
              <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                {config.label}
              </span>
            </div>

            <div className="relative mt-3 flex items-end justify-between gap-2">
              <div className="min-w-0">
                <AnimatedNumber
                  value={values[config.key] ?? 0}
                  suffix={isProgress ? "%" : ""}
                />
                {!isProgress && (
                  <Sparkline data={trend} color={config.color} width={72} height={24} className="mt-1.5 opacity-80" />
                )}
              </div>
              {isProgress && (
                <RadialGauge
                  value={stats.progress}
                  size={76}
                  stroke={8}
                  color={config.gauge as [string, string]}
                  sublabel="done"
                  className="shrink-0"
                />
              )}
            </div>

            {isProgress && (
              <div className="relative mt-3 h-1.5 w-full overflow-hidden rounded-full bg-neutral-200/70 dark:bg-neutral-800">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${stats.progress}%` }}
                  transition={{ duration: 0.8, delay: 0.3 }}
                  className="h-full rounded-full"
                  style={{
                    background: `linear-gradient(90deg, ${config.gauge[0]}, ${config.gauge[1]})`,
                    boxShadow: `0 0 8px ${config.color}88`,
                  }}
                />
              </div>
            )}
          </motion.div>
        )
      })}
    </div>
  )
}
