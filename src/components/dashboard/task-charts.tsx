"use client"

import { useMemo } from "react"
import { motion } from "framer-motion"
import {
  PieChart, Pie, Cell, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend,
  AreaChart, Area, CartesianGrid,
} from "recharts"
import { useTaskStore } from "@/store/use-task-store"
import { ChartTooltip, ChartLegend } from "@/components/charts/chart-components"

const COLORS = ["#3b82f6", "#10b981", "#f97316", "#a855f7", "#ef4444", "#06b6d4", "#eab308", "#ec4899"]

function ChartCard({ title, children, delay = 0 }: { title: string; children: React.ReactNode; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
      className="rounded-2xl border border-neutral-200/60 bg-white p-4 sm:p-5 dark:border-neutral-800/60 dark:bg-neutral-900"
    >
      <h3 className="mb-4 text-sm font-semibold text-neutral-700 dark:text-neutral-300">{title}</h3>
      {children}
    </motion.div>
  )
}

export function TaskCharts() {
  const tasks = useTaskStore((s) => s.tasks)

  const statusData = useMemo(() => {
    const total = tasks.length
    const completed = tasks.filter((t) => t.completed).length
    const active = total - completed
    return [
      { name: "Active", value: active, color: "#f97316" },
      { name: "Completed", value: completed, color: "#10b981" },
    ].filter((d) => d.value > 0)
  }, [tasks])

  const projectData = useMemo(() => {
    const stats: Record<string, { total: number; completed: number; active: number; avgProgress: number }> = {}
    for (const task of tasks) {
      const p = task.project || "Uncategorized"
      if (!stats[p]) stats[p] = { total: 0, completed: 0, active: 0, avgProgress: 0 }
      stats[p].total++
      if (task.completed) stats[p].completed++
      else stats[p].active++
    }
    for (const key of Object.keys(stats)) {
      const projectTasks = tasks.filter((t) => (t.project || "Uncategorized") === key)
      stats[key].avgProgress = projectTasks.length > 0
        ? Math.round(projectTasks.reduce((sum, t) => sum + t.progress, 0) / projectTasks.length)
        : 0
    }
    return Object.entries(stats).map(([name, s], i) => ({
      name: name.length > 12 ? name.slice(0, 12) + "..." : name,
      fullName: name,
      total: s.total,
      completed: s.completed,
      active: s.active,
      avgProgress: s.avgProgress,
      fill: COLORS[i % COLORS.length],
    }))
  }, [tasks])

  const priorityData = useMemo(() => {
    const pp: Record<string, number> = {}
    for (const t of tasks) pp[t.priority] = (pp[t.priority] || 0) + 1
    return [
      { name: "High", count: pp.high || 0, color: "#ef4444" },
      { name: "Medium", count: pp.medium || 0, color: "#f97316" },
      { name: "Low", count: pp.low || 0, color: "#3b82f6" },
    ]
  }, [tasks])

  const timelineData = useMemo(() => {
    const sorted = [...tasks].sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    const dateMap: Record<string, { total: number; completed: number }> = {}
    for (const t of sorted) {
      const d = t.dueDate
      if (!dateMap[d]) dateMap[d] = { total: 0, completed: 0 }
      dateMap[d].total++
      if (t.completed) dateMap[d].completed++
    }
    let cumulative = 0
    return Object.entries(dateMap).slice(0, 10).map(([date, v]) => {
      cumulative += v.total
      return {
        date: date.slice(5),
        total: cumulative,
        completed: v.completed,
      }
    })
  }, [tasks])

  if (tasks.length === 0) return null

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {/* Status Pie */}
      {statusData.length > 0 && (
        <ChartCard title="Status Breakdown" delay={0}>
          <div className="flex items-center justify-center">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <defs>
                  <filter id="shadowPie" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.15" />
                  </filter>
                </defs>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                  stroke="none"
                  filter="url(#shadowPie)"
                >
                  {statusData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} fillOpacity={0.9} />
                  ))}
                </Pie>
                <Tooltip content={<ChartTooltip formatter={(v) => String(v)} />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 flex justify-center gap-5">
            {statusData.map((d) => (
              <div key={d.name} className="flex items-center gap-1.5 text-xs text-neutral-600 dark:text-neutral-400">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                {d.name}: <span className="font-semibold">{d.value}</span>
              </div>
            ))}
          </div>
        </ChartCard>
      )}

      {/* Priority Bar */}
      <ChartCard title="Priority Distribution" delay={0.05}>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={priorityData} barSize={36} barGap={4}>
            <defs>
              {priorityData.map((entry, i) => (
                <linearGradient key={i} id={`priorityGrad${i}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={entry.color} stopOpacity={0.95} />
                  <stop offset="100%" stopColor={entry.color} stopOpacity={0.55} />
                </linearGradient>
              ))}
            </defs>
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#a3a3a3" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: "#a3a3a3" }} axisLine={false} tickLine={false} allowDecimals={false} />
            <Tooltip content={<ChartTooltip formatter={(v) => `${v} tasks`} />} cursor={{ fill: "rgba(0,0,0,0.03)" }} />
            <Bar dataKey="count" radius={[8, 8, 0, 0]}>
              {priorityData.map((entry, i) => (
                <Cell key={i} fill={`url(#priorityGrad${i})`} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Project Progress */}
      {projectData.length > 0 && (
        <ChartCard title="Project Progress" delay={0.1}>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={projectData} barSize={20} layout="vertical">
              <defs>
                <linearGradient id="projectGrad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.6} />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity={1} />
                </linearGradient>
              </defs>
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11, fill: "#a3a3a3" }} axisLine={false} tickLine={false} />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fontSize: 10, fill: "#a3a3a3" }}
                axisLine={false}
                tickLine={false}
                width={80}
              />
              <Tooltip content={<ChartTooltip formatter={(v) => `${v}%`} />} cursor={{ fill: "rgba(0,0,0,0.03)" }} />
              <Bar dataKey="avgProgress" radius={[0, 8, 8, 0]} fill="url(#projectGrad)" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      )}

      {/* Timeline Area Chart */}
      {timelineData.length > 1 && (
        <div className="sm:col-span-2 lg:col-span-3">
          <ChartCard title="Task Timeline" delay={0.15}>
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={timelineData}>
                <defs>
                  <linearGradient id="gradTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradCompleted" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <filter id="areaShadow">
                    <feDropShadow dx="0" dy="1" stdDeviation="1" floodOpacity="0.1" />
                  </filter>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" strokeOpacity={0.3} vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#a3a3a3" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#a3a3a3" }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<ChartTooltip />} />
                <Legend content={<ChartLegend />} />
                <Area
                  type="monotone"
                  dataKey="total"
                  stroke="#3b82f6"
                  fill="url(#gradTotal)"
                  strokeWidth={2.5}
                  name="Total Tasks"
                  filter="url(#areaShadow)"
                />
                <Area
                  type="monotone"
                  dataKey="completed"
                  stroke="#10b981"
                  fill="url(#gradCompleted)"
                  strokeWidth={2.5}
                  name="Completed"
                  filter="url(#areaShadow)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      )}
    </div>
  )
}
