"use client"

import { useMemo } from "react"
import { motion } from "framer-motion"
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, CartesianGrid,
} from "recharts"
import { useTaskStore } from "@/store/use-task-store"
import { format, subDays } from "date-fns"

const COLORS = ["#262626", "#525252", "#737373", "#a3a3a3", "#d4d4d4"]

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-[10px] border border-neutral-200 bg-white px-3 py-2 text-xs shadow-lg dark:border-neutral-800 dark:bg-neutral-900">
      {label && <p className="mb-1 font-medium text-neutral-900 dark:text-white">{label}</p>}
      {payload.map((entry: any, i: number) => (
        <p key={i} className="text-neutral-600 dark:text-neutral-400">
          {entry.name}: <span className="font-semibold text-neutral-900 dark:text-white">{entry.value}</span>
        </p>
      ))}
    </div>
  )
}

export function TaskCompletionChart() {
  const tasks = useTaskStore((s) => s.tasks)

  const data = useMemo(() => {
    const days = 14
    return Array.from({ length: days }, (_, i) => {
      const date = subDays(new Date(), days - 1 - i)
      const dayStart = date.setHours(0, 0, 0, 0)
      const dayEnd = date.setHours(23, 59, 59, 999)
      return {
        date: format(date, "MMM d"),
        completed: tasks.filter((t) => {
          const c = t.completedAt || t.updatedAt
          return t.status === "completed" && c >= dayStart && c <= dayEnd
        }).length,
        created: tasks.filter((t) => {
          const c = t.createdAt
          return c >= dayStart && c <= dayEnd
        }).length,
      }
    })
  }, [tasks])

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="rounded-[14px] border border-neutral-200/50 bg-white p-5 shadow-sm dark:border-neutral-800/50 dark:bg-neutral-900"
    >
      <h3 className="mb-4 text-sm font-bold tracking-tight text-neutral-900 dark:text-white">Task Activity</h3>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="completedGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#262626" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#262626" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="createdGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#737373" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#737373" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10, fill: "#a3a3a3" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 10, fill: "#a3a3a3" }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<ChartTooltip />} />
          <Area
            type="monotone"
            dataKey="completed"
            stroke="#262626"
            strokeWidth={2}
            fill="url(#completedGrad)"
            name="Completed"
          />
          <Area
            type="monotone"
            dataKey="created"
            stroke="#737373"
            strokeWidth={1.5}
            strokeDasharray="4 4"
            fill="url(#createdGrad)"
            name="Created"
          />
        </AreaChart>
      </ResponsiveContainer>
    </motion.div>
  )
}

export function CategoryPieChart() {
  const tasks = useTaskStore((s) => s.tasks)

  const data = useMemo(() => {
    const counts: Record<string, number> = {}
    tasks.forEach((t) => {
      const cat = t.category || "Uncategorized"
      counts[cat] = (counts[cat] || 0) + 1
    })
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
  }, [tasks])

  if (!data.length) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="rounded-[14px] border border-neutral-200/50 bg-white p-5 shadow-sm dark:border-neutral-800/50 dark:bg-neutral-900"
    >
      <h3 className="mb-4 text-sm font-bold tracking-tight text-neutral-900 dark:text-white">Categories</h3>
      <div className="flex items-center gap-4">
        <ResponsiveContainer width={120} height={120}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={32}
              outerRadius={52}
              paddingAngle={3}
              dataKey="value"
              strokeWidth={0}
            >
              {data.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="flex flex-col gap-1.5">
          {data.slice(0, 4).map((item, i) => (
            <div key={item.name} className="flex items-center gap-2">
              <div className="h-2.5 w-2.5 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
              <span className="text-xs text-neutral-600 dark:text-neutral-400">{item.name}</span>
              <span className="text-xs font-semibold text-neutral-900 dark:text-white">{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  )
}

export function PriorityBarChart() {
  const tasks = useTaskStore((s) => s.tasks)

  const data = useMemo(() => {
    const counts: Record<string, number> = { urgent: 0, high: 0, medium: 0, low: 0 }
    tasks.filter((t) => t.status !== "completed").forEach((t) => {
      const p = (t.priority || "medium").toLowerCase()
      if (p in counts) counts[p]++
    })
    return Object.entries(counts).map(([name, count]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      count,
    }))
  }, [tasks])

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="rounded-[14px] border border-neutral-200/50 bg-white p-5 shadow-sm dark:border-neutral-800/50 dark:bg-neutral-900"
    >
      <h3 className="mb-4 text-sm font-bold tracking-tight text-neutral-900 dark:text-white">Priority Distribution</h3>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
          <XAxis
            dataKey="name"
            tick={{ fontSize: 10, fill: "#a3a3a3" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 10, fill: "#a3a3a3" }}
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
          />
          <Tooltip content={<ChartTooltip />} />
          <Bar
            dataKey="count"
            name="Tasks"
            radius={[4, 4, 0, 0]}
            maxBarSize={40}
          >
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </motion.div>
  )
}

export function TaskCharts() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <TaskCompletionChart />
      <CategoryPieChart />
      <PriorityBarChart />
    </div>
  )
}
