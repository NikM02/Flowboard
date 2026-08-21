"use client"

import { useState, useEffect, useMemo, useRef, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { format, addDays, isToday, isSameDay } from "date-fns"
import {
  Plus, X, Check, Trash2, Clock, Archive, CalendarDays, ListTodo,
  ChevronLeft, ChevronRight, CalendarRange,
} from "lucide-react"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { useRoutineStore, type RoutineEvent, getRandomPastelColor } from "@/store/use-routine-store"
import { useTaskStore } from "@/store/use-task-store"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/shadcn-utils"

/* ───────────────────────── constants ───────────────────────── */

const HOUR_HEIGHT = 56
const GRID_H = 24 * HOUR_HEIGHT
const DAY_MIN = 24 * 60
const SNAP = 15          // drag snaps to 15-minute slabs
const MIN_DUR = 30       // minimum block duration (minutes)
const CATEGORIES = ["Work", "Personal", "Health", "Learning", "Other"]
const EVENT_COLORS: { bg: string; accent: string }[] = [
  { bg: "#ffe1e6", accent: "#f43f5e" }, // rose
  { bg: "#fce7f3", accent: "#db2777" }, // pink
  { bg: "#fae8ff", accent: "#c026d3" }, // fuchsia
  { bg: "#e4daff", accent: "#7c3aed" }, // violet
  { bg: "#ddd6fe", accent: "#6d28d9" }, // purple
  { bg: "#c7d2fe", accent: "#4f46e5" }, // indigo
  { bg: "#e0e7ff", accent: "#4338ca" }, // periwinkle
  { bg: "#dbeafe", accent: "#2563eb" }, // blue
  { bg: "#e0f2fe", accent: "#0284c7" }, // sky
  { bg: "#cff2fe", accent: "#0891b2" }, // cyan
  { bg: "#ccfbf1", accent: "#0d9488" }, // teal
  { bg: "#d1fae5", accent: "#059669" }, // emerald
  { bg: "#dcfce7", accent: "#16a34a" }, // green
  { bg: "#ecfccb", accent: "#65a30d" }, // lime
  { bg: "#fef9c3", accent: "#ca8a04" }, // lemon
  { bg: "#fef3c7", accent: "#d97706" }, // amber
  { bg: "#ffedd5", accent: "#ea580c" }, // orange
  { bg: "#fed7aa", accent: "#c2410c" }, // tangerine
  { bg: "#ffe4e6", accent: "#e11d48" }, // coral
]
const DEFAULT_COLOR = "#dbeafe"
const ACCENT_MAP: Record<string, string> = Object.fromEntries(
  EVENT_COLORS.map((c) => [c.bg, c.accent])
)
function accentFor(bg?: string) {
  return (bg && ACCENT_MAP[bg]) || "#71717a"
}

/* ───────────────────────── time helpers ───────────────────────── */

function fmtTime(h: number) {
  const total = Math.round(h * 60)
  const hh24 = Math.floor(total / 60) % 24
  const mm = total % 60
  const ap = hh24 >= 12 ? "PM" : "AM"
  const hh = hh24 % 12 === 0 ? 12 : hh24 % 12
  return mm === 0 ? `${hh}:00 ${ap}` : `${hh}:${String(mm).padStart(2, "0")} ${ap}`
}

const TIME_OPTIONS = Array.from({ length: DAY_MIN / SNAP }, (_, i) => {
  const h = (i * SNAP) / 60
  return { value: String(h), label: fmtTime(h) }
})

function clampMin(m: number) {
  return Math.max(0, Math.min(DAY_MIN - SNAP, m))
}

/** Greedy lane assignment — packs overlapping blocks side-by-side like GCal. */
type Positioned = { ev: RoutineEvent; lane: number; lanes: number }
function layoutDay(events: RoutineEvent[]): Positioned[] {
  const items = [...events].sort(
    (a, b) => a.startHour - b.startHour || a.endHour - b.endHour
  )
  const out: Positioned[] = []
  let cluster: RoutineEvent[] = []
  let clusterEnd = -1

  const flush = () => {
    if (!cluster.length) return
    const laneEnds: number[] = []
    const assigned: number[] = []
    for (const ev of cluster) {
      let lane = laneEnds.findIndex((end) => end <= ev.startHour + 1e-9)
      if (lane === -1) {
        lane = laneEnds.length
        laneEnds.push(0)
      }
      laneEnds[lane] = ev.endHour
      assigned.push(lane)
    }
    cluster.forEach((ev, i) => out.push({ ev, lane: assigned[i], lanes: laneEnds.length }))
    cluster = []
    clusterEnd = -1
  }

  for (const ev of items) {
    if (cluster.length && ev.startHour >= clusterEnd - 1e-9) flush()
    cluster.push(ev)
    clusterEnd = Math.max(clusterEnd, ev.endHour)
  }
  flush()
  return out
}

/* ───────────────────────── date scroller ───────────────────────── */

function DateScroller({
  selectedDate,
  onSelect,
}: {
  selectedDate: Date
  onSelect: (d: Date) => void
}) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const dates = useMemo(() => {
    const today = new Date()
    const end = new Date(today.getFullYear(), 11, 31)
    const days = Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)) + 1
    return Array.from({ length: days }, (_, i) => addDays(today, i))
  }, [])

  useEffect(() => {
    if (!scrollRef.current) return
    const idx = dates.findIndex((d) => isSameDay(d, selectedDate))
    if (idx >= 0) {
      const el = scrollRef.current.children[idx] as HTMLElement
      el?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" })
    }
  }, [selectedDate, dates])

  return (
    <div ref={scrollRef} className="flex gap-1.5 overflow-x-auto scrollbar-none pb-1">
      {dates.map((d) => {
        const active = isSameDay(d, selectedDate)
        const today = isToday(d)
        return (
          <button
            key={d.toISOString()}
            onClick={() => onSelect(d)}
            className={cn(
              "flex shrink-0 flex-col items-center rounded-[10px] px-3 py-2 text-xs font-medium transition-all active:scale-95",
              active
                ? "bg-neutral-900 text-white shadow-md dark:bg-white dark:text-neutral-900"
                : today
                ? "border-2 border-neutral-900 bg-white text-neutral-900 dark:border-neutral-100 dark:bg-neutral-900 dark:text-white"
                : "border border-neutral-200 bg-white text-neutral-500 hover:border-neutral-300 hover:text-neutral-700 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400 dark:hover:border-neutral-700 dark:hover:text-neutral-200"
            )}
          >
            <span className="text-[9px] uppercase tracking-wider opacity-60">{format(d, "EEE")}</span>
            <span className="text-sm font-bold">{format(d, "d")}</span>
            <span className="text-[9px] opacity-60">{format(d, "MMM")}</span>
          </button>
        )
      })}
    </div>
  )
}

/* ───────────────────────── time grid with drag & drop ───────────────────────── */

type DragState =
  | { kind: "create"; anchor: number; cur: number }
  | { kind: "move"; id: string; dur: number; grab: number; start: number; origTop: number }
  | { kind: "resize"; id: string; start: number; end: number }

function TimeGrid({
  events,
  taskDone,
  onToggle,
  onDelete,
  onEdit,
  onCreateSlot,
  onMoveCommit,
  onResizeCommit,
  scrollSignal,
}: {
  events: RoutineEvent[]
  taskDone: (taskId?: string) => boolean
  onToggle: (id: string) => void
  onDelete: (id: string) => void
  onEdit: (event: RoutineEvent) => void
  onCreateSlot: (startH: number, endH: number) => void
  onMoveCommit: (id: string, startH: number, endH: number) => void
  onResizeCommit: (id: string, endH: number) => void
  scrollSignal: number
}) {
  const gridRef = useRef<HTMLDivElement>(null)
  const [drag, setDrag] = useState<DragState | null>(null)
  const dragRef = useRef<DragState | null>(null)
  const [nowMin, setNowMin] = useState(-1)

  const applyDrag = useCallback((d: DragState | null) => {
    dragRef.current = d
    setDrag(d)
  }, [])

  // ticking now-line
  useEffect(() => {
    const tick = () => {
      const d = new Date()
      setNowMin(d.getHours() * 60 + d.getMinutes())
    }
    tick()
    const t = setInterval(tick, 30_000)
    return () => clearInterval(t)
  }, [])

  // auto-scroll to current time (or morning) whenever the day changes
  useEffect(() => {
    const el = gridRef.current
    if (!el) return
    const d = new Date()
    const target = d.getHours() * HOUR_HEIGHT - HOUR_HEIGHT * 1.5
    el.scrollTo({ top: Math.max(0, target), behavior: "smooth" })
  }, [scrollSignal])

  const yToMin = useCallback((clientY: number) => {
    const el = gridRef.current
    if (!el) return 0
    const rect = el.getBoundingClientRect()
    const y = clientY - rect.top + el.scrollTop
    const min = Math.round((y / HOUR_HEIGHT) / SNAP) * SNAP
    return clampMin(min)
  }, [])

  /* ---- create on empty space (mouse / pen only; touch keeps natural scroll) ---- */
  const onBackgroundPointerDown = (e: React.PointerEvent) => {
    if (e.pointerType === "touch") return
    if ((e.target as HTMLElement).closest("[data-event]")) return
    e.preventDefault()
    const anchor = yToMin(e.clientY)

    const onMove = (ev: PointerEvent) => {
      applyDrag({ kind: "create", anchor, cur: yToMin(ev.clientY) })
    }
    const onUp = (ev: PointerEvent) => {
      window.removeEventListener("pointermove", onMove)
      window.removeEventListener("pointerup", onUp)
      const cur = yToMin(ev.clientY)
      const start = Math.min(anchor, cur)
      const end = Math.max(anchor, cur)
      if (Math.abs(cur - anchor) >= MIN_DUR) {
        onCreateSlot(start / 60, end / 60)
      } else {
        onCreateSlot(start / 60, Math.min(DAY_MIN, start + 60) / 60)
      }
      applyDrag(null)
    }
    window.addEventListener("pointermove", onMove)
    window.addEventListener("pointerup", onUp)
  }

  /* ---- move / resize existing event ---- */
  const onEventPointerDown = (e: React.PointerEvent, ev: RoutineEvent, mode: "move" | "resize") => {
    e.stopPropagation()
    e.preventDefault()
    const startY = e.clientY
    const startMin = Math.round(ev.startHour * 60)
    const endMin = Math.round(ev.endHour * 60)
    const dur = endMin - startMin
    const grab = mode === "move" ? yToMin(e.clientY) - startMin : 0
    let moved = false

    const onMove = (pev: PointerEvent) => {
      const deltaMin = ((pev.clientY - startY) / HOUR_HEIGHT) * 60
      if (!moved && Math.abs(pev.clientY - startY) < 4) return
      moved = true
      if (mode === "move") {
        applyDrag({
          kind: "move",
          id: ev.id,
          dur,
          grab,
          start: clampMin(startMin + deltaMin),
          origTop: startMin,
        })
      } else {
        applyDrag({
          kind: "resize",
          id: ev.id,
          start: startMin,
          end: clampMin(Math.max(startMin + MIN_DUR, endMin + deltaMin)),
        })
      }
    }
    const onUp = () => {
      window.removeEventListener("pointermove", onMove)
      window.removeEventListener("pointerup", onUp)
      const d = dragRef.current
      if (d && d.kind !== "create" && d.id === ev.id) {
        if (d.kind === "move") {
          const s = Math.round(d.start / SNAP) * SNAP
          onMoveCommit(ev.id, s / 60, Math.min(DAY_MIN, s + d.dur) / 60)
        } else {
          onResizeCommit(ev.id, (Math.round(d.end / SNAP) * SNAP) / 60)
        }
      } else if (!moved) {
        onEdit(ev) // plain tap/click → edit dialog
      }
      applyDrag(null)
    }
    window.addEventListener("pointermove", onMove)
    window.addEventListener("pointerup", onUp)
  }

  const positioned = useMemo(() => layoutDay(events), [events])

  const tempRectFor = useCallback(
    (id: string): { top: number; height: number } | null => {
      if (!drag || drag.kind === "create" || drag.id !== id) return null
      if (drag.kind === "move") {
        return {
          top: ((drag.start + drag.grab) / 60) * HOUR_HEIGHT,
          height: (drag.dur / 60) * HOUR_HEIGHT,
        }
      }
      return {
        top: (drag.start / 60) * HOUR_HEIGHT,
        height: ((drag.end - drag.start) / 60) * HOUR_HEIGHT,
      }
    },
    [drag]
  )

  const createPreview =
    drag?.kind === "create"
      ? {
          top: (Math.min(drag.anchor, drag.cur) / 60) * HOUR_HEIGHT,
          height: (Math.abs(drag.cur - drag.anchor) / 60) * HOUR_HEIGHT,
        }
      : null

  const showNowLine = nowMin >= 0 && isToday(new Date())

  return (
    <div className="overflow-hidden rounded-[14px] border border-neutral-200/70 bg-white shadow-sm dark:border-neutral-800/70 dark:bg-neutral-900">
      {/* sticky all-day / date strip */}
      <div className="flex items-center justify-between border-b border-neutral-100 px-4 py-2.5 dark:border-neutral-800/70">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-neutral-400" />
          <span className="text-sm font-semibold tracking-tight text-neutral-900 dark:text-white">
            {format(new Date(), "EEEE, d MMM yyyy")}
          </span>
        </div>
        <span className="text-[11px] font-medium text-neutral-400">
          {events.filter((e) => e.completed).length}/{events.length} done
        </span>
      </div>

      <div
        ref={gridRef}
        className="relative max-h-[62vh] overflow-y-auto overscroll-contain select-none sm:max-h-none"
        style={{ height: `min(${GRID_H}px, calc(100vh - 340px))`, minHeight: 420 }}
        onPointerDown={onBackgroundPointerDown}
      >
        {/* hour slabs */}
        {Array.from({ length: 24 }, (_, h) => (
          <div key={h} className="relative border-b border-neutral-100 dark:border-neutral-800/50" style={{ height: HOUR_HEIGHT }}>
            <div className="absolute left-0 top-0 w-14 pt-1 text-right pr-2 sm:w-16">
              <span className={cn(
                "text-[10px] font-medium tabular-nums",
                new Date().getHours() === h
                  ? "font-bold text-neutral-900 dark:text-white"
                  : "text-neutral-400 dark:text-neutral-500"
              )}>
                {fmtTime(h)}
              </span>
            </div>
            {/* half-hour line */}
            <div className="absolute left-14 right-0 top-1/2 border-t border-dashed border-neutral-100 sm:left-16 dark:border-neutral-800/40" />
          </div>
        ))}

        {/* events layer */}
        <div className="absolute inset-y-0 left-14 right-1 sm:left-16 sm:right-2">
          {/* now line */}
          {showNowLine && (
            <div
              className="pointer-events-none absolute left-0 right-0 z-20"
              style={{ top: (nowMin / 60) * HOUR_HEIGHT }}
            >
              <div className="relative flex items-center">
                <span className="absolute -left-1 h-2.5 w-2.5 rounded-full bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.6)]" />
                <div className="h-[2px] w-full bg-red-500/80" />
              </div>
            </div>
          )}

          {positioned.map(({ ev, lane, lanes }) => {
            const temp = tempRectFor(ev.id)
            const hiddenByDrag = drag && drag.kind !== "create" && drag.id === ev.id
            const done = ev.completed || taskDone(ev.taskId)
            const top = temp ? temp.top : ev.startHour * HOUR_HEIGHT
            const height = temp ? temp.height : Math.max((ev.endHour - ev.startHour) * HOUR_HEIGHT, 26)
            if (hiddenByDrag && !temp) return null

            return (
              <div
                key={ev.id}
                data-event
                className="absolute px-[2px]"
                style={{
                  top,
                  height,
                  left: `${(lane / lanes) * 100}%`,
                  width: `${(1 / lanes) * 100}%`,
                  zIndex: hiddenByDrag ? 40 : 10,
                }}
              >
                <motion.div
                  layout={false}
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  className={cn(
                    "group relative flex h-full cursor-grab flex-col overflow-hidden rounded-[10px] border px-2 py-1 pl-2.5 transition-shadow active:cursor-grabbing",
                    done
                      ? "border-neutral-200/60 bg-neutral-100/80 dark:border-neutral-800/60 dark:bg-neutral-800/60"
                      : "border-black/[0.06] hover:shadow-lg dark:border-white/[0.08]"
                  )}
                  style={!done ? { backgroundColor: ev.color || DEFAULT_COLOR } : undefined}
                  onPointerDown={(e) => onEventPointerDown(e, ev, "move")}
                >
                  {/* accent bar */}
                  {!done && (
                    <span
                      className="absolute inset-y-0 left-0 w-[3.5px]"
                      style={{ backgroundColor: accentFor(ev.color || DEFAULT_COLOR) }}
                    />
                  )}
                  <div className="flex min-h-0 w-full items-start justify-between gap-1">
                    <p className={cn(
                      "min-w-0 truncate text-xs font-semibold leading-tight",
                      done ? "text-neutral-400 line-through dark:text-neutral-500" : "text-neutral-900"
                    )}>
                      {ev.taskId && <ListTodo className="mr-1 inline h-3 w-3 align-[-1px]" />}
                      {ev.title}
                    </p>
                    <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                      <button
                        onPointerDown={(e) => e.stopPropagation()}
                        onClick={(e) => { e.stopPropagation(); onToggle(ev.id) }}
                        className={cn(
                          "flex h-4 w-4 items-center justify-center rounded-full border transition-all",
                          done
                            ? "border-neutral-900 bg-neutral-900 text-white dark:border-neutral-200 dark:bg-neutral-200 dark:text-neutral-900"
                            : "border-neutral-500/60 hover:border-neutral-900 dark:hover:border-neutral-100"
                        )}
                        title={done ? "Mark not done" : "Mark done"}
                      >
                        {done && <Check className="h-2.5 w-2.5" />}
                      </button>
                      <button
                        onPointerDown={(e) => e.stopPropagation()}
                        onClick={(e) => { e.stopPropagation(); onDelete(ev.id) }}
                        className="flex h-4 w-4 items-center justify-center rounded-full text-neutral-500/70 hover:bg-black/10 hover:text-red-600 dark:hover:bg-white/10"
                        title="Delete"
                      >
                        <Trash2 className="h-2.5 w-2.5" />
                      </button>
                    </div>
                  </div>
                  <p
                    className="mt-0.5 truncate text-[10px] font-medium tabular-nums"
                    style={done ? undefined : { color: accentFor(ev.color || DEFAULT_COLOR) }}
                  >
                    {height > 28 ? `${fmtTime(ev.startHour)} – ${fmtTime(ev.endHour)}` : fmtTime(ev.startHour)}
                    {ev.category && height > 52 ? ` · ${ev.category}` : ""}
                  </p>

                  {/* resize handle */}
                  <div
                    data-resize
                    onPointerDown={(e) => onEventPointerDown(e, ev, "resize")}
                    className="absolute inset-x-0 bottom-0 h-2 cursor-ns-resize opacity-0 transition-opacity group-hover:opacity-100"
                  >
                    <div className="mx-auto mt-0.5 h-1 w-8 rounded-full bg-neutral-900/25 dark:bg-white/30" />
                  </div>
                </motion.div>
              </div>
            )
          })}

          {/* create ghost */}
          {createPreview && (
            <div
              className="pointer-events-none absolute left-0 right-0 z-30 px-[2px]"
              style={{ top: createPreview.top, height: createPreview.height }}
            >
              <div className="flex h-full items-center justify-center rounded-[10px] border-2 border-dashed border-neutral-900/50 bg-neutral-900/[0.06] dark:border-neutral-100/60 dark:bg-neutral-100/10">
                <span className="rounded-full bg-neutral-900 px-2 py-0.5 text-[10px] font-semibold text-white shadow dark:bg-white dark:text-neutral-900">
                  {fmtTime(createPreview.top / HOUR_HEIGHT)} –{" "}
                  {fmtTime((createPreview.top + createPreview.height) / HOUR_HEIGHT)}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/* ───────────────────────── event dialog ───────────────────────── */

function EventDialog({
  open,
  onClose,
  date,
  event,
  defaultStart,
  defaultEnd,
}: {
  open: boolean
  onClose: () => void
  date: string
  event?: RoutineEvent | null
  defaultStart?: number
  defaultEnd?: number
}) {
  const addEvent = useRoutineStore((s) => s.addEvent)
  const updateEvent = useRoutineStore((s) => s.updateEvent)
  const deleteEvent = useRoutineStore((s) => s.deleteEvent)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [category, setCategory] = useState("Other")
  const [color, setColor] = useState(DEFAULT_COLOR)
  const [startHour, setStartHour] = useState("9")
  const [endHour, setEndHour] = useState("10")

  const isEdit = !!event

  useEffect(() => {
    if (!open) return
    if (event) {
      setTitle(event.title)
      setDescription(event.description || "")
      setCategory(event.category || "Other")
      setColor(event.color || getRandomPastelColor())
      setStartHour(String(event.startHour))
      setEndHour(String(event.endHour))
    } else {
      setTitle("")
      setDescription("")
      setCategory("Other")
      setColor(getRandomPastelColor())
      setStartHour(String(defaultStart ?? 9))
      setEndHour(String(defaultEnd ?? 10))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const handleSave = () => {
    if (!title.trim()) return
    const sh = parseFloat(startHour)
    const eh = Math.max(parseFloat(endHour), sh + MIN_DUR / 60)
    if (isEdit) {
      updateEvent(event!.id, { title: title.trim(), description, category, color, startHour: sh, endHour: eh })
    } else {
      addEvent({ date, title: title.trim(), description, category, color, startHour: sh, endHour: eh })
    }
    onClose()
  }

  const handleDelete = () => {
    if (event) deleteEvent(event.id)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Block" : "New Event"}</DialogTitle>
          <DialogDescription>{format(new Date(date + "T00:00:00"), "EEEE, d MMMM yyyy")}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Event name" autoFocus
              onKeyDown={(e) => e.key === "Enter" && handleSave()} />
          </div>
          <div className="space-y-1.5">
            <Label>Notes</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} placeholder="Optional details..." />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>From</Label>
              <Select value={startHour} onValueChange={setStartHour}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TIME_OPTIONS.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>To</Label>
              <Select value={endHour} onValueChange={setEndHour}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TIME_OPTIONS.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Color</Label>
            <div className="flex flex-wrap gap-1.5">
              {EVENT_COLORS.map((c) => (
                <button key={c.bg} onClick={() => setColor(c.bg)}
                  className={cn(
                    "relative h-7 w-7 rounded-[10px] border-2 transition-all active:scale-95",
                    color === c.bg ? "scale-110 shadow-md" : "border-transparent hover:scale-105"
                  )}
                  style={{
                    backgroundColor: c.bg,
                    borderColor: color === c.bg ? c.accent : undefined,
                    boxShadow: color === c.bg ? `0 0 0 2px ${c.accent}40` : undefined,
                  }}
                  title={c.accent}
                >
                  {color === c.bg && (
                    <Check className="absolute inset-0 m-auto h-3 w-3" style={{ color: c.accent }} />
                  )}
                </button>
              ))}
              <button onClick={() => {
                const pick = EVENT_COLORS[Math.floor(Math.random() * EVENT_COLORS.length)]
                setColor(pick.bg)
              }}
                className="flex h-7 w-7 items-center justify-center rounded-[10px] border border-dashed border-neutral-300 text-neutral-400 hover:border-neutral-500 dark:border-neutral-600 dark:hover:border-neutral-300"
                title="Random color">
                <Plus className="h-3 w-3" />
              </button>
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            {isEdit && (
              <Button variant="outline" size="icon" className="h-9 w-9 shrink-0 text-red-500 hover:border-red-300 hover:bg-red-50 dark:hover:bg-red-950/40" onClick={handleDelete}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
            <Button className="w-full" onClick={handleSave} disabled={!title.trim()}>
              {isEdit ? "Save Changes" : "Create"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

/* ───────────────────────── task dialog → Tasks page ───────────────────────── */

function TaskDialog({
  open,
  onClose,
  date,
  defaultStart,
}: {
  open: boolean
  onClose: () => void
  date: string
  defaultStart: number
}) {
  const addTask = useTaskStore((s) => s.addTask)
  const storedProjects = useTaskStore((s) => s.projects)
  const allTasks = useTaskStore((s) => s.tasks)
  const addEvent = useRoutineStore((s) => s.addEvent)

  const projects = useMemo(
    () => [...new Set([...storedProjects, ...allTasks.map((t) => t.project).filter(Boolean)])].sort(),
    [storedProjects, allTasks]
  )

  const [title, setTitle] = useState("")
  const [project, setProject] = useState("")
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium")
  const [dueDate, setDueDate] = useState(date)
  const [schedule, setSchedule] = useState(true)
  const [sh, setSh] = useState(String(defaultStart))
  const [eh, setEh] = useState(String(defaultStart + 1))

  useEffect(() => {
    if (!open) return
    setTitle("")
    setProject("")
    setPriority("medium")
    setDueDate(date)
    setSchedule(true)
    const snapped = Math.floor(defaultStart * 2) / 2
    setSh(String(snapped))
    setEh(String(Math.min(23.75, snapped + 1)))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const handleSave = () => {
    if (!title.trim()) return
    addTask({
      title: title.trim(),
      description: "",
      project: project.trim() || "Inbox",
      priority,
      dueDate,
      reminder: null,
      subtasks: [],
    })
    if (schedule) {
      const start = parseFloat(sh)
      const end = Math.max(parseFloat(eh), start + MIN_DUR / 60)
      // link the calendar block to the freshly created task (prepended in store)
      const created = useTaskStore.getState().tasks[0]
      addEvent({
        date,
        title: title.trim(),
        taskId: created?.id,
        category: "Task",
        color: DEFAULT_COLOR,
        startHour: start,
        endHour: end,
      })
    }
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ListTodo className="h-4 w-4" /> New Task
          </DialogTitle>
          <DialogDescription>Goes straight to your Tasks page{schedule ? " + this calendar" : ""}. Mark it done anywhere and it lands in Archive.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Task</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="What needs doing?" autoFocus
              onKeyDown={(e) => e.key === "Enter" && handleSave()} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Project</Label>
              <Input value={project} onChange={(e) => setProject(e.target.value)} placeholder="Inbox" list="routine-project-list" />
              <datalist id="routine-project-list">
                {projects.map((p) => <option key={p} value={p} />)}
              </datalist>
            </div>
            <div className="space-y-1.5">
              <Label>Priority</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as typeof priority)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Due date</Label>
            <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </div>

          <button
            onClick={() => setSchedule(!schedule)}
            className="flex w-full items-center justify-between rounded-[10px] border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-left transition-colors hover:bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:bg-neutral-800"
          >
            <div>
              <p className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">Show on calendar</p>
              <p className="text-[10px] text-neutral-500">Reserve a time slab for it below</p>
            </div>
            <span className={cn("relative h-5 w-9 rounded-full transition-colors", schedule ? "bg-neutral-900 dark:bg-white" : "bg-neutral-300 dark:bg-neutral-700")}>
              <span className={cn("absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all dark:bg-neutral-950", schedule ? "left-[18px]" : "left-0.5")} />
            </span>
          </button>

          {schedule && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>From</Label>
                <Select value={sh} onValueChange={setSh}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TIME_OPTIONS.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>To</Label>
                <Select value={eh} onValueChange={setEh}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TIME_OPTIONS.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <Button className="w-full" onClick={handleSave} disabled={!title.trim()}>
            Add Task
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

/* ───────────────────────── archive view ───────────────────────── */

function ArchiveView() {
  const tasks = useTaskStore((s) => s.tasks)
  const deleteTask = useTaskStore((s) => s.deleteTask)
  const clearCompleted = useTaskStore((s) => s.clearCompleted)
  const archives = useRoutineStore((s) => s.archives)

  const completedTasks = useMemo(
    () => tasks.filter((t) => t.completed).sort((a, b) => b.createdAt - a.createdAt),
    [tasks]
  )

  return (
    <div className="space-y-6">
      {/* completed tasks */}
      <section className="rounded-[14px] border border-neutral-200/70 bg-white p-4 shadow-sm dark:border-neutral-800/70 dark:bg-neutral-900">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-neutral-100 dark:bg-neutral-800">
              <Check className="h-4 w-4 text-neutral-600 dark:text-neutral-300" />
            </div>
            <div>
              <h3 className="text-sm font-bold tracking-tight text-neutral-900 dark:text-white">Completed Tasks</h3>
              <p className="text-[11px] text-neutral-400">{completedTasks.length} finished</p>
            </div>
          </div>
          {completedTasks.length > 0 && (
            <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs" onClick={() => clearCompleted()}>
              <Trash2 className="h-3 w-3" /> Clear all
            </Button>
          )}
        </div>

        {completedTasks.length === 0 ? (
          <div className="flex flex-col items-center gap-1.5 rounded-[10px] border-2 border-dashed border-neutral-200 py-10 dark:border-neutral-800">
            <Check className="h-5 w-5 text-neutral-300 dark:text-neutral-600" />
            <p className="text-xs text-neutral-400">No completed tasks yet — finish one and it lands here.</p>
          </div>
        ) : (
          <ul className="divide-y divide-neutral-100 dark:divide-neutral-800/60">
            {completedTasks.map((t) => (
              <li key={t.id} className="group flex items-center gap-3 py-2.5">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-neutral-900 text-white dark:bg-white dark:text-neutral-900">
                  <Check className="h-3 w-3" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-neutral-500 line-through dark:text-neutral-400">{t.title}</p>
                  <p className="text-[10px] text-neutral-400">
                    {t.project}{t.dueDate ? ` · due ${format(new Date(t.dueDate + "T00:00:00"), "d MMM")}` : ""}
                  </p>
                </div>
                <button
                  onClick={() => deleteTask(t.id)}
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[10px] text-neutral-300 opacity-0 transition-all hover:bg-red-50 hover:text-red-500 group-hover:opacity-100 dark:text-neutral-600 dark:hover:bg-red-950/40"
                  title="Delete forever"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* archived routine days */}
      <section className="rounded-[14px] border border-neutral-200/70 bg-white p-4 shadow-sm dark:border-neutral-800/70 dark:bg-neutral-900">
        <div className="mb-3 flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-neutral-100 dark:bg-neutral-800">
            <Archive className="h-4 w-4 text-neutral-600 dark:text-neutral-300" />
          </div>
          <div>
            <h3 className="text-sm font-bold tracking-tight text-neutral-900 dark:text-white">Archived Days</h3>
            <p className="text-[11px] text-neutral-400">Older than 15 days · auto-cleaned</p>
          </div>
        </div>

        {archives.length === 0 ? (
          <div className="flex flex-col items-center gap-1.5 rounded-[10px] border-2 border-dashed border-neutral-200 py-10 dark:border-neutral-800">
            <CalendarRange className="h-5 w-5 text-neutral-300 dark:text-neutral-600" />
            <p className="text-xs text-neutral-400">Nothing archived yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {[...archives].sort((a, b) => b.date.localeCompare(a.date)).map((a) => (
              <div key={a.date + a.archivedAt} className="rounded-[10px] border border-neutral-200 bg-neutral-50 p-3 dark:border-neutral-800 dark:bg-neutral-950">
                <p className="mb-2 text-xs font-semibold text-neutral-500 dark:text-neutral-400">
                  {format(new Date(a.date + "T00:00:00"), "EEEE, d MMM yyyy")}
                </p>
                <div className="space-y-1">
                  {a.events.sort((x, y) => x.startHour - y.startHour).map((e) => (
                    <div key={e.id} className="flex items-center gap-2 text-sm">
                      <Clock className="h-3 w-3 shrink-0 text-neutral-400" />
                      <span className={cn("truncate text-neutral-600 dark:text-neutral-300", e.completed && "line-through opacity-60")}>{e.title}</span>
                      <span className="ml-auto shrink-0 text-[10px] tabular-nums text-neutral-400">{fmtTime(e.startHour)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

/* ───────────────────────── page ───────────────────────── */

export default function RoutinePage() {
  const [tab, setTab] = useState<"calendar" | "archive">("calendar")
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [dialogOpen, setDialogOpen] = useState(false)
  const [taskOpen, setTaskOpen] = useState(false)
  const [editEvent, setEditEvent] = useState<RoutineEvent | null>(null)
  const [slot, setSlot] = useState({ start: 9, end: 10 })
  const [scrollSignal, setScrollSignal] = useState(0)

  const events = useRoutineStore((s) => s.events)
  const archiveOldEvents = useRoutineStore((s) => s.archiveOldEvents)
  const toggleComplete = useRoutineStore((s) => s.toggleComplete)
  const deleteEvent = useRoutineStore((s) => s.deleteEvent)
  const updateEvent = useRoutineStore((s) => s.updateEvent)

  const tasks = useTaskStore((s) => s.tasks)

  const dateString = useMemo(() => format(selectedDate, "yyyy-MM-dd"), [selectedDate])
  const dayEvents = useMemo(() => events.filter((e) => e.date === dateString), [events, dateString])
  const taskCompleted = useCallback(
    (taskId?: string) => (taskId ? !!tasks.find((t) => t.id === taskId)?.completed : false),
    [tasks]
  )

  useEffect(() => { archiveOldEvents() }, [archiveOldEvents])

  const openCreate = useCallback((startH: number, endH: number) => {
    setEditEvent(null)
    setSlot({ start: startH, end: endH })
    setDialogOpen(true)
  }, [])

  const openEdit = useCallback((ev: RoutineEvent) => {
    setEditEvent(ev)
    setDialogOpen(true)
  }, [])

  const handleDelete = useCallback((id: string) => {
    deleteEvent(id)
    setEditEvent((cur) => (cur?.id === id ? null : cur))
  }, [deleteEvent])

  const completedCount = dayEvents.filter((e) => e.completed || taskCompleted(e.taskId)).length
  const totalCount = dayEvents.length

  return (
    <DashboardShell>
      <div className="space-y-4 pb-4">
        {/* header: tabs + actions */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex w-fit rounded-[10px] bg-neutral-100 p-1 dark:bg-neutral-800/70">
            {(["calendar", "archive"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={cn(
                  "relative flex items-center gap-1.5 rounded-[8px] px-4 py-1.5 text-xs font-semibold capitalize transition-colors",
                  tab === t
                    ? "bg-white text-neutral-900 shadow-sm dark:bg-neutral-950 dark:text-white"
                    : "text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200"
                )}
              >
                {t === "calendar" ? <CalendarDays className="h-3.5 w-3.5" /> : <Archive className="h-3.5 w-3.5" />}
                {t}
                {t === "archive" && (
                  <span className="rounded-full bg-neutral-200 px-1.5 text-[9px] font-bold text-neutral-600 dark:bg-neutral-700 dark:text-neutral-200">
                    {tasks.filter((x) => x.completed).length}
                  </span>
                )}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => openCreate(slot.start, slot.end)}
              className="flex h-9 items-center gap-1.5 rounded-[10px] border border-neutral-200 bg-white px-3 text-xs font-medium text-neutral-700 transition-all hover:border-neutral-900 hover:bg-neutral-900 hover:text-white dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-200 dark:hover:border-neutral-100 dark:hover:bg-neutral-100 dark:hover:text-neutral-900"
            >
              <Plus className="h-3.5 w-3.5" /> Event
            </button>
            <button
              onClick={() => setTaskOpen(true)}
              className="flex h-9 items-center gap-1.5 rounded-[10px] bg-neutral-900 px-3 text-xs font-medium text-white shadow-sm transition-all hover:bg-neutral-700 active:scale-[0.98] dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
            >
              <ListTodo className="h-3.5 w-3.5" /> Task
            </button>
          </div>
        </div>

        {tab === "calendar" ? (
          <>
            {/* date nav */}
            <div className="flex items-center gap-2">
              <div className="flex overflow-hidden rounded-[10px] border border-neutral-200 dark:border-neutral-800">
                <button
                  onClick={() => setSelectedDate((d) => addDays(d, -1))}
                  className="flex h-8 w-8 items-center justify-center text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900 dark:hover:bg-neutral-800 dark:hover:text-white"
                ><ChevronLeft className="h-4 w-4" /></button>
                <button
                  onClick={() => { setSelectedDate(new Date()); setScrollSignal((n) => n + 1) }}
                  className="border-x border-neutral-200 px-3 text-xs font-semibold text-neutral-700 transition-colors hover:bg-neutral-100 dark:border-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-800"
                >Today</button>
                <button
                  onClick={() => setSelectedDate((d) => addDays(d, 1))}
                  className="flex h-8 w-8 items-center justify-center text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900 dark:hover:bg-neutral-800 dark:hover:text-white"
                ><ChevronRight className="h-4 w-4" /></button>
              </div>
              <span className="text-sm font-bold tracking-tight text-neutral-900 dark:text-white">
                {format(selectedDate, "d MMM yyyy")}
              </span>
              {isToday(selectedDate) && (
                <span className="rounded-full bg-neutral-900 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white dark:bg-white dark:text-neutral-900">
                  Today
                </span>
              )}
            </div>

            <DateScroller selectedDate={selectedDate} onSelect={(d) => { setSelectedDate(d); setScrollSignal((n) => n + 1) }} />

            {totalCount > 0 && (
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
                <motion.div
                  className="h-full rounded-full bg-neutral-900 dark:bg-white"
                  initial={{ width: 0 }}
                  animate={{ width: `${(completedCount / totalCount) * 100}%` }}
                  transition={{ duration: 0.4 }}
                />
              </div>
            )}

            <TimeGrid
              events={dayEvents}
              taskDone={taskCompleted}
              onToggle={toggleComplete}
              onDelete={handleDelete}
              onEdit={openEdit}
              onCreateSlot={openCreate}
              onMoveCommit={(id, s, e) =>
                updateEvent(id, { startHour: s, endHour: Math.max(e, s + MIN_DUR / 60), date: dateString })
              }
              onResizeCommit={(id, e) => {
                const ev = dayEvents.find((x) => x.id === id)
                if (ev) updateEvent(id, { endHour: Math.max(e, ev.startHour + MIN_DUR / 60) })
              }}
              scrollSignal={scrollSignal}
            />

            <p className="text-center text-[10px] text-neutral-400 dark:text-neutral-500">
              Drag empty space to create · drag blocks to move · pull bottom edge to resize
            </p>
          </>
        ) : (
          <ArchiveView />
        )}

        {/* dialogs */}
        <EventDialog
          open={dialogOpen}
          onClose={() => { setDialogOpen(false); setEditEvent(null) }}
          date={dateString}
          event={editEvent}
          defaultStart={slot.start}
          defaultEnd={slot.end}
        />
        <TaskDialog
          open={taskOpen}
          onClose={() => setTaskOpen(false)}
          date={dateString}
          defaultStart={slot.start}
        />
      </div>
    </DashboardShell>
  )
}
