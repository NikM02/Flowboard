"use client"

import { cn } from "@/lib/shadcn-utils"

/* ── Modern gradient palette (from → to) ─────────────── */
export const CHART_GRADIENTS: [string, string][] = [
  ["#1da1f2", "#0e8be0"],
  ["#34d399", "#059669"],
  ["#fb923c", "#ea580c"],
  ["#4d94f0", "#2f6ee0"],
  ["#f87171", "#dc2626"],
  ["#22d3ee", "#0891b2"],
  ["#67e8f9", "#06b6d4"],
  ["#3db8f5", "#0a72ba"],
]

export const CHART_COLORS = {
  blue: "#1da1f2",
  green: "#10b981",
  orange: "#f97316",
  purple: "#2f6ee0",
  red: "#ef4444",
  cyan: "#06b6d4",
  yellow: "#eab308",
  pink: "#22d3ee",
  slate: "#94a3b8",
  emerald: "#34d399",
  rose: "#f43f5e",
  indigo: "#1da1f2",
} as const

export const CHART_PALETTE = [
  "#1da1f2", "#34d399", "#fb923c", "#2f6ee0",
  "#f87171", "#22d3ee", "#0ea5e9", "#0e8be0",
  "#fbbf24", "#2dd4bf", "#a3a3a3", "#4d94f0",
]

/* ── Chart theme tokens ─────────────────────────────── */
export const CHART_GRID_STYLES = {
  strokeDasharray: "3 4",
  stroke: "#a3a3a3",
  strokeOpacity: 0.22,
  vertical: false,
} as const

export const CHART_AXIS_STYLES = {
  tick: { fontSize: 10, fill: "#a3a3a3", fontWeight: 500 },
  axisLine: false,
  tickLine: false,
} as const

export const CHART_CURSOR_STYLES = { fill: "rgba(29, 161, 242, 0.06)" }

/* ── SVG defs: linear gradients for fills ───────────── */
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

/* ── SVG defs: soft glow filter ─────────────────────── */
export function ChartGlow({ id }: { id: string }) {
  return (
    <filter id={id} x="-40%" y="-40%" width="180%" height="180%">
      <feGaussianBlur stdDeviation="3.5" result="blur" />
      <feFlood floodColor="currentColor" floodOpacity="0.35" result="color" />
      <feComposite in="color" in2="blur" operator="in" result="shadow" />
      <feMerge>
        <feMergeNode in="shadow" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
  )
}

/* ── Modern glass tooltip ───────────────────────────── */
interface TooltipPayloadItem {
  color: string
  name: string
  value: number | string
  dataKey?: string
}

interface ChartTooltipProps {
  active?: boolean
  payload?: TooltipPayloadItem[]
  label?: string
  formatter?: (value: number | string, name: string) => string
  labelFormatter?: (label: string) => string
  className?: string
}

export function ChartTooltip({
  active,
  payload,
  label,
  formatter,
  labelFormatter,
  className,
}: ChartTooltipProps) {
  if (!active || !payload?.length) return null

  return (
    <div
      className={cn(
        "animate-fade-in glass rounded-xl px-3 py-2.5 shadow-xl shadow-indigo-500/10",
        className
      )}
    >
      {label && (
        <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-neutral-500 dark:text-neutral-400">
          {labelFormatter ? labelFormatter(label) : label}
        </p>
      )}
      <div className="space-y-1">
        {payload.map((p, i) => (
          <div key={i} className="flex items-center gap-2 text-xs">
            <span className="h-2 w-2 shrink-0 rounded-full shadow-sm" style={{ backgroundColor: p.color }} />
            <span className="text-neutral-600 dark:text-neutral-400">{p.name}</span>
            <span className="ml-auto font-bold tabular-nums text-neutral-900 dark:text-neutral-50">
              {formatter
                ? formatter(p.value, p.name)
                : typeof p.value === "number"
                ? p.value.toLocaleString("en-IN")
                : p.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── Modern legend (pill style) ─────────────────────── */
interface ChartLegendProps {
  payload?: { value: string; color: string; data?: unknown }[]
  formatter?: (value: string) => string
}

export function ChartLegend({ payload, formatter }: ChartLegendProps) {
  if (!payload?.length) return null

  return (
    <div className="flex flex-wrap justify-center gap-2 pt-2">
      {payload.map((entry, i) => (
        <span
          key={i}
          className="inline-flex items-center gap-1.5 rounded-full bg-neutral-100/80 px-2.5 py-1 text-[10px] font-semibold text-neutral-600 dark:bg-neutral-800/80 dark:text-neutral-300"
        >
          <span
            className="h-1.5 w-1.5 rounded-full"
            style={{ backgroundColor: entry.color, boxShadow: `0 0 6px ${entry.color}` }}
          />
          {formatter ? formatter(entry.value) : entry.value}
        </span>
      ))}
    </div>
  )
}

/* ── Modern chart card wrapper ──────────────────────── */
interface ChartCardProps {
  title: string
  subtitle?: string
  icon?: React.ComponentType<{ className?: string }>
  action?: React.ReactNode
  children: React.ReactNode
  className?: string
  delay?: number
}

export function ChartCard({
  title,
  subtitle,
  icon: Icon,
  action,
  children,
  className,
  delay = 0,
}: ChartCardProps) {
  return (
    <div
      className={cn(
        "card-modern card-hover animate-fade-in glass relative overflow-hidden rounded-2xl p-4 sm:p-5",
        className
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          {Icon && (
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-500 dark:text-indigo-400">
              <Icon className="h-3.5 w-3.5" />
            </div>
          )}
          <div>
            <h3 className="text-[13px] font-bold tracking-tight text-neutral-900 dark:text-neutral-50">
              {title}
            </h3>
            {subtitle && (
              <p className="text-[10px] font-medium text-neutral-500 dark:text-neutral-400">{subtitle}</p>
            )}
          </div>
        </div>
        {action}
      </div>
      {children}
    </div>
  )
}

/* ── Sparkline (unique mini viz) ────────────────────── */
interface SparklineProps {
  data: number[]
  color?: string
  width?: number
  height?: number
  strokeWidth?: number
  className?: string
}

export function Sparkline({
  data,
  color = "#1da1f2",
  width = 88,
  height = 30,
  strokeWidth = 2,
  className,
}: SparklineProps) {
  if (!data.length) return null

  const min = Math.min(...data)
  const max = Math.max(...data)
  const span = max - min || 1
  const pad = 2
  const stepX = (width - pad * 2) / Math.max(data.length - 1, 1)

  const points = data.map((v, i) => {
    const x = pad + i * stepX
    const y = height - pad - ((v - min) / span) * (height - pad * 2)
    return [x, y] as const
  })

  const line = points.map(([x, y]) => `${x},${y}`).join(" ")
  const area = `M ${points[0][0]},${height} L ${points
    .map(([x, y]) => `${x},${y}`)
    .join(" L ")} L ${points[points.length - 1][0]},${height} Z`

  const gid = `spark-${color.replace(/[^a-zA-Z0-9]/g, "")}`

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className={className}>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gid})`} />
      <polyline
        points={line}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ filter: `drop-shadow(0 0 4px ${color}66)` }}
      />
    </svg>
  )
}

/* ── Radial gauge (modern progress ring) ────────────── */
interface RadialGaugeProps {
  value: number // 0 - 100
  size?: number
  stroke?: number
  color?: [string, string]
  trackOpacity?: number
  label?: string
  sublabel?: string
  className?: string
}

export function RadialGauge({
  value,
  size = 120,
  stroke = 11,
  color = ["#1da1f2", "#0e8be0"],
  trackOpacity = 0.12,
  label,
  sublabel,
  className,
}: RadialGaugeProps) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const clamped = Math.max(0, Math.min(100, value))
  const offset = c - (clamped / 100) * c
  const gid = `gauge-${color[0].replace(/[^a-zA-Z0-9]/g, "")}`

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id={gid} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={color[0]} />
            <stop offset="100%" stopColor={color[1]} />
          </linearGradient>
          <filter id={`${gid}-glow`}>
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="currentColor"
          strokeOpacity={trackOpacity}
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={`url(#${gid})`}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          style={{
            filter: `url(#${gid}-glow)`,
            transition: "stroke-dashoffset 0.9s cubic-bezier(0.22, 1, 0.36, 1)",
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-black tracking-tight text-neutral-900 dark:text-neutral-50">
          {label ?? `${clamped}%`}
        </span>
        {sublabel && (
          <span className="text-[9px] font-semibold uppercase tracking-widest text-neutral-500 dark:text-neutral-400">
            {sublabel}
          </span>
        )}
      </div>
    </div>
  )
}

/* ── Gradient icon tile ─────────────────────────────── */
interface GradientIconTileProps {
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>
  color?: string
  className?: string
}

export function GradientIconTile({ icon: Icon, color = "#1da1f2", className }: GradientIconTileProps) {
  return (
    <div
      className={cn("flex h-9 w-9 items-center justify-center rounded-xl", className)}
      style={{
        background: `linear-gradient(135deg, ${color}26, ${color}0d)`,
        boxShadow: `inset 0 1px 0 rgba(255,255,255,0.1), 0 0 16px ${color}22`,
      }}
    >
      <Icon className="h-4 w-4" style={{ color }} />
    </div>
  )
}
