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
} from "lucide-react"
import { cn } from "@/lib/shadcn-utils"
import { Button } from "@/components/ui/button"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { useContentStore } from "@/store/use-content-store"
import type { ContentItem, ContentStatus } from "@/types"

const EMOJIS = ["🎬", "📝", "🎥", "💡", "🚀", "🎵", "📸", "🎯", "⭐", "🔥", "💎", "🌟", "🎨", "📱", "💻", "🎮", "🏆", "✨", "🎓", "📚"]

const columns: { key: ContentStatus; label: string; icon: typeof Lightbulb; color: string; bg: string }[] = [
  { key: "ideas", label: "Ideas", icon: Lightbulb, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-950/20" },
  { key: "scripts", label: "Scripts", icon: FileText, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-950/20" },
  { key: "filming", label: "Filming", icon: Video, color: "text-purple-600 dark:text-purple-400", bg: "bg-purple-50 dark:bg-purple-950/20" },
  { key: "editing", label: "Editing", icon: Scissors, color: "text-orange-600 dark:text-orange-400", bg: "bg-orange-50 dark:bg-orange-950/20" },
  { key: "published", label: "Published", icon: CheckCircle2, color: "text-green-600 dark:text-green-400", bg: "bg-green-50 dark:bg-green-950/20" },
]

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
        "group rounded-xl border bg-white p-4 transition-all dark:bg-neutral-900",
        isDragOverlay
          ? "shadow-2xl ring-2 ring-neutral-300 dark:ring-neutral-600 rotate-2"
          : isDragging
            ? "opacity-40 border-neutral-300 dark:border-neutral-700"
            : "border-neutral-200/60 hover:shadow-md dark:border-neutral-800/60"
      )}
    >
      <div className="flex items-start gap-2">
        <button
          {...attributes}
          {...listeners}
          className="mt-0.5 shrink-0 cursor-grab touch-none rounded p-0.5 text-neutral-300 opacity-0 transition-opacity group-hover:opacity-100 hover:text-neutral-500 dark:text-neutral-600 dark:hover:text-neutral-400"
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <span className="text-xl leading-none">{item.emoji}</span>
        <div className="min-w-0 flex-1">
          <h4 className="text-sm font-semibold text-neutral-900 dark:text-neutral-50 truncate">{item.title}</h4>
          {item.description && (
            <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400 line-clamp-2">{item.description}</p>
          )}
        </div>
        <div className="flex gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
          <button onClick={onEdit} className="rounded p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 dark:hover:bg-neutral-800">
            <Pencil className="h-3 w-3" />
          </button>
          <button onClick={() => deleteItem(item.id)} className="rounded p-1 text-neutral-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/50">
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* Deadline */}
      {item.deadline && (
        <div className="mt-2 flex items-center gap-1 text-[11px] text-neutral-400 dark:text-neutral-500">
          <Calendar className="h-3 w-3" />
          {new Date(item.deadline).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
        </div>
      )}

      {/* Progress bar */}
      <div className="mt-2.5">
        <div className="flex items-center justify-between text-[10px]">
          <span className="text-neutral-400 dark:text-neutral-500">
            {item.subtasks.length > 0 ? `${completedCount}/${item.subtasks.length}` : "No subtasks"}
          </span>
          <span className="font-medium text-neutral-500 dark:text-neutral-400">{progress}%</span>
        </div>
        <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
          <motion.div
            className={cn("h-full rounded-full", progress === 100 ? "bg-green-500" : "bg-neutral-900 dark:bg-neutral-50")}
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      {/* Subtasks toggle */}
      {item.subtasks.length > 0 && (
        <button
          onClick={() => setShowSubtasks(!showSubtasks)}
          className="mt-2 flex w-full items-center gap-1 text-[11px] text-neutral-400 transition-colors hover:text-neutral-600 dark:hover:text-neutral-300"
        >
          {showSubtasks ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          {showSubtasks ? "Hide" : "Show"} subtasks
        </button>
      )}

      {/* Expanded subtasks */}
      <AnimatePresence>
        {showSubtasks && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="mt-2 space-y-1 overflow-hidden"
          >
            {item.subtasks.map((st) => (
              <div key={st.id} className="flex items-center gap-2 rounded-lg bg-neutral-50 px-2 py-1.5 dark:bg-neutral-800/50">
                <button
                  onClick={() => toggleSubtask(item.id, st.id)}
                  className={cn(
                    "flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors",
                    st.completed
                      ? "border-green-500 bg-green-500 text-white"
                      : "border-neutral-300 dark:border-neutral-600"
                  )}
                >
                  {st.completed && <Check className="h-3 w-3" />}
                </button>
                <span className={cn("flex-1 text-xs", st.completed ? "text-neutral-400 line-through dark:text-neutral-600" : "text-neutral-700 dark:text-neutral-300")}>
                  {st.title}
                </span>
                <button onClick={() => deleteSubtask(item.id, st.id)} className="shrink-0 text-neutral-300 hover:text-red-400 dark:text-neutral-600">
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add subtask */}
      <div className="mt-2 flex gap-1">
        <Input
          value={newSub}
          onChange={(e) => setNewSub(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAddSub()}
          placeholder="Add subtask..."
          className="h-7 flex-1 text-xs"
        />
        <Button size="sm" variant="ghost" className="h-7 px-2" onClick={handleAddSub} disabled={!newSub.trim()}>
          <Plus className="h-3 w-3" />
        </Button>
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
        "flex flex-col rounded-2xl border p-3 transition-colors",
        isOver
          ? "border-neutral-400 bg-neutral-100/50 dark:border-neutral-500 dark:bg-neutral-800/30"
          : "border-neutral-200/60 bg-neutral-50/50 dark:border-neutral-800/60 dark:bg-neutral-900/30"
      )}
    >
      <div className="mb-3 flex items-center gap-2 px-1">
        <div className={cn("flex h-6 w-6 items-center justify-center rounded-lg", col.bg)}>
          <Icon className={cn("h-3.5 w-3.5", col.color)} />
        </div>
        <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">{col.label}</span>
        <span className="ml-auto rounded-full bg-neutral-200 px-2 py-0.5 text-[10px] font-semibold text-neutral-600 dark:bg-neutral-700 dark:text-neutral-400">
          {items.length}
        </span>
      </div>
      <div ref={setNodeRef} className="min-h-[100px] flex-1 space-y-2.5">
        <AnimatePresence mode="popLayout">
          {items.map((item) => (
            <ContentCard key={item.id} item={item} onEdit={() => onEdit(item)} />
          ))}
        </AnimatePresence>
        {items.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-neutral-200 py-8 dark:border-neutral-800">
            <p className="text-xs text-neutral-400">Drop items here</p>
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
        const col = columns.find((c) => c.key === item.status)!
        const Icon = col.icon
        return (
          <motion.div
            key={item.id}
            layout
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="group flex items-center gap-3 rounded-xl border border-neutral-200/60 bg-white p-3 transition-all hover:shadow-md dark:border-neutral-800/60 dark:bg-neutral-900"
          >
            <span className="text-xl">{item.emoji}</span>
            <div className="min-w-0 flex-1">
              <h4 className="text-sm font-semibold text-neutral-900 dark:text-neutral-50 truncate">{item.title}</h4>
              <div className="mt-0.5 flex items-center gap-2 text-[11px] text-neutral-400 dark:text-neutral-500">
                <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-medium", col.bg, col.color)}>
                  <Icon className="h-3 w-3" /> {col.label}
                </span>
                {item.deadline && (
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(item.deadline).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </span>
                )}
                {item.subtasks.length > 0 && (
                  <span>{item.subtasks.filter((s) => s.completed).length}/{item.subtasks.length} subtasks</span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-32">
                <div className="flex items-center justify-end text-[10px] text-neutral-400">
                  {progress}%
                </div>
                <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
                  <div
                    className={cn("h-full rounded-full transition-all", progress === 100 ? "bg-green-500" : "bg-neutral-900 dark:bg-neutral-50")}
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
              <div className="flex gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                <button onClick={() => onEdit(item)} className="rounded p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 dark:hover:bg-neutral-800">
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button onClick={() => useContentStore.getState().deleteItem(item.id)} className="rounded p-1.5 text-neutral-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/50">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
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
            return (
              <div key={item.id} className="group flex items-center gap-3 rounded-xl border border-green-200/40 bg-green-50/30 p-3 dark:border-green-900/20 dark:bg-green-950/10">
                <span className="text-xl">{item.emoji}</span>
                <div className="min-w-0 flex-1">
                  <h4 className="text-sm font-semibold text-neutral-700 line-through dark:text-neutral-400">{item.title}</h4>
                  <div className="mt-0.5 flex items-center gap-2 text-[11px] text-neutral-400">
                    <Check className="h-3 w-3 text-green-500" /> Published
                    {item.deadline && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(item.deadline).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </span>
                    )}
                  </div>
                </div>
                <span className="text-xs font-medium text-green-600">{progress}%</span>
                <button
                  onClick={() => unarchiveItem(item.id)}
                  className="rounded p-1.5 text-neutral-400 opacity-0 transition-all hover:bg-neutral-100 hover:text-neutral-600 group-hover:opacity-100 dark:hover:bg-neutral-800"
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
  onSave: (data: { emoji: string; title: string; description: string; deadline: string; status: ContentStatus }) => void
}) {
  const [emoji, setEmoji] = useState(item?.emoji ?? "🎬")
  const [title, setTitle] = useState(item?.title ?? "")
  const [description, setDescription] = useState(item?.description ?? "")
  const [deadline, setDeadline] = useState(item?.deadline ?? "")
  const [status, setStatus] = useState<ContentStatus>(item?.status ?? "ideas")

  const handleSave = () => {
    if (!title.trim()) return
    onSave({ emoji, title: title.trim(), description: description.trim(), deadline, status })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{item ? "Edit Content" : "New Content"}</DialogTitle>
          <DialogDescription>
            {item ? "Update your content piece." : "Add a new content idea to your pipeline."}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          {/* Emoji picker */}
          <div className="space-y-2">
            <Label>Icon</Label>
            <div className="flex flex-wrap gap-1.5">
              {EMOJIS.map((e) => (
                <button
                  key={e}
                  onClick={() => setEmoji(e)}
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-lg border text-lg transition-all",
                    emoji === e
                      ? "border-neutral-900 bg-neutral-100 dark:border-neutral-50 dark:bg-neutral-800 scale-110"
                      : "border-transparent hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
                  )}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label>Title *</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Morning Routine Vlog" />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="What's this content about?" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Deadline</Label>
              <Input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as ContentStatus)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {columns.map((c) => (
                    <SelectItem key={c.key} value={c.key}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button className="w-full" onClick={handleSave} disabled={!title.trim()}>
            {item ? "Save Changes" : "Add to Pipeline"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
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

  const handleSave = (data: { emoji: string; title: string; description: string; deadline: string; status: ContentStatus }) => {
    if (editItem) {
      useContentStore.getState().updateItem(editItem.id, data)
    } else {
      useContentStore.getState().addItem(data)
    }
  }

  return (
    <div className="space-y-6">
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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">
            Content Hub
          </h1>
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
            Manage your content pipeline from idea to publish
          </p>
        </div>
        <Button onClick={() => { setEditItem(null); setDialogOpen(true) }} className="gap-2 self-start">
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
              "flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-all",
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
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
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
                  <div className="w-[320px]">
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
