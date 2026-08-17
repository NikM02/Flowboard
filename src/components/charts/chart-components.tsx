"use client"

import { useMemo } from "react"
import { RadialBarChart, RadialBar, ResponsiveContainer } from "recharts"

const CHART_GRADIENTS: [string, string][] = [
  ["#262626", "#525252"],
  ["#525252", "#737373"],
  ["#737373", "#a3a3a3"],
  ["#404040", "#737373"],
]

export const CHART_GRID_STYLES = {
  strokeDasharray: "3 4",
  stroke: "#e5e5e5",
  strokeOpacity: 0.5,
  vertical: false,
} as const

export const CHART_AXIS_STYLES = {
  tick: { fontSize: 10, fill: "#a3a3a3", fontWeight: 500 },
  axisLine: false,
  tickLine: false,
} as const

export const CHART_CURSOR_STYLES = { fill: "rgba(38, 38, 38, 0.06)" }

interface ChartTooltipProps {
  active?: boolean
  payload?: Array<{ name: string; value: number | string; color: string }>
  label?: string
  formatter?: (value: number | string, name: string) => string
  labelFormatter?: (label: string) => string
  className?: string
}

export function ChartTooltip({ active, payload, label, formatter, labelFormatter }: ChartTooltipProps) {
  if (!active || !payload?.length) return null
  return (
    <div className="animate-fade-in rounded-[10px] border border-neutral-200 bg-white px-3 py-2.5 shadow-xl dark:border-neutral-800 dark:bg-neutral-900">
      {label && (
        <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-neutral-500 dark:text-neutral-400">
          {labelFormatter ? labelFormatter(String(label)) : String(label)}
        </p>
      )}
      <div className="space-y-1">
        {payload.map((p, i) => (
          <div key={i} className="flex items-center gap-2 text-xs">
            <span className="h-2 w-2 shrink-0 rounded-full shadow-sm" style={{ backgroundColor: p.color }} />
            <span className="text-neutral-600 dark:text-neutral-400">{p.name}</span>
            <span className="ml-auto font-bold tabular-nums text-neutral-900 dark:text-white">
              {formatter ? formatter(p.value, p.name) : String(p.value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function ChartGradients({ ids }: { ids: string[] }) {
  return (
    <defs>
      {ids.map((id, i) => {
        const [from, to] = CHART_GRADIENTS[i % CHART_GRADIENTS.length]
        return (
          <linearGradient key={id} id={id} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={from} stopOpacity={0.95} />
            <stop offset="100%" stopColor={to} stopOpacity={0.5} />
          </linearGradient>
        )
      })}
    </defs>
  )
}

export function ChartGlow({ id }: { id: string }) {
  return (
    <filter id={id} x="-40%" y="-40%" width="180%" height="180%">
      <feGaussianBlur stdDeviation="3.5" result="blur" />
      <feFlood floodColor="#525252" floodOpacity="0.25" result="color" />
      <feComposite in="color" in2="blur" operator="in" result="shadow" />
      <feMerge>
        <feMergeNode in="shadow" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
  )
}

export function Sparkline({
  data,
  height = 40,
  color = "#262626",
  className = "",
}: {
  data: number[]
  height?: number
  color?: string
  className?: string
}) {
  const max = Math.max(...data, 1)
  const points = useMemo(() => {
    const w = 120
    const h = height
    const gap = w / (data.length - 1 || 1)
    return data.map((v, i) => `${i * gap},${h - (v / max) * h}`).join(" ")
  }, [data, height, max])

  return (
    <svg
      viewBox={`0 0 120 ${height}`}
      className={`w-full ${className}`}
      style={{ height }}
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id={`spark-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.15} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <polygon
        points={`0,${height} ${points} 120,${height}`}
        fill={`url(#spark-${color.replace("#", "")})`}
      />
    </svg>
  )
}

export function RadialGauge({
  value,
  colors,
  size = 56,
}: {
  value: number
  colors: string[]
  size?: number
}) {
  const data = [{ value, fill: colors[0] }]

  return (
    <div style={{ width: size, height: size }}>
      <ResponsiveContainer width="100%" height="100%">
        <RadialBarChart
          cx="50%"
          cy="50%"
          innerRadius="70%"
          outerRadius="100%"
          barSize={6}
          startAngle={90}
          endAngle={-270}
          data={data}
        >
          <RadialBar
            background={{ fill: colors[1] + "30" }}
            dataKey="value"
            cornerRadius={3}
          />
        </RadialBarChart>
      </ResponsiveContainer>
    </div>
  )
}

export function GradientIconTile({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <div
      className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-neutral-100 dark:bg-neutral-800"
    >
      <div className="text-neutral-600 dark:text-neutral-300">{children}</div>
    </div>
  )
}
