"use client"

import { useState, useMemo, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from "@dnd-kit/core"
import type { DragStartEvent, DragEndEvent } from "@dnd-kit/core"
import { useDraggable, useDroppable } from "@dnd-kit/core"
import {
  Plus, Trash2, Pencil, LayoutGrid, List, Archive,
  Check, Calendar, ChevronDown, ChevronUp, GripVertical,
  Lightbulb, FileText, Video, Scissors, CheckCircle2, ArchiveIcon,
  AlarmClock, Layers,
} from "lucide-react"
import { cn } from "@/lib/shadcn-utils"
import { Button } from "@/components/ui/button"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useContentStore } from "@/store/use-content-store"
import type { ContentItem, ContentStatus } from "@/types"

const EMOJIS = ["🎬", "📝", "🎥", "💡", "🚀", "🎵", "📸", "🎯", "⭐", "🔥", "💎", "🌟", "🎨", "📱", "💻", "🎮", "🏆", "✨", "🎓", "📚"]

const columns: { key: ContentStatus; label: string; icon: typeof Lightbulb; color: string; bg: string; border: string; glow: string; dot: string }[] = [
  { key: "ideas", label: "Ideas", icon: Lightbulb, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-950/20", border: "border-amber-200/60 dark:border-amber-900/40", glow: "from-amber-200/40 dark:from-amber-500/10", dot: "bg-amber-500" },
  { key: "scripts", label: "Scripts", icon: FileText, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-950/20", border: "border-blue-200/60 dark:border-blue-900/40", glow: "from-blue-200/40 dark:from-blue-500/10", dot: "bg-blue-500" },
  { key: "filming", label: "Filming", icon: Video, color: "text-purple-600 dark:text-purple-400", bg: "bg-purple-50 dark:bg-purple-950/20", border: "border-purple-200/60 dark:border-purple-900/40", glow: "from-purple-200/40 dark:from-purple-500/10", dot: "bg-purple-500" },
  { key: "editing", label: "Editing", icon: Scissors, color: "text-orange-600 dark:text-orange-400", bg: "bg-orange-50 dark:bg-orange-950/20", border: "border-orange-200/60 dark:border-orange-900/40", glow: "from-orange-200/40 dark:from-orange-500/10", dot: "bg-orange-500" },
  { key: "published", label: "Published", icon: CheckCircle2, color: "text-green-600 dark:text-green-400", bg: "bg-green-50 dark:bg-green-950/20", border: "border-green-200/60 dark:border-green-900/40", glow: "from-green-200/40 dark:from-green-500/10", dot: "bg-green-500" },
]

function statusCol(key: ContentStatus) {
  return columns.find((c) => c.key === key)!
}

function getProgress(item: ContentItem): number {
  const statusOrder: ContentStatus[] = ["ideas", "scripts", "filming", "editing", "published"]
  const idx = statusOrder.indexOf(item.status)
  const statusBase = (idx / (statusOrder.length - 1)) * 100

  if (item.subtasks.length === 0) return Math.round(statusBase)

  const subtaskPct = (item.subtasks.filter((s) => s.completed).length / item.subtasks.length) * 100
  const stageWidth = 100 / (statusOrder.length - 1)
  const subtaskBonus = (subtaskPct / 100) * stageWidth

  return Math.round(Math.min(100, statusBase + subtaskBonus))
}

function DeadlinePill({ deadline }: { deadline: string }) {
  if (!deadline) return null
  const due = new Date(deadline + "T23:59:59")
  const now = new Date()
  const overdue = due.getTime() < now.getTime()
  const today = due.toDateString() === now.toDateString()
  const label = due.toLocaleDateString("en-US", { month: "short", day: "numeric" })

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold",
        overdue
          ? "bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400"
          : today
            ? "bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400"
            : "bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400"
      )}
    >
      <AlarmClock className="h-2.5 w-2.5" />
      {overdue ? `Overdue · ${label}` : label}
    </span>
  )
}

function ContentCard({
  item,
  isDragOverlay,
  onEdit,
}: {
  item: ContentItem
  isDragOverlay?: boolean
  onEdit: () => void
}) {
  const { deleteItem, toggleSubtask, addSubtask, deleteSubtask } = useContentStore()
  const [showSubtasks, setShowSubtasks] = useState(false)
  const [newSub, setNewSub] = useState("")

  const progress = getProgress(item)
  const col = statusCol(item.status)

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: item.id,
    data: { item },
  })

  const style = transform
    ? { transform: `translate(${transform.x}px, ${transform.y}px)` }
    : undefined

  const completedCount = item.subtasks.filter((s) => s.completed).length

  const handleAddSub = () => {
    if (!newSub.trim()) return
    addSubtask(item.id, newSub.trim())
    setNewSub("")
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group relative overflow-hidden rounded-2xl border p-4 transition-all duration-200",
        isDragOverlay
          ? "rotate-2 border-neutral-200 bg-white shadow-2xl shadow-neutral-500/20 ring-2 ring-neutral-300/50 dark:border-neutral-700 dark:bg-neutral-900 dark:shadow-black/40 dark:ring-neutral-600/30"
          : isDragging
            ? "border-neutral-300 bg-white opacity-40 dark:border-neutral-700 dark:bg-neutral-900"
            : "border-neutral-200/70 bg-white shadow-sm hover:-translate-y-0.5 hover:shadow-lg hover:shadow-neutral-200/40 dark:border-neutral-800 dark:bg-neutral-900 dark:shadow-none dark:hover:shadow-black/20"
      )}
    >
      {/* Top accent hairline */}
      <div className={cn("absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r to-transparent", col.glow)} />

      <div className="flex items-start gap-2.5">
        {/* Status-colored emoji tile */}
        <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-lg", col.bg)}>
          {item.emoji}
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="truncate text-sm font-semibold text-neutral-900 dark:text-neutral-50">{item.title}</h4>
          {item.description && (
            <p className="mt-0.5 line-clamp-2 text-xs text-neutral-500 dark:text-neutral-400">{item.description}</p>
          )}
        </div>
        <button
          {...attributes}
          {...listeners}
          aria-label="Drag to move"
          className="mt-0.5 shrink-0 cursor-grab touch-none rounded-md p-0.5 text-neutral-300 transition-colors hover:text-neutral-500 dark:text-neutral-600 dark:hover:text-neutral-400"
        >
          <GripVertical className="h-4 w-4" />
        </button>
      </div>

      {/* Meta row */}
      <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
        <DeadlinePill deadline={item.deadline} />
        {item.subtasks.length > 0 && (
          <span className="inline-flex items-center gap-1 rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-medium text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400">
            <Layers className="h-2.5 w-2.5" />
            {completedCount}/{item.subtasks.length}
          </span>
        )}
      </div>

      {/* Progress */}
      <div className="mt-2.5">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-medium uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
            Progress
          </span>
          <span className={cn("text-[10px] font-bold", progress === 100 ? col.color : "text-neutral-500 dark:text-neutral-400")}>
            {progress}%
          </span>
        </div>
        <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
          <motion.div
            className={cn("h-full rounded-full bg-gradient-to-r", col.color.startsWith("text-green") || progress === 100 ? "from-green-500 to-green-400" : "from-neutral-900 to-neutral-500 dark:from-neutral-50 dark:to-neutral-400")}
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          />
        </div>
      </div>

      {/* Subtasks toggle */}
      {item.subtasks.length > 0 && (
        <button
          onClick={() => setShowSubtasks(!showSubtasks)}
          className="mt-2 flex w-full items-center gap-1 text-[11px] font-medium text-neutral-400 transition-colors hover:text-neutral-600 dark:hover:text-neutral-300"
        >
          {showSubtasks ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          {showSubtasks ? "Hide" : "Manage"} subtasks ({completedCount}/{item.subtasks.length})
        </button>
      )}

      <AnimatePresence>
        {showSubtasks && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="mt-2 space-y-1 overflow-hidden"
          >
            {item.subtasks.map((st) => (
              <div key={st.id} className="flex items-center gap-2 rounded-lg bg-neutral-50 px-2 py-1.5 dark:bg-neutral-800/60">
                <button
                  onClick={() => toggleSubtask(item.id, st.id)}
                  className={cn(
                    "flex h-4 w-4 shrink-0 items-center justify-center rounded-md border transition-colors",
                    st.completed
                      ? "border-green-500 bg-green-500 text-white"
                      : "border-neutral-300 hover:border-neutral-400 dark:border-neutral-600"
                  )}
                >
                  {st.completed && <Check className="h-3 w-3" />}
                </button>
                <span className={cn("flex-1 text-xs", st.completed ? "text-neutral-400 line-through dark:text-neutral-600" : "text-neutral-700 dark:text-neutral-300")}>
                  {st.title}
                </span>
                <button onClick={() => deleteSubtask(item.id, st.id)} aria-label="Delete subtask" className="shrink-0 text-neutral-300 hover:text-red-400 dark:text-neutral-600">
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add subtask + actions */}
      <div className="mt-2.5 flex items-center gap-1.5">
        <Input
          value={newSub}
          onChange={(e) => setNewSub(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAddSub()}
          placeholder="Add a step..."
          className="h-7 flex-1 text-xs"
        />
        <Button size="sm" variant="ghost" className="h-7 px-2" onClick={handleAddSub} disabled={!newSub.trim()}>
          <Plus className="h-3 w-3" />
        </Button>
        <div className="ml-auto flex gap-1">
          <button onClick={onEdit} aria-label="Edit" className="rounded-lg bg-neutral-100 p-1.5 text-neutral-500 transition-colors hover:bg-neutral-200 hover:text-neutral-800 dark:bg-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-700 dark:hover:text-neutral-100">
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button onClick={() => deleteItem(item.id)} aria-label="Delete" className="rounded-lg bg-neutral-100 p-1.5 text-neutral-500 transition-colors hover:bg-red-100 hover:text-red-600 dark:bg-neutral-800 dark:text-neutral-400 dark:hover:bg-red-950/60 dark:hover:text-red-400">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}

function KanbanColumn({ status, items, onEdit }: { status: ContentStatus; items: ContentItem[]; onEdit: (item: ContentItem) => void }) {
  const col = columns.find((c) => c.key === status)!
  const Icon = col.icon

  const { setNodeRef, isOver } = useDroppable({ id: status })

  return (
    <div
      className={cn(
        "relative flex max-h-[calc(100vh-250px)] w-[78vw] snap-start flex-col overflow-hidden rounded-2xl border transition-all sm:w-[290px] md:w-[310px]",
        isOver
          ? cn("border-neutral-300 ring-2 ring-neutral-300/60 dark:border-neutral-600 dark:ring-neutral-600/40", col.bg)
          : cn("border-neutral-200/70 bg-neutral-50/60 backdrop-blur-sm dark:border-neutral-800/80 dark:bg-neutral-900/40")
      )}
    >
      {/* Column tint glow */}
      <div className={cn("pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b to-transparent", col.glow)} />

      <div className="relative z-10 flex items-center gap-2.5 border-b border-neutral-200/70 px-3.5 py-3 dark:border-neutral-800/70">
        <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg", col.bg)}>
          <Icon className={cn("h-4 w-4", col.color)} />
        </div>
        <span className="text-sm font-bold text-neutral-900 dark:text-neutral-50">{col.label}</span>
        <span className={cn("ml-auto flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-bold text-white", col.dot)}>
          {items.length}
        </span>
      </div>

      <div ref={setNodeRef} className={cn("relative z-10 min-h-[120px] flex-1 space-y-2.5 overflow-y-auto p-2.5 transition-colors", isOver && "bg-white/40 dark:bg-white/5")}>
        <AnimatePresence mode="popLayout">
          {items.map((item) => (
            <ContentCard key={item.id} item={item} onEdit={() => onEdit(item)} />
          ))}
        </AnimatePresence>
        {items.length === 0 && (
          <div className={cn("flex flex-col items-center justify-center rounded-2xl border-2 border-dashed py-10 transition-colors", isOver ? "border-neutral-300 bg-white/50 dark:border-neutral-500 dark:bg-white/5" : "border-neutral-200 dark:border-neutral-800")}>
            <p className="text-xs font-medium text-neutral-400 dark:text-neutral-500">Drop items here</p>
          </div>
        )}
      </div>
    </div>
  )
}

function ListView({ items, onEdit }: { items: ContentItem[]; onEdit: (item: ContentItem) => void }) {
  return (
    <div className="space-y-2">
      {items.map((item) => {
        const progress = getProgress(item)
        const col = statusCol(item.status)
        const Icon = col.icon
        return (
          <motion.div
            key={item.id}
            layout
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="group flex items-center gap-3 rounded-2xl border border-neutral-200/70 bg-white p-3 shadow-sm transition-all hover:shadow-md dark:border-neutral-800 dark:bg-neutral-900 dark:shadow-none"
          >
            <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-base", col.bg)}>
              {item.emoji}
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="truncate text-sm font-semibold text-neutral-900 dark:text-neutral-50">{item.title}</h4>
              <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11px] text-neutral-400 dark:text-neutral-500">
                <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-semibold", col.bg, col.color)}>
                  <Icon className="h-3 w-3" /> {col.label}
                </span>
                {item.deadline && (
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(item.deadline + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </span>
                )}
                {item.subtasks.length > 0 && (
                  <span className="flex items-center gap-1">
                    <Layers className="h-3 w-3" />
                    {item.subtasks.filter((s) => s.completed).length}/{item.subtasks.length}
                  </span>
                )}
              </div>
            </div>
            <div className="hidden w-28 sm:block">
              <div className="flex items-center justify-end text-[10px] font-bold text-neutral-500 dark:text-neutral-400">
                {progress}%
              </div>
              <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
                <div
                  className={cn("h-full rounded-full transition-all", progress === 100 ? "bg-green-500" : "bg-neutral-900 dark:bg-neutral-50")}
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
            <div className="flex gap-1">
              <button onClick={() => onEdit(item)} aria-label="Edit" className="rounded-lg bg-neutral-100 p-1.5 text-neutral-500 transition-colors hover:bg-neutral-200 hover:text-neutral-800 dark:bg-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-700 dark:hover:text-neutral-100">
                <Pencil className="h-3.5 w-3.5" />
              </button>
              <button onClick={() => useContentStore.getState().deleteItem(item.id)} aria-label="Delete" className="rounded-lg bg-neutral-100 p-1.5 text-neutral-500 transition-colors hover:bg-red-100 hover:text-red-600 dark:bg-neutral-800 dark:text-neutral-400 dark:hover:bg-red-950/60 dark:hover:text-red-400">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}

function ArchiveTab() {
  const { items, unarchiveItem, clearArchived } = useContentStore()
  const archived = items.filter((i) => i.status === "published" && i.archivedAt)

  return (
    <div className="space-y-4">
      {archived.length > 0 && (
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={clearArchived} className="gap-2 text-red-500 hover:text-red-600">
            <Trash2 className="h-3.5 w-3.5" /> Clear Archive
          </Button>
        </div>
      )}
      {archived.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-neutral-200 py-16 dark:border-neutral-800">
          <ArchiveIcon className="mb-3 h-10 w-10 text-neutral-300 dark:text-neutral-600" />
          <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">No published content yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {archived.map((item) => {
            const progress = getProgress(item)
            const col = statusCol(item.status)
            return (
              <div key={item.id} className="group flex items-center gap-3 rounded-2xl border border-green-200/60 bg-green-50/40 p-3 dark:border-green-900/30 dark:bg-green-950/10">
                <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-base", col.bg)}>
                  {item.emoji}
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="truncate text-sm font-semibold text-neutral-700 line-through dark:text-neutral-400">{item.title}</h4>
                  <div className="mt-0.5 flex items-center gap-2 text-[11px] text-neutral-400">
                    <Check className="h-3 w-3 text-green-500" /> Published
                    {item.deadline && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(item.deadline + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </span>
                    )}
                  </div>
                </div>
                <span className="text-xs font-bold text-green-600">{progress}%</span>
                <button
                  onClick={() => unarchiveItem(item.id)}
                  aria-label="Unarchive"
                  className="rounded-lg bg-white p-1.5 text-neutral-400 shadow-sm transition-colors hover:bg-neutral-100 hover:text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-700"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function ContentDialog({
  open,
  onOpenChange,
  item,
  onSave,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  item?: ContentItem
  onSave: (data: { emoji: string; title: string; description: string; deadline: string; status: ContentStatus; reminder?: string }) => void
}) {
  const [emoji, setEmoji] = useState(item?.emoji ?? "🎬")
  const [title, setTitle] = useState(item?.title ?? "")
  const [description, setDescription] = useState(item?.description ?? "")
  const [deadline, setDeadline] = useState(item?.deadline ?? "")
  const [status, setStatus] = useState<ContentStatus>(item?.status ?? "ideas")
  const [reminderDate, setReminderDate] = useState(() => {
    if (!item?.reminder) return ""
    const d = new Date(item.reminder)
    if (isNaN(d.getTime())) return ""
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
  })
  const [reminderTime, setReminderTime] = useState(() => {
    if (!item?.reminder) return ""
    const d = new Date(item.reminder)
    if (isNaN(d.getTime())) return ""
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`
  })

  const handleSave = () => {
    if (!title.trim()) return
    let reminder: string | undefined
    if (reminderDate && reminderTime) {
      const r = new Date(`${reminderDate}T${reminderTime}`)
      if (r.getTime() > Date.now()) reminder = r.toISOString()
    }
    onSave({ emoji, title: title.trim(), description: description.trim(), deadline, status, reminder })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl">{item ? "Edit Content" : "New Content"}</DialogTitle>
          <DialogDescription>
            {item ? "Update your content piece." : "Add a new content idea to your pipeline."}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-5 pt-2">
          {/* Emoji picker */}
          <div className="space-y-2">
            <Label>Icon</Label>
            <div className="grid grid-cols-10 gap-1.5 sm:grid-cols-10">
              {EMOJIS.map((e) => (
                <button
                  key={e}
                  onClick={() => setEmoji(e)}
                  className={cn(
                    "flex aspect-square items-center justify-center rounded-xl border text-lg transition-all",
                    emoji === e
                      ? "scale-110 border-neutral-900 bg-neutral-100 shadow-md dark:border-neutral-100 dark:bg-neutral-800"
                      : "border-transparent hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
                  )}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="content-title">Title *</Label>
            <Input id="content-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Morning Routine Vlog" autoFocus={!!item} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="content-desc">Description</Label>
            <Textarea id="content-desc" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="What's this content about?" />
          </div>

          <div className="space-y-2">
            <Label>Status</Label>
            <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
              {columns.map((c) => {
                const Icon = c.icon
                const active = status === c.key
                return (
                  <button
                    key={c.key}
                    onClick={() => setStatus(c.key)}
                    className={cn(
                      "flex items-center gap-1.5 rounded-xl border px-3 py-2.5 text-xs font-semibold transition-all",
                      active
                        ? cn(c.bg, c.color, "border-transparent shadow-sm scale-[1.02]")
                        : "border-neutral-200 text-neutral-500 hover:bg-neutral-50 hover:text-neutral-700 dark:border-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-800/50 dark:hover:text-neutral-200"
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {c.label}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="content-deadline">Deadline</Label>
            <Input id="content-deadline" type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="content-reminder">Reminder (optional)</Label>
            <div className="grid grid-cols-2 gap-2">
              <Input
                id="content-reminder-date"
                type="date"
                value={reminderDate}
                onChange={(e) => setReminderDate(e.target.value)}
              />
              <Input
                id="content-reminder-time"
                type="time"
                step={300}
                value={reminderTime}
                onChange={(e) => setReminderTime(e.target.value)}
              />
            </div>
            <p className="text-[11px] text-neutral-500">Get an alert before this piece needs attention — app push.</p>
          </div>

          <Button className="w-full gap-2" onClick={handleSave} disabled={!title.trim()}>
            <Plus className="h-4 w-4" />
            {item ? "Save Changes" : "Add to Pipeline"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function SummaryBar({ items }: { items: ContentItem[] }) {
  const total = items.length
  const ideas = items.filter((i) => i.status === "ideas").length
  const overdue = items.filter((i) => i.deadline && new Date(i.deadline + "T23:59:59").getTime() < Date.now() && i.status !== "published").length
  const archived = items.filter((i) => i.status === "published" && i.archivedAt).length

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-3 py-1 text-[11px] font-medium text-neutral-500 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400">
        <Layers className="h-3 w-3" /> {total} total
      </span>
      <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[11px] font-medium text-amber-600 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-400">
        <Lightbulb className="h-3 w-3" /> {ideas} ideas
      </span>
      {overdue > 0 && (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-3 py-1 text-[11px] font-medium text-red-600 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-400">
          <AlarmClock className="h-3 w-3" /> {overdue} overdue
        </span>
      )}
      {archived > 0 && (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-green-200 bg-green-50 px-3 py-1 text-[11px] font-medium text-green-600 dark:border-green-900/40 dark:bg-green-950/30 dark:text-green-400">
          <CheckCircle2 className="h-3 w-3" /> {archived} published
        </span>
      )}
    </div>
  )
}

export function ContentHubPanel() {
  const { items, autoArchivePastDeadline } = useContentStore()
  const [view, setView] = useState<"board" | "list" | "archive">("board")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editItem, setEditItem] = useState<ContentItem | null>(null)
  const [activeItem, setActiveItem] = useState<ContentItem | null>(null)
  const [archivedNotice, setArchivedNotice] = useState<number | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  const published = useMemo(() => items.filter((i) => i.status === "published" && !i.archivedAt), [items])
  const archived = useMemo(() => items.filter((i) => i.status === "published" && i.archivedAt), [items])
  const nonArchived = useMemo(() => items.filter((i) => i.status !== "published" || !i.archivedAt), [items])

  useEffect(() => {
    const runAutoArchive = () => {
      const count = autoArchivePastDeadline()
      if (count > 0) setArchivedNotice(count)
    }
    runAutoArchive()
    const interval = setInterval(runAutoArchive, 60 * 60 * 1000)
    return () => clearInterval(interval)
  }, [autoArchivePastDeadline])

  useEffect(() => {
    if (archivedNotice !== null) {
      const t = setTimeout(() => setArchivedNotice(null), 4000)
      return () => clearTimeout(t)
    }
  }, [archivedNotice])

  const handleDragStart = (event: DragStartEvent) => {
    const item = event.active.data.current?.item as ContentItem
    if (item) setActiveItem(item)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveItem(null)
    const { active, over } = event
    if (!over) return

    const itemId = active.id as string
    const targetStatus = over.id as ContentStatus

    if (columns.some((c) => c.key === targetStatus)) {
      useContentStore.getState().moveItem(itemId, targetStatus)
    }
  }

  const handleSave = (data: { emoji: string; title: string; description: string; deadline: string; status: ContentStatus; reminder?: string }) => {
    if (editItem) {
      useContentStore.getState().updateItem(editItem.id, data)
    } else {
      useContentStore.getState().addItem(data)
    }
  }

  return (
    <div className="space-y-5">
      <AnimatePresence>
        {archivedNotice !== null && archivedNotice > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -12, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -12, height: 0 }}
            className="overflow-hidden rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 dark:border-green-900/40 dark:bg-green-950/30 dark:text-green-400"
          >
            <CheckCircle2 className="mr-2 inline h-4 w-4" />
            {archivedNotice} item{archivedNotice > 1 ? "s" : ""} auto-archived past deadline
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SummaryBar items={nonArchived} />
        <Button onClick={() => { setEditItem(null); setDialogOpen(true) }} className="gap-2 self-start sm:self-auto">
          <Plus className="h-4 w-4" /> New Content
        </Button>
      </div>

      {/* View tabs */}
      <div className="flex gap-1 rounded-xl bg-neutral-100 p-1 dark:bg-neutral-800">
        {[
          { key: "board" as const, label: "Board", icon: LayoutGrid },
          { key: "list" as const, label: "List", icon: List },
          { key: "archive" as const, label: "Archive", icon: Archive, count: archived.length },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setView(t.key)}
            className={cn(
              "flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-all sm:flex-none",
              view === t.key
                ? "bg-white text-neutral-900 shadow-sm dark:bg-neutral-900 dark:text-neutral-50"
                : "text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
            )}
          >
            <t.icon className="h-4 w-4" />
            {t.label}
            {t.count !== undefined && t.count > 0 && (
              <span className="rounded-full bg-neutral-200 px-1.5 text-[10px] font-semibold dark:bg-neutral-700">
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={view}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
        >
          {view === "archive" ? (
            <ArchiveTab />
          ) : view === "board" ? (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
              <div className="kanban-scroll -mx-1 flex snap-x snap-mandatory gap-3 overflow-x-auto px-1 pb-4 sm:gap-4">
                {columns.filter((c) => c.key !== "published").map((col) => (
                  <KanbanColumn
                    key={col.key}
                    status={col.key}
                    items={nonArchived.filter((i) => i.status === col.key)}
                    onEdit={(item) => { setEditItem(item); setDialogOpen(true) }}
                  />
                ))}
                <KanbanColumn
                  status="published"
                  items={published}
                  onEdit={(item) => { setEditItem(item); setDialogOpen(true) }}
                />
              </div>
              <DragOverlay>
                {activeItem && (
                  <div className="w-[280px]">
                    <ContentCard item={activeItem} isDragOverlay onEdit={() => {}} />
                  </div>
                )}
              </DragOverlay>
            </DndContext>
          ) : (
            <ListView
              items={nonArchived}
              onEdit={(item) => { setEditItem(item); setDialogOpen(true) }}
            />
          )}
        </motion.div>
      </AnimatePresence>

      <ContentDialog
        open={dialogOpen}
        onOpenChange={(o) => { setDialogOpen(o); if (!o) setEditItem(null) }}
        item={editItem ?? undefined}
        onSave={handleSave}
      />
    </div>
  )
}