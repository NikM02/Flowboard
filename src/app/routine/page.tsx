"use client"

import { useState, useEffect, useMemo, useRef, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { format, addDays, isToday, isSameDay } from "date-fns"
import {
  Plus, X, Check, Trash2, Clock, Archive, CalendarDays, Pencil,
} from "lucide-react"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { useRoutineStore, type RoutineEvent, getRandomPastelColor } from "@/store/use-routine-store"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/shadcn-utils"

const HOURS = Array.from({ length: 24 }, (_, i) => i)
const HOUR_HEIGHT = 64
const CATEGORIES = ["Work", "Personal", "Health", "Learning", "Other"]
const PASTEL_COLORS = [
  "#fce4ec", "#f3e5f5", "#e8eaf6", "#e3f2fd", "#e0f7fa",
  "#e8f5e9", "#f1f8e9", "#fffde7", "#fff8e1", "#fff3e0",
  "#fbe9e7", "#f9ebea", "#eaf2f8", "#f0f3f4", "#fdf2e9",
  "#ebf5fb", "#f5eef8", "#e9f7ef", "#fef9e7", "#fdedec",
]

function formatHour(h: number) {
  if (h === 0) return "12:00 AM"
  if (h < 12) return `${h}:00 AM`
  if (h === 12) return "12:00 PM"
  return `${h - 12}:00 PM`
}

const TIME_OPTIONS = HOURS.map((h) => ({
  value: String(h),
  label: formatHour(h),
}))

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
    if (scrollRef.current) {
      const todayIdx = dates.findIndex((d) => isSameDay(d, selectedDate))
      if (todayIdx >= 0) {
        const el = scrollRef.current.children[todayIdx] as HTMLElement
        el?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" })
      }
    }
  }, [selectedDate, dates])

  return (
    <div className="relative">
      <div ref={scrollRef} className="flex gap-1.5 overflow-x-auto scrollbar-none pb-2">
        {dates.map((d) => {
          const active = isSameDay(d, selectedDate)
          const today = isToday(d)
          return (
            <button
              key={d.toISOString()}
              onClick={() => onSelect(d)}
              className={cn(
                "flex shrink-0 flex-col items-center rounded-[10px] px-3 py-2 text-xs font-medium transition-all",
                active
                  ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
                  : today
                  ? "border-2 border-neutral-900 bg-white text-neutral-900 dark:border-neutral-800 dark:bg-neutral-900 dark:text-white"
                  : "border border-neutral-200 bg-white text-neutral-500 hover:border-neutral-300 hover:text-neutral-700 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400 dark:hover:border-neutral-700"
              )}
            >
              <span className="text-[9px] uppercase tracking-wider opacity-60">{format(d, "EEE")}</span>
              <span className="text-sm font-bold">{format(d, "d")}</span>
              <span className="text-[9px] opacity-60">{format(d, "MMM")}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function TimeGrid({
  events,
  onToggle,
  onDelete,
  onEdit,
  onDragCreate,
}: {
  events: RoutineEvent[]
  onToggle: (id: string) => void
  onDelete: (id: string) => void
  onEdit: (event: RoutineEvent) => void
  onDragCreate: (startHour: number, endHour: number) => void
}) {
  const gridRef = useRef<HTMLDivElement>(null)
  const [dragging, setDragging] = useState(false)
  const [dragStart, setDragStart] = useState<number | null>(null)
  const [dragEnd, setDragEnd] = useState<number | null>(null)

  const getHourFromY = useCallback((y: number) => {
    if (!gridRef.current) return 0
    const rect = gridRef.current.getBoundingClientRect()
    const relativeY = y - rect.top + gridRef.current.scrollTop
    return Math.max(0, Math.min(23, Math.floor(relativeY / HOUR_HEIGHT)))
  }, [])

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("[data-event]")) return
    const hour = getHourFromY(e.clientY)
    setDragging(true)
    setDragStart(hour)
    setDragEnd(hour)
  }, [getHourFromY])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragging) return
    const hour = getHourFromY(e.clientY)
    setDragEnd(hour)
  }, [dragging, getHourFromY])

  const handleMouseUp = useCallback(() => {
    if (!dragging || dragStart === null || dragEnd === null) {
      setDragging(false)
      return
    }
    const start = Math.min(dragStart, dragEnd)
    const end = Math.max(dragStart, dragEnd) + 1
    if (start < end) {
      onDragCreate(start, end)
    }
    setDragging(false)
    setDragStart(null)
    setDragEnd(null)
  }, [dragging, dragStart, dragEnd, onDragCreate])

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if ((e.target as HTMLElement).closest("[data-event]")) return
    const hour = getHourFromY(e.touches[0].clientY)
    setDragging(true)
    setDragStart(hour)
    setDragEnd(hour)
  }, [getHourFromY])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!dragging) return
    const hour = getHourFromY(e.touches[0].clientY)
    setDragEnd(hour)
  }, [dragging, getHourFromY])

  const handleTouchEnd = useCallback(() => {
    handleMouseUp()
  }, [handleMouseUp])

  const dragPreview = useMemo(() => {
    if (!dragging || dragStart === null || dragEnd === null) return null
    const start = Math.min(dragStart, dragEnd)
    const end = Math.max(dragStart, dragEnd) + 1
    return { start, end, height: (end - start) * HOUR_HEIGHT }
  }, [dragging, dragStart, dragEnd])

  return (
    <div
      ref={gridRef}
      className="relative overflow-y-auto rounded-[14px] border border-neutral-200/50 bg-white dark:border-neutral-800/50 dark:bg-neutral-900"
      style={{ height: 24 * HOUR_HEIGHT }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {HOURS.map((hour) => {
        const isNow = new Date().getHours() === hour
        return (
          <div
            key={hour}
            className={cn(
              "relative border-b border-neutral-100 dark:border-neutral-800/50",
              isNow && "bg-neutral-50/80 dark:bg-neutral-800/20"
            )}
            style={{ height: HOUR_HEIGHT }}
          >
            <div className="absolute left-0 top-0 flex w-16 items-start gap-2 pl-3 pt-1">
              <div className={cn(
                "h-1.5 w-1.5 shrink-0 rounded-full",
                isNow ? "bg-neutral-900 dark:bg-white" : "bg-neutral-300 dark:bg-neutral-600"
              )} />
              <span className={cn(
                "text-[11px] font-medium",
                isNow ? "text-neutral-900 dark:text-white font-bold" : "text-neutral-400 dark:text-neutral-500"
              )}>
                {formatHour(hour)}
              </span>
            </div>
          </div>
        )
      })}

      {events.map((event) => {
        const top = event.startHour * HOUR_HEIGHT
        const height = (event.endHour - event.startHour) * HOUR_HEIGHT
        return (
          <motion.div
            key={event.id}
            data-event
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={cn(
              "group absolute left-20 right-3 cursor-pointer rounded-[10px] border px-3 py-2 transition-all hover:shadow-md",
              event.completed
                ? "border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900/50"
                : "border-transparent hover:shadow-lg"
            )}
            style={{
              top,
              height: Math.max(height, 32),
              backgroundColor: event.completed ? undefined : (event.color || "#f0f0f0"),
            }}
            onClick={() => onEdit(event)}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className={cn(
                  "text-sm font-medium truncate",
                  event.completed ? "text-neutral-400 line-through dark:text-neutral-500" : "text-neutral-900 dark:text-white"
                )}>
                  {event.title}
                </p>
                <p className="text-[10px] text-neutral-400 dark:text-neutral-500">
                  {formatHour(event.startHour)} – {formatHour(event.endHour)}
                </p>
                {event.category && (
                  <span className="text-[10px] text-neutral-400 dark:text-neutral-500">{event.category}</span>
                )}
              </div>
              <div className="flex shrink-0 gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                <button
                  onClick={(e) => { e.stopPropagation(); onToggle(event.id) }}
                  className={cn(
                    "flex h-5 w-5 items-center justify-center rounded-[10px] border transition-all",
                    event.completed
                      ? "border-neutral-900 bg-neutral-900 text-white dark:border-neutral-800 dark:bg-white dark:text-neutral-900"
                      : "border-neutral-300 hover:border-neutral-500 dark:border-neutral-600"
                  )}
                >
                  {event.completed && <Check className="h-3 w-3" />}
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onDelete(event.id) }}
                  className="flex h-5 w-5 items-center justify-center rounded-[10px] text-neutral-300 hover:bg-red-50 hover:text-red-500 dark:text-neutral-600 dark:hover:bg-red-950/50"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            </div>
          </motion.div>
        )
      })}

      {dragPreview && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute left-20 right-3 rounded-[10px] border-2 border-dashed border-neutral-400 bg-neutral-100/80 dark:border-neutral-600 dark:bg-neutral-800/80"
          style={{ top: dragPreview.start * HOUR_HEIGHT, height: dragPreview.height }}
        >
          <div className="flex h-full items-center justify-center text-xs font-medium text-neutral-500 dark:text-neutral-400">
            {dragPreview.end - dragPreview.start}h block
          </div>
        </motion.div>
      )}
    </div>
  )
}

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
  const [title, setTitle] = useState("")
  const [category, setCategory] = useState("Other")
  const [color, setColor] = useState("#e3f2fd")
  const [startHour, setStartHour] = useState("9")
  const [endHour, setEndHour] = useState("10")

  const isEdit = !!event

  useEffect(() => {
    if (open) {
      if (event) {
        setTitle(event.title)
        setCategory(event.category || "Other")
        setColor(event.color || "#e3f2fd")
        setStartHour(String(event.startHour))
        setEndHour(String(event.endHour))
      } else {
        setTitle("")
        setCategory("Other")
        setColor(getRandomPastelColor())
        setStartHour(String(defaultStart ?? 9))
        setEndHour(String(defaultEnd ?? 10))
      }
    }
  }, [open, event, defaultStart, defaultEnd])

  const handleSave = () => {
    if (!title.trim()) return
    const sh = parseInt(startHour)
    const eh = parseInt(endHour)
    if (isEdit) {
      updateEvent(event!.id, {
        title: title.trim(),
        category,
        color,
        startHour: sh,
        endHour: eh,
      })
    } else {
      addEvent({
        date,
        title: title.trim(),
        category,
        color,
        startHour: sh,
        endHour: eh,
      })
    }
    setTitle("")
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Event" : "Add Event"}</DialogTitle>
          <DialogDescription>
            {format(new Date(date + "T00:00:00"), "EEEE, d MMMM yyyy")}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-2">
            <Label>Title</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Event name"
              autoFocus
              onKeyDown={(e) => e.key === "Enter" && handleSave()}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>From</Label>
              <Select value={startHour} onValueChange={setStartHour}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TIME_OPTIONS.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>To</Label>
              <Select value={endHour} onValueChange={setEndHour}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TIME_OPTIONS.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Color</Label>
            <div className="flex flex-wrap gap-2">
              {PASTEL_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={cn(
                    "h-7 w-7 rounded-[10px] border-2 transition-all",
                    color === c ? "border-neutral-900 scale-110 dark:border-neutral-200" : "border-transparent hover:scale-105"
                  )}
                  style={{ backgroundColor: c }}
                />
              ))}
              <button
                onClick={() => setColor(getRandomPastelColor())}
                className="flex h-7 w-7 items-center justify-center rounded-[10px] border border-dashed border-neutral-300 text-neutral-400 hover:border-neutral-500 dark:border-neutral-600 dark:hover:border-neutral-400"
                title="Random color"
              >
                <Plus className="h-3 w-3" />
              </button>
            </div>
          </div>
          <Button className="w-full" onClick={handleSave} disabled={!title.trim()}>
            {isEdit ? "Save Changes" : "Add Event"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function ArchivePanel({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const archives = useRoutineStore((s) => s.archives)

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Archive className="h-4 w-4" />
            Routine Archive
          </DialogTitle>
          <DialogDescription>Auto-cleaned every 15 days</DialogDescription>
        </DialogHeader>
        {archives.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-8 text-neutral-400">
            <CalendarDays className="h-8 w-8" />
            <p className="text-sm">No archived routines yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {archives.sort((a, b) => b.date.localeCompare(a.date)).map((archive) => (
              <div key={archive.date + archive.archivedAt} className="rounded-[10px] border border-neutral-200 bg-neutral-50 p-3 dark:border-neutral-800 dark:bg-neutral-900">
                <p className="mb-2 text-xs font-semibold text-neutral-500 dark:text-neutral-400">
                  {format(new Date(archive.date + "T00:00:00"), "EEEE, d MMMM yyyy")}
                </p>
                <div className="space-y-1">
                  {archive.events.map((e) => (
                    <div key={e.id} className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400">
                      <Clock className="h-3 w-3 shrink-0" />
                      <span className="truncate">{e.title}</span>
                      <span className="ml-auto text-[10px] text-neutral-400">{formatHour(e.startHour)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

export default function RoutinePage() {
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editEvent, setEditEvent] = useState<RoutineEvent | null>(null)
  const [addSlot, setAddSlot] = useState({ start: 9, end: 10 })
  const [archiveOpen, setArchiveOpen] = useState(false)

  const events = useRoutineStore((s) => s.events)
  const archiveOldEvents = useRoutineStore((s) => s.archiveOldEvents)
  const toggleComplete = useRoutineStore((s) => s.toggleComplete)
  const deleteEvent = useRoutineStore((s) => s.deleteEvent)

  const dateString = useMemo(() => format(selectedDate, "yyyy-MM-dd"), [selectedDate])
  const dayEvents = useMemo(() => events.filter((e) => e.date === dateString), [events, dateString])

  useEffect(() => { archiveOldEvents() }, [archiveOldEvents])

  const handleDragCreate = (startHour: number, endHour: number) => {
    setEditEvent(null)
    setAddSlot({ start: startHour, end: endHour })
    setDialogOpen(true)
  }

  const handleAddNew = () => {
    setEditEvent(null)
    setAddSlot({ start: 9, end: 10 })
    setDialogOpen(true)
  }

  const handleEditEvent = (event: RoutineEvent) => {
    setEditEvent(event)
    setDialogOpen(true)
  }

  const handleDelete = (id: string) => {
    deleteEvent(id)
    if (editEvent?.id === id) {
      setDialogOpen(false)
      setEditEvent(null)
    }
  }

  const completedCount = dayEvents.filter((e) => e.completed).length
  const totalCount = dayEvents.length

  return (
    <DashboardShell>
      <div className="mx-auto max-w-2xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-white sm:text-2xl">
              Routine
            </h1>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              {totalCount > 0 ? `${completedCount}/${totalCount} completed` : "Add events or drag on the time grid"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleAddNew}
              className="flex h-9 items-center gap-1.5 rounded-[10px] bg-neutral-900 px-3 text-xs font-medium text-white transition-all hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Event
            </button>
            <button
              onClick={() => setArchiveOpen(true)}
              className="flex h-9 items-center gap-1.5 rounded-[10px] border border-neutral-200 bg-white px-3 text-xs font-medium text-neutral-600 transition-all hover:border-neutral-300 hover:text-neutral-900 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-400 dark:hover:border-neutral-700 dark:hover:text-white"
            >
              <Archive className="h-3.5 w-3.5" />
              Archive
            </button>
          </div>
        </div>

        <DateScroller selectedDate={selectedDate} onSelect={setSelectedDate} />

        {totalCount > 0 && (
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
            <motion.div
              className="h-full rounded-full bg-neutral-900 dark:bg-white"
              initial={{ width: 0 }}
              animate={{ width: `${totalCount > 0 ? (completedCount / totalCount) * 100 : 0}%` }}
              transition={{ duration: 0.4 }}
            />
          </div>
        )}

        <TimeGrid
          events={dayEvents}
          onToggle={toggleComplete}
          onDelete={handleDelete}
          onEdit={handleEditEvent}
          onDragCreate={handleDragCreate}
        />

        <EventDialog
          open={dialogOpen}
          onClose={() => { setDialogOpen(false); setEditEvent(null) }}
          date={dateString}
          event={editEvent}
          defaultStart={addSlot.start}
          defaultEnd={addSlot.end}
        />

        <ArchivePanel open={archiveOpen} onClose={() => setArchiveOpen(false)} />
      </div>
    </DashboardShell>
  )
}
