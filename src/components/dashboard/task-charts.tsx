"use client"

import { useMemo } from "react"
import { motion } from "framer-motion"
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, CartesianGrid,
} from "recharts"
import { useTaskStore } from "@/store/use-task-store"
import { format, subDays } from "date-fns"

const COLORS = ["#6366f1", "#8b5cf6", "#ec4899", "#f43f5e", "#f59e0b", "#10b981", "#06b6d4"]

const PRIORITY_BAR_COLORS: Record<string, string> = {
  Urgent: "#ef4444",
  High: "#f97316",
  Medium: "#f59e0b",
  Low: "#3b82f6",
}

const SERIES_COLORS: Record<string, string> = {
  Completed: "#6366f1",
  Created: "#10b981",
  Tasks: "#6366f1",
}

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-neutral-200 bg-white px-3 py-2 text-xs shadow-lg shadow-neutral-200/40 dark:border-neutral-700 dark:bg-neutral-900 dark:shadow-black/30">
      {label && <p className="mb-1 font-semibold text-neutral-900 dark:text-white">{label}</p>}
      {payload.map((entry: any, i: number) => (
        <p key={i} className="flex items-center gap-1.5 text-neutral-600 dark:text-neutral-400">
          <span
            className="h-2 w-2 rounded-full"
            style={{ background: entry.color ?? entry.payload?.fill ?? SERIES_COLORS[entry.name] ?? COLORS[i % COLORS.length] }}
          />
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
          const c = t.createdAt
          return t.completed && c >= dayStart && c <= dayEnd
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
      className="rounded-[14px] border border-neutral-200/50 bg-white p-4 shadow-sm sm:p-5 dark:border-neutral-800/50 dark:bg-neutral-900"
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-bold tracking-tight text-neutral-900 dark:text-white">Task Activity</h3>
        <div className="flex items-center gap-3 text-[10px] font-medium text-neutral-500 dark:text-neutral-400">
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-indigo-500" /> Completed</span>
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-500" /> Created</span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="completedGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="createdGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10, fill: "#a3a3a3" }}
            axisLine={false}
            tickLine={false}
            interval="preserveStartEnd"
            minTickGap={18}
            tickMargin={6}
          />
          <YAxis
            tick={{ fontSize: 10, fill: "#a3a3a3" }}
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
          />
          <Tooltip content={<ChartTooltip />} />
          <Area
            type="monotone"
            dataKey="completed"
            stroke="#6366f1"
            strokeWidth={2.5}
            fill="url(#completedGrad)"
            name="Completed"
            activeDot={{ r: 4 }}
          />
          <Area
            type="monotone"
            dataKey="created"
            stroke="#10b981"
            strokeWidth={1.5}
            strokeDasharray="4 4"
            fill="url(#createdGrad)"
            name="Created"
            activeDot={{ r: 4 }}
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
      const cat = t.project || "Uncategorized"
      counts[cat] = (counts[cat] || 0) + 1
    })
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
  }, [tasks])

  if (!data.length) return null

  const total = data.reduce((n, d) => n + d.value, 0)

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="rounded-[14px] border border-neutral-200/50 bg-white p-4 shadow-sm sm:p-5 dark:border-neutral-800/50 dark:bg-neutral-900"
    >
      <h3 className="mb-4 text-sm font-bold tracking-tight text-neutral-900 dark:text-white">Categories</h3>
      <div className="flex flex-col items-center gap-4 sm:flex-row">
        <ResponsiveContainer width={140} height={140}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={40}
              outerRadius={62}
              paddingAngle={3}
              dataKey="value"
              strokeWidth={0}
              cornerRadius={4}
            >
              {data.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <text
              x={70}
              y={72}
              textAnchor="middle"
              dominantBaseline="middle"
              className="fill-neutral-900 dark:fill-white"
              fontSize={18}
              fontWeight={800}
            >
              {total}
            </text>
            <text
              x={70}
              y={88}
              textAnchor="middle"
              dominantBaseline="middle"
              className="fill-neutral-400"
              fontSize={9}
              fontWeight={600}
            >
              tasks
            </text>
          </PieChart>
        </ResponsiveContainer>
        <div className="flex w-full flex-wrap gap-x-3 gap-y-1.5 sm:w-auto sm:flex-col sm:gap-y-1.5">
          {data.slice(0, 4).map((item, i) => (
            <div key={item.name} className="flex items-center gap-1.5">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ background: `linear-gradient(135deg, ${COLORS[i % COLORS.length]}, ${COLORS[(i + 1) % COLORS.length]})` }}
              />
              <span className="max-w-[140px] truncate text-xs text-neutral-600 dark:text-neutral-400">{item.name}</span>
              <span className="pl-1 text-xs font-semibold text-neutral-900 dark:text-white">{item.value}</span>
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
    tasks.filter((t) => !t.completed).forEach((t) => {
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
      className="rounded-[14px] border border-neutral-200/50 bg-white p-4 shadow-sm sm:p-5 dark:border-neutral-800/50 dark:bg-neutral-900"
    >
      <h3 className="mb-1 text-sm font-bold tracking-tight text-neutral-900 dark:text-white">Priority Distribution</h3>
      <p className="mb-3 text-[11px] font-medium text-neutral-400 dark:text-neutral-500">Active backlog by urgency</p>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
          <XAxis
            dataKey="name"
            tick={{ fontSize: 10, fill: "#a3a3a3" }}
            axisLine={false}
            tickLine={false}
            tickMargin={6}
          />
          <YAxis
            tick={{ fontSize: 10, fill: "#a3a3a3" }}
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
          />
          <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(0,0,0,0.04)" }} />
          <Bar
            dataKey="count"
            name="Tasks"
            radius={[6, 6, 0, 0]}
            maxBarSize={44}
          >
            {data.map((d) => (
              <Cell key={d.name} fill={PRIORITY_BAR_COLORS[d.name] ?? "#6366f1"} />
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