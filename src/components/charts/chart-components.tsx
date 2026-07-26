"use client"

import { cn } from "@/lib/shadcn-utils"

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
        "rounded-xl border border-neutral-200/80 bg-white/95 p-3 shadow-xl backdrop-blur-md dark:border-neutral-700/80 dark:bg-neutral-900/95",
        className
      )}
    >
      {label && (
        <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
          {labelFormatter ? labelFormatter(label) : label}
        </p>
      )}
      <div className="space-y-1">
        {payload.map((p, i) => (
          <div key={i} className="flex items-center gap-2 text-xs">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: p.color }}
            />
            <span className="text-neutral-600 dark:text-neutral-400">{p.name}</span>
            <span className="ml-auto font-semibold text-neutral-900 dark:text-neutral-50">
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

interface ChartLegendProps {
  payload?: { value: string; color: string; data?: unknown }[]
  formatter?: (value: string) => string
}

export function ChartLegend({ payload, formatter }: ChartLegendProps) {
  if (!payload?.length) return null

  return (
    <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 pt-2">
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center gap-1.5 text-[11px] text-neutral-600 dark:text-neutral-400">
          <span
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          {formatter ? formatter(entry.value) : entry.value}
        </div>
      ))}
    </div>
  )
}

export const CHART_GRID_STYLES = {
  strokeDasharray: "3 3",
  stroke: "#e5e5e5",
  strokeOpacity: 0.4,
  vertical: false,
} as const

export const CHART_AXIS_STYLES = {
  tick: { fontSize: 10, fill: "#a3a3a3" },
  axisLine: false,
  tickLine: false,
} as const

export const CHART_COLORS = {
  blue: "#3b82f6",
  green: "#10b981",
  orange: "#f97316",
  purple: "#a855f7",
  red: "#ef4444",
  cyan: "#06b6d4",
  yellow: "#eab308",
  pink: "#ec4899",
  slate: "#94a3b8",
  emerald: "#34d399",
  rose: "#f43f5e",
  indigo: "#6366f1",
} as const

export const CHART_PALETTE = [
  "#3b82f6", "#10b981", "#f97316", "#a855f7",
  "#ef4444", "#06b6d4", "#eab308", "#ec4899",
  "#6366f1", "#f43f5e", "#14b8a6", "#8b5cf6",
]
