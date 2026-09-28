"use client"

import { useMemo } from "react"
import { motion } from "framer-motion"
import { Flame, Zap, Sparkles, Plus, Check, CalendarDays } from "lucide-react"
import { useTaskStore } from "@/store/use-task-store"
import { useMediaQuery } from "@/hooks/use-media-query"
import { cn } from "@/lib/shadcn-utils"
import type { Priority, Task } from "@/types"
import { Button } from "@/components/ui/button"

type SlotDef = {
  priority: Priority
  label: string
  capacity: number
  icon: typeof Flame
  accent: string
  check: string
  bar: string
  chip: string
  dots: string
}

const SLOTS: SlotDef[] = [
  {
    priority: "high",
    label: "Urgent",
    capacity: 3,
    icon: Flame,
    accent: "text-red-500",
    check: "bg-gradient-to-br from-red-500 to-orange-400",
    bar: "from-red-500 to-orange-400",
    chip: "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400",
    dots: "gradient-red",
  },
  {
    priority: "medium",
    label: "Focus",
    capacity: 2,
    icon: Zap,
    accent: "text-amber-500",
    check: "bg-gradient-to-br from-amber-500 to-yellow-400",
    bar: "from-amber-500 to-yellow-400",
    chip: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400",
    dots: "gradient-amber",
  },
  {
    priority: "low",
    label: "Easy",
    capacity: 3,
    icon: Sparkles,
    accent: "text-blue-500",
    check: "bg-gradient-to-br from-blue-500 to-cyan-400",
    bar: "from-blue-500 to-cyan-400",
    chip: "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400",
    dots: "gradient-blue",
  },
]

function TodayRing({ pct }: { pct: number }) {
  const R = 20
  const C = 2 * Math.PI * R
  return (
    <div className="relative h-14 w-14 shrink-0">
      <svg width={56} height={56} viewBox="0 0 56 56" className="-rotate-90">
        <defs>
          <linearGradient id="todayRing" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#ff6b6b" />
            <stop offset="50%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#60a5fa" />
          </linearGradient>
        </defs>
        <circle cx={28} cy={28} r={R} fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth={5} />
        <circle
          cx={28}
          cy={28}
          r={R}
          fill="none"
          stroke="url(#todayRing)"
          strokeWidth={5}
          strokeLinecap="round"
          strokeDasharray={C}
          strokeDashoffset={C * (1 - Math.min(100, Math.max(0, pct)) / 100)}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[12px] font-black text-white">
        {pct}%
      </span>
    </div>
  )
}

function SlotCheck({ done, check }: { done: boolean; check: string }) {
  return (
    <span
      className={cn(
        "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-all",
        done
          ? cn("border-transparent", check)
          : "border-neutral-200 bg-white group-hover:border-neutral-300 dark:border-neutral-600 dark:bg-neutral-900 dark:group-hover:border-neutral-500"
      )}
    >
      {done && <Check className="h-3 w-3 text-white" strokeWidth={3.5} />}
    </span>
  )
}

export function TodayPanel() {
  const tasks = useTaskStore((s) => s.tasks)
  const getStats = useTaskStore((s) => s.getStats)
  const openCreateModal = useTaskStore((s) => s.openCreateModal)
  const setSelectedTask = useTaskStore((s) => s.setSelectedTask)
  const setIsEditSheetOpen = useTaskStore((s) => s.setIsEditSheetOpen)
  const updateTask = useTaskStore((s) => s.updateTask)
  const requestComplete = useTaskStore((s) => s.requestComplete)
  const isMobile = useMediaQuery("(max-width: 768px)")

  const stats = getStats()
  const todayKey = useMemo(() => new Date().toISOString().slice(0, 10), [])
  const now = new Date()

  const active = tasks.filter((t) => !t.completed)

  const buckets = useMemo(() => {
    const rank = (t: Task) => (t.dueDate === todayKey ? 0 : t.dueDate && t.dueDate < todayKey ? 1 : 2)
    return Object.fromEntries(
      SLOTS.map((s) => [
        s.priority,
        active
          .filter((t) => t.priority === s.priority)
          .sort((a, b) => rank(a) - rank(b) || b.createdAt - a.createdAt),
      ])
    ) as Record<Priority, Task[]>
  }, [active, todayKey])

  const toggle = (t: Task) => {
    if (t.completed) updateTask(t.id, { completed: false, progress: t.subtasks.length ? t.progress : 0 })
    else requestComplete(t.id)
  }

  const openTask = (t: Task) => {
    setSelectedTask(t)
    setIsEditSheetOpen(true)
  }

  const dateLabel = now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })
  const todayCount = active.filter((t) => t.dueDate === todayKey).length

  return (
    <section className="overflow-hidden rounded-3xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 px-4 py-4 sm:px-5 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950">
        <div className="pointer-events-none absolute -right-10 -top-12 h-40 w-40 rounded-full bg-red-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-14 right-16 h-40 w-40 rounded-full bg-blue-500/20 blur-3xl" />
        <div className="pointer-events-none absolute right-40 top-0 h-24 w-24 rounded-full bg-amber-400/20 blur-2xl" />

        <div className="relative flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-white/50">
              <CalendarDays className="h-3 w-3" /> Today
            </p>
            <h2 className="mt-1 truncate text-base font-black tracking-tight text-white sm:text-xl">
              {dateLabel}
            </h2>
            {todayCount > 0 && (
              <p className="mt-0.5 text-[11px] font-medium text-white/60">
                {todayCount} task{todayCount === 1 ? "" : "s"} due today
              </p>
            )}
          </div>
          <TodayRing pct={stats.progress} />
        </div>

        <div className="relative mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5">
          {SLOTS.map((s) => {
            const Icon = s.icon
            const used = buckets[s.priority].length
            return (
              <span key={s.priority} className="flex items-center gap-1.5 text-[10px] font-semibold text-white/70">
                <Icon className={cn("h-3 w-3", s.accent)} />
                <span className="capitalize">{s.label}</span>
                <span className="text-white/40">
                  {Math.min(used, s.capacity)}/{s.capacity}
                </span>
              </span>
            )
          })}
        </div>
      </div>

      {/* Columns */}
      <div className="grid grid-cols-1 gap-3 p-3 sm:grid-cols-3 sm:gap-3">
        {SLOTS.map((slot) => {
          const Icon = slot.icon
          const rows = buckets[slot.priority]
          const shown = rows.slice(0, slot.capacity)
          const extra = Math.max(0, rows.length - slot.capacity)
          return (
            <motion.div
              key={slot.priority}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className="flex flex-col overflow-hidden rounded-2xl border border-neutral-200 dark:border-neutral-800"
            >
              <div className="flex items-center justify-between gap-2 border-b border-neutral-100 bg-neutral-50/70 px-3 py-2.5 dark:border-neutral-800 dark:bg-neutral-950/40">
                <span className={cn("flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wide", slot.accent)}>
                  <Icon className="h-3.5 w-3.5" />
                  {slot.label}
                </span>
                <span className="flex items-center gap-1">
                  {Array.from({ length: slot.capacity }).map((_, i) => {
                    const filled = i < Math.min(shown.length, slot.capacity)
                    return (
                      <span
                        key={i}
                        className={cn(
                          "h-1.5 w-4 rounded-full transition-all",
                          filled ? cn("bg-gradient-to-r", slot.bar) : "bg-neutral-200 dark:bg-neutral-700"
                        )}
                      />
                    )
                  })}
                </span>
              </div>

              <div className="flex-1 space-y-0.5 p-2">
                {shown.length === 0
                  ? Array.from({ length: slot.capacity }).map((_, i) => (
                      <button
                        key={i}
                        onClick={() => openCreateModal(slot.priority)}
                        className={cn(
                          "flex w-full items-center gap-2 rounded-lg border border-dashed px-2 py-1.5 text-left transition-colors",
                          isMobile
                            ? "border-neutral-200 text-neutral-400 hover:border-neutral-300 dark:border-neutral-700 dark:hover:border-neutral-600"
                            : "border-neutral-200 text-neutral-400 hover:border-neutral-300 hover:bg-neutral-50 dark:border-neutral-700 dark:hover:border-neutral-600 dark:hover:bg-neutral-800/40"
                        )}
                      >
                        <Plus className="h-3.5 w-3.5 shrink-0 opacity-50" />
                        <span className="truncate text-[11px]">Empty {slot.label.toLowerCase()} slot — add</span>
                      </button>
                    ))
                  : shown.map((t) => {
                      const dueToday = t.dueDate === todayKey
                      const overdue = t.dueDate && t.dueDate < todayKey
                      const subsDone = t.subtasks.filter((s) => s.completed).length
                      return (
                        <div key={t.id} className="group flex items-start gap-2 rounded-lg border border-transparent px-2 py-1.5 transition-colors hover:border-neutral-100 hover:bg-neutral-50 dark:hover:border-neutral-800 dark:hover:bg-neutral-800/40">
                          <button onClick={() => toggle(t)} aria-label={`Complete ${t.title}`}>
                            <SlotCheck done={t.completed} check={slot.check} />
                          </button>
                          <div className="min-w-0 flex-1">
                            <button onClick={() => openTask(t)} className="block w-full text-left">
                              <span
                                className={cn(
                                  "block truncate text-[13px] font-medium text-neutral-800 dark:text-neutral-200",
                                  t.completed && "text-neutral-400 line-through dark:text-neutral-500"
                                )}
                              >
                                {t.title}
                              </span>
                            </button>
                            <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] text-neutral-400 dark:text-neutral-500">
                              {overdue && <span className="font-semibold text-red-500 dark:text-red-400">Overdue</span>}
                              {dueToday && <span className="font-semibold text-amber-500 dark:text-amber-400">Due today</span>}
                              {t.project && <span className="truncate max-w-[120px]">{t.project}</span>}
                              {t.subtasks.length > 0 && (
                                <span className="flex items-center gap-0.5">
                                  <Check className="h-2.5 w-2.5" /> {subsDone}/{t.subtasks.length}
                                </span>
                              )}
                            </div>
                          </div>
                          <span className={cn("mt-0.5 hidden rounded py-0.5 text-[10px] font-semibold sm:inline-flex", slot.chip)}>
                            {slot.label}
                          </span>
                        </div>
                      )
                    })}
              </div>

              <div className="space-y-1 p-2 pt-0">
                {extra > 0 && (
                  <p className="px-1 text-[10px] font-semibold text-neutral-400">+{extra} more stacked in backlog</p>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openCreateModal(slot.priority)}
                  className={cn("h-8 w-full gap-1.5 rounded-xl text-xs")}
                >
                  <Plus className="h-3.5 w-3.5" /> Add {slot.label.toLowerCase()}
                </Button>
              </div>
            </motion.div>
          )
        })}
      </div>
    </section>
  )
}