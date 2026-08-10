"use client"

import { useMemo } from "react"
import {
  PieChart, Pie, Cell, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend,
  AreaChart, Area, CartesianGrid,
} from "recharts"
import { useTaskStore } from "@/store/use-task-store"
import {
  ChartTooltip, ChartLegend, ChartCard, ChartGradients, ChartGlow,
  CHART_GRID_STYLES, CHART_AXIS_STYLES, CHART_CURSOR_STYLES,
  CHART_PALETTE,
} from "@/components/charts/chart-components"

export function TaskCharts() {
  const tasks = useTaskStore((s) => s.tasks)

  const statusData = useMemo(() => {
    const total = tasks.length
    const completed = tasks.filter((t) => t.completed).length
    const active = total - completed
    return [
      { name: "Active", value: active, color: "#fb923c" },
      { name: "Completed", value: completed, color: "#34d399" },
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
      fill: CHART_PALETTE[i % CHART_PALETTE.length],
    }))
  }, [tasks])

  const priorityData = useMemo(() => {
    const pp: Record<string, number> = {}
    for (const t of tasks) pp[t.priority] = (pp[t.priority] || 0) + 1
    return [
      { name: "High", count: pp.high || 0, color: "#f87171" },
      { name: "Medium", count: pp.medium || 0, color: "#fb923c" },
      { name: "Low", count: pp.low || 0, color: "#60a5fa" },
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

  const totalTasks = statusData.reduce((s, d) => s + d.value, 0)

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {/* Status Donut */}
      {statusData.length > 0 && (
        <ChartCard title="Status Breakdown" subtitle={`${totalTasks} total tasks`} delay={0}>
          <div className="relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height={210}>
              <PieChart>
                <ChartGlow id="tc-status-glow" />
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={58}
                  outerRadius={86}
                  paddingAngle={5}
                  cornerRadius={8}
                  dataKey="value"
                  stroke="none"
                >
                  {statusData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} style={{ filter: "url(#tc-status-glow)" }} />
                  ))}
                </Pie>
                <Tooltip content={<ChartTooltip formatter={(v) => String(v)} />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-black tracking-tight text-neutral-900 dark:text-neutral-50">
                {totalTasks}
              </span>
              <span className="text-[9px] font-bold uppercase tracking-widest text-neutral-400 dark:text-neutral-500">
                tasks
              </span>
            </div>
          </div>
        </ChartCard>
      )}

      {/* Priority Bars */}
      <ChartCard title="Priority Distribution" subtitle="Workload by urgency" delay={60}>
        <ResponsiveContainer width="100%" height={210}>
          <BarChart data={priorityData} barSize={38} barGap={6}>
            <ChartGradients ids={["tc-pri-0", "tc-pri-1", "tc-pri-2"]} />
            <XAxis dataKey="name" {...CHART_AXIS_STYLES} />
            <YAxis {...CHART_AXIS_STYLES} allowDecimals={false} />
            <Tooltip content={<ChartTooltip formatter={(v) => `${v} tasks`} />} cursor={CHART_CURSOR_STYLES} />
            <Bar dataKey="count" radius={[10, 10, 3, 3]}>
              {priorityData.map((entry, i) => (
                <Cell key={i} fill={`url(#tc-pri-${i})`} style={{ filter: `drop-shadow(0 4px 8px ${entry.color}33)` }} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Project Progress */}
      {projectData.length > 0 && (
        <ChartCard title="Project Progress" subtitle="Average completion by project" delay={120}>
          <ResponsiveContainer width="100%" height={210}>
            <BarChart data={projectData} barSize={16} layout="vertical">
              <ChartGradients ids={["tc-proj-0"]} />
              <XAxis type="number" domain={[0, 100]} {...CHART_AXIS_STYLES} />
              <YAxis type="category" dataKey="name" {...CHART_AXIS_STYLES} width={80} />
              <Tooltip content={<ChartTooltip formatter={(v) => `${v}%`} />} cursor={CHART_CURSOR_STYLES} />
              <Bar dataKey="avgProgress" radius={[0, 9, 9, 0]} fill="url(#tc-proj-0)" barSize={16} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      )}

      {/* Timeline Area */}
      {timelineData.length > 1 && (
        <div className="sm:col-span-2 lg:col-span-3">
          <ChartCard title="Task Timeline" subtitle="Cumulative workload over time" delay={180}>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={timelineData}>
                <ChartGradients ids={["tc-area-total", "tc-area-done"]} />
                <CartesianGrid {...CHART_GRID_STYLES} />
                <XAxis dataKey="date" {...CHART_AXIS_STYLES} />
                <YAxis {...CHART_AXIS_STYLES} allowDecimals={false} />
                <Tooltip content={<ChartTooltip />} />
                <Legend content={<ChartLegend />} />
                <Area
                  type="monotone"
                  dataKey="total"
                  stroke="#60a5fa"
                  strokeWidth={2.5}
                  fill="url(#tc-area-total)"
                  name="Total Tasks"
                  dot={false}
                  activeDot={{ r: 5, strokeWidth: 0, fill: "#60a5fa" }}
                  style={{ filter: "drop-shadow(0 0 6px #60a5fa55)" }}
                />
                <Area
                  type="monotone"
                  dataKey="completed"
                  stroke="#34d399"
                  strokeWidth={2.5}
                  fill="url(#tc-area-done)"
                  name="Completed"
                  dot={false}
                  activeDot={{ r: 5, strokeWidth: 0, fill: "#34d399" }}
                  style={{ filter: "drop-shadow(0 0 6px #34d39955)" }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      )}
    </div>
  )
}
