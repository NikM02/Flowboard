"use client"

import { useMemo } from "react"
import { TrendingUp, Flag, AlertTriangle, Gauge } from "lucide-react"
import { cn } from "@/lib/shadcn-utils"
import type { Roadmap } from "@/types"
import { STATUS_META, STATUS_LIST } from "./roadmap-meta"

const WEEK = 7 * 24 * 60 * 60 * 1000

function useCharts(roadmap: Roadmap) {
  return useMemo(() => {
    const phases = roadmap.phases
    const total = phases.length
    const done = phases.filter((p) => p.status === "completed").length
    const overall = total ? Math.round((done / total) * 100) : 0

    const events = [
      ...phases.flatMap((p) => p.tasks.filter((t) => t.completed && t.completedAt).map((t) => ({ t: t.completedAt!, type: "task" as const }))),
      ...phases.filter((p) => p.completedAt).map((p) => ({ t: p.completedAt!, type: "phase" as const })),
    ].sort((a, b) => a.t - b.t)

    const now = Date.now()
    const base = Math.min(roadmap.createdAt, now)
    const weeks = Math.max(1, Math.ceil((now - base) / WEEK))
    const taskCum = new Array<number>(weeks).fill(0)
    const phaseCum = new Array<number>(weeks).fill(0)
    for (const e of events) {
      const idx = Math.min(weeks - 1, Math.max(0, Math.floor((e.t - base) / WEEK)))
      taskCum[idx] += e.type === "task" ? 1 : 0
      phaseCum[idx] += e.type === "phase" ? 1 : 0
    }
    for (let i = 1; i < weeks; i++) {
      taskCum[i] += taskCum[i - 1]
      phaseCum[i] += phaseCum[i - 1]
    }

    const maxY = Math.max(1, ...taskCum, ...phaseCum)
    const totalFinished = events.length
    const months = Math.max((now - base) / (30 * 24 * 60 * 60 * 1000), 0.25)
    const pacePerMonth = done / months
    const overduePhases = phases.filter(
      (p) => p.dueDate && p.status !== "completed" && new Date(p.dueDate).getTime() < now
    ).length
    const blocked = phases.filter((p) => p.status === "blocked").length
    const estFinish = pacePerMonth > 0 && total > 0
      ? new Date(base + (total / pacePerMonth) * 30 * 24 * 60 * 60 * 1000)
      : null

    return { total, done, overall, weeks, taskCum, phaseCum, maxY, totalFinished, pacePerMonth, overduePhases, blocked, estFinish }
  }, [roadmap])
}

function Ring({ percent, size = 148, stroke = 13 }: { percent: number; size?: number; stroke?: number }) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} className="stroke-neutral-100 dark:stroke-neutral-800" />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke}
          className="stroke-neutral-900 dark:stroke-white transition-all duration-700"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c - (c * Math.min(percent, 100)) / 100}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-neutral-900 dark:text-white">{percent}%</span>
        <span className="text-[10px] font-medium text-neutral-400">overall</span>
      </div>
    </div>
  )
}

function GrowthChart({ roadmap }: { roadmap: Roadmap }) {
  const { weeks, taskCum, phaseCum, maxY } = useCharts(roadmap)
  const W = 320
  const H = 132
  const PAD = 8
  const innerW = W - PAD * 2
  const innerH = H - PAD * 2

  const x = (i: number) => PAD + (weeks <= 1 ? 0 : (i / (weeks - 1)) * innerW)
  const y = (v: number) => PAD + innerH - (maxY > 0 ? (v / maxY) * innerH : 0)

  const pts = (arr: number[]) => arr.map((v, i) => [x(i), y(v)] as const)
  const path = (arr: number[]) =>
    pts(arr).reduce((s, [px, py], i) => (i === 0 ? `M${px},${py}` : `${s} L${px},${py}`), "")
  const area = (arr: number[]) => {
    const p = pts(arr)
    if (p.length === 0) return ""
    const last = p[p.length - 1]
    return `${path(arr)} L${last[0]},${H - PAD} L${p[0][0]},${H - PAD} Z`
  }

  const totalFinished = taskCum[weeks - 1] + phaseCum[weeks - 1]

  if (totalFinished === 0) {
    return (
      <div className="flex h-40 flex-col items-center justify-center text-center">
        <TrendingUp className="mb-2 h-8 w-8 text-neutral-300 dark:text-neutral-600" />
        <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">No growth data yet</p>
        <p className="mt-0.5 text-xs text-neutral-400">Complete tasks and milestones to see progress over time.</p>
      </div>
    )
  }

  const labelEvery = Math.max(1, Math.ceil(weeks / 6))

  return (
    <div>
      <div className="flex items-center justify-between text-xs text-neutral-400">
        <span>Tasks: <span className="font-semibold text-neutral-300">{taskCum[weeks - 1]}</span></span>
        <span>Milestones: <span className="font-semibold text-neutral-300">{phaseCum[weeks - 1]}</span></span>
        <span>Total: <span className="font-semibold text-neutral-300">{totalFinished}</span></span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="mt-2 w-full">
        <defs>
          <linearGradient id={`g-tasks-${roadmap.id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#171717" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#171717" stopOpacity="0.02" />
          </linearGradient>
          <linearGradient id={`g-phase-${roadmap.id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.03" />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75, 1].map((g) => (
          <line key={g} x1={PAD} x2={W - PAD} y1={y(maxY * g)} y2={y(maxY * g)} className="stroke-neutral-100 dark:stroke-neutral-800" strokeWidth="1" />
        ))}
        {weeks > 1 && phaseCum[weeks - 1] > 0 && (
          <>
            <path d={area(phaseCum)} fill={`url(#g-phase-${roadmap.id})`} />
            <path d={path(phaseCum)} fill="none" stroke="#8b5cf6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </>
        )}
        {taskCum[weeks - 1] > 0 && (
          <>
            <path d={area(taskCum)} fill={`url(#g-tasks-${roadmap.id})`} />
            <path d={path(taskCum)} fill="none" stroke="#171717" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="dark:stroke-white" />
          </>
        )}
        {Array.from({ length: weeks }, (_, i) => i).map((i) =>
          i % labelEvery === 0 || i === weeks - 1 ? (
            <text key={i} x={x(i)} y={H - PAD / 2} textAnchor={i === 0 ? "start" : i === weeks - 1 ? "end" : "middle"} className="fill-neutral-400" fontSize="8">{i + 1}</text>
          ) : null
        )}
      </svg>
      <div className="flex items-center justify-between text-[10px] text-neutral-400">
        <span>Weeks since start</span>
        <span className="flex items-center gap-3">
          <span className="flex items-center gap-1"><span className="h-1.5 w-3 rounded-full bg-neutral-900 dark:bg-white" /> tasks</span>
          <span className="flex items-center gap-1"><span className="h-1.5 w-3 rounded-full bg-violet-500" /> milestones</span>
        </span>
      </div>
    </div>
  )
}

export function RoadmapAnalytics({ roadmap }: { roadmap: Roadmap }) {
  const { total, done, overall, totalFinished, pacePerMonth, overduePhases, blocked, estFinish } = useCharts(roadmap)

  const distTotal = Math.max(total, 1)
  const segments = STATUS_LIST.map((st) => ({
    st,
    n: roadmap.phases.filter((p) => p.status === st).length,
    width: (roadmap.phases.filter((p) => p.status === st).length / distTotal) * 100,
  }))

  return (
    <div className="mt-6">
      <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-neutral-400">
        <Gauge className="h-4 w-4" /> Analytics & growth
      </h2>

      <div className="mt-3 grid gap-4 lg:grid-cols-2">
        <div className="rounded-3xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
          <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400">Progress</p>
          <div className="mt-4 flex items-center gap-6">
            <Ring percent={overall} />
            <div className="min-w-0 flex-1 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold text-neutral-900 dark:text-white">{done}</span>
                <span className="text-neutral-400">milestones done</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold text-neutral-900 dark:text-white">{total - done}</span>
                <span className="text-neutral-400">to go</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold text-neutral-900 dark:text-white">{totalFinished}</span>
                <span className="text-neutral-400">tasks + milestones completed</span>
              </div>
              <div>
                <div className="mb-1 flex items-center justify-between text-[11px] text-neutral-400">
                  <span>Status breakdown</span>
                  <span>{roadmap.phases.length} milestones</span>
                </div>
                <div className="flex h-3 w-full overflow-hidden rounded-full">
                  {segments.map((s) =>
                    s.n > 0 ? (
                      <div key={s.st} title={STATUS_META[s.st].label} style={{ width: `${s.width}%`, background: STATUS_META[s.st].dot }} />
                    ) : null
                  )}
                </div>
                <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
                  {segments.filter((s) => s.n > 0).map((s) => (
                    <span key={s.st} className="flex items-center gap-1 text-[10px] text-neutral-400">
                      <span className="h-1.5 w-1.5 rounded-full" style={{ background: STATUS_META[s.st].dot }} />
                      {s.n} {STATUS_META[s.st].label}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-neutral-400">
            <TrendingUp className="h-3.5 w-3.5" /> Growth over time
          </p>
          <div className="mt-3">
            <GrowthChart roadmap={roadmap} />
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Insight
          icon={<Flag className="h-4 w-4" />}
          label="Milestones per month"
          value={pacePerMonth > 0 ? `${pacePerMonth.toFixed(1)}` : "—"}
        />
        <Insight
          icon={<TrendingUp className="h-4 w-4" />}
          label="Estimated finish"
          value={estFinish ? estFinish.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : "—"}
        />
        <Insight
          icon={<AlertTriangle className="h-4 w-4" />}
          label="Overdue milestones"
          value={`${overduePhases}`}
          tone={overduePhases > 0 ? "danger" : "normal"}
        />
        <Insight
          icon={<AlertTriangle className="h-4 w-4" />}
          label="Blocked"
          value={`${blocked}`}
          tone={blocked > 0 ? "danger" : "normal"}
        />
      </div>
    </div>
  )
}

function Insight({ icon, label, value, tone = "normal" }: { icon: React.ReactNode; label: string; value: string; tone?: "normal" | "danger" }) {
  return (
    <div className={cn("rounded-2xl border p-4",
      tone === "danger" ? "border-rose-200 bg-rose-50/60 dark:border-rose-500/30 dark:bg-rose-500/5" : "border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900")}>
      <div className="flex items-center gap-1.5 text-neutral-400">
        {icon}
        <span className="text-[10px] font-semibold uppercase tracking-wide">{label}</span>
      </div>
      <p className="mt-2 truncate text-lg font-bold text-neutral-900 dark:text-white">{value}</p>
    </div>
  )
}