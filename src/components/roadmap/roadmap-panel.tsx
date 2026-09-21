"use client"

import { useState, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Map, Plus, ArrowLeft, Trash2, Pencil, ChevronDown, ChevronRight,
  Play, CheckCircle2, Circle, MinusCircle, CalendarDays, Target,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/shadcn-utils"
import { Button } from "@/components/ui/button"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { useRoadmapStore } from "@/store/use-roadmap-store"
import type { Roadmap, RoadmapPhase, PhaseStatus } from "@/types"
import { format } from "date-fns"

const EMOJIS = ["🎯", "🚀", "📢", "🎬", "🎧", "💪", "💰", "🌱", "🧠", "🏦", "📚", "🏃"]

const STATUS_META: Record<PhaseStatus, { label: string; icon: typeof Circle; ring: string }> = {
  todo: { label: "To do", icon: Circle, ring: "text-neutral-400 border-neutral-300 dark:border-neutral-600" },
  "in-progress": { label: "In progress", icon: Play, ring: "text-blue-500 border-blue-400/50" },
  done: { label: "Done", icon: CheckCircle2, ring: "text-green-500 border-green-400/50" },
}

function CreateRoadmapDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const addRoadmap = useRoadmapStore((s) => s.addRoadmap)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [target, setTarget] = useState("")
  const [emoji, setEmoji] = useState(EMOJIS[0])
  const [deadline, setDeadline] = useState("")
  const [error, setError] = useState("")

  const handleSubmit = () => {
    if (!title.trim()) {
      setError("Give your roadmap a name.")
      return
    }
    addRoadmap({ title: title.trim(), description: description.trim(), target: target.trim(), emoji, deadline: deadline || undefined })
    setTitle("")
    setDescription("")
    setTarget("")
    setEmoji(EMOJIS[0])
    setDeadline("")
    setError("")
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New Roadmap</DialogTitle>
          <DialogDescription>Plan a goal and break it into milestones you can track.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="rm-title">Roadmap name</Label>
            <Input id="rm-title" value={title} onChange={(e) => { setTitle(e.target.value); setError("") }} placeholder="e.g. Launch a YouTube channel" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="rm-desc">Description (optional)</Label>
            <Textarea id="rm-desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What does success look like?" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="rm-target">Goal / target</Label>
              <Input id="rm-target" value={target} onChange={(e) => setTarget(e.target.value)} placeholder="e.g. 1,000 subscribers" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rm-deadline">Deadline (optional)</Label>
              <Input id="rm-deadline" type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Icon</Label>
            <div className="flex flex-wrap gap-2">
              {EMOJIS.map((e) => (
                <button
                  key={e}
                  onClick={() => setEmoji(e)}
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-xl border text-lg transition-all",
                    emoji === e
                      ? "border-neutral-900 bg-neutral-900/5 dark:border-white dark:bg-white/10"
                      : "border-neutral-200 hover:bg-neutral-50 dark:border-neutral-800 dark:hover:bg-neutral-800/60"
                  )}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>
          {error && <p className="text-xs font-medium text-red-500">{error}</p>}
          <Button onClick={handleSubmit} className="w-full" disabled={!title.trim()}>
            Create roadmap
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function EditRoadmapDialog({ roadmap, open, onOpenChange }: { roadmap: Roadmap; open: boolean; onOpenChange: (v: boolean) => void }) {
  const updateRoadmap = useRoadmapStore((s) => s.updateRoadmap)
  const [title, setTitle] = useState(roadmap.title)
  const [description, setDescription] = useState(roadmap.description ?? "")
  const [target, setTarget] = useState(roadmap.target)
  const [emoji, setEmoji] = useState(roadmap.emoji)
  const [deadline, setDeadline] = useState(roadmap.deadline ?? "")

  const handleSubmit = () => {
    updateRoadmap(roadmap.id, { title: title.trim(), description: description.trim(), target: target.trim(), emoji, deadline: deadline || undefined })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Roadmap</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="rm-edit-title">Roadmap name</Label>
            <Input id="rm-edit-title" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="rm-edit-desc">Description</Label>
            <Textarea id="rm-edit-desc" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="rm-edit-target">Goal / target</Label>
              <Input id="rm-edit-target" value={target} onChange={(e) => setTarget(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rm-edit-deadline">Deadline</Label>
              <Input id="rm-edit-deadline" type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Icon</Label>
            <div className="flex flex-wrap gap-2">
              {EMOJIS.map((e) => (
                <button
                  key={e}
                  onClick={() => setEmoji(e)}
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-xl border text-lg transition-all",
                    emoji === e
                      ? "border-neutral-900 bg-neutral-900/5 dark:border-white dark:bg-white/10"
                      : "border-neutral-200 hover:bg-neutral-50 dark:border-neutral-800 dark:hover:bg-neutral-800/60"
                  )}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>
          <Button onClick={handleSubmit} className="w-full" disabled={!title.trim()}>
            Save changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function PhaseDialog({
  open, onOpenChange, roadmapId, phase,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  roadmapId: string
  phase?: RoadmapPhase
}) {
  const addPhase = useRoadmapStore((s) => s.addPhase)
  const updatePhase = useRoadmapStore((s) => s.updatePhase)
  const isEdit = !!phase
  const [title, setTitle] = useState(phase?.title ?? "")
  const [description, setDescription] = useState(phase?.description ?? "")
  const [status, setStatus] = useState<PhaseStatus>(phase?.status ?? "todo")
  const [reminder, setReminder] = useState(phase?.reminder ?? "")

  const handleSubmit = () => {
    if (!title.trim()) return
    if (isEdit && phase) {
      updatePhase(roadmapId, phase.id, { title: title.trim(), description: description.trim() || undefined, status, reminder: reminder || undefined })
    } else {
      addPhase(roadmapId, { title: title.trim(), description: description.trim() || undefined, status, reminder: reminder || undefined })
    }
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Milestone" : "New Milestone"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Update this step of the roadmap." : "A milestone like “5 videos”, “10 videos”, “15 videos”."}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="ph-title">Milestone title</Label>
            <Input id="ph-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder='e.g. "5 videos" or "First 30 days"' />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ph-desc">Description (optional)</Label>
            <Textarea id="ph-desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What gets done at this step?" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="rm-edit-status">Status</Label>
              <div className="flex flex-col gap-1.5">
                {(Object.keys(STATUS_META) as PhaseStatus[]).map((st) => {
                  const m = STATUS_META[st]
                  const Icon = m.icon
                  return (
                    <button
                      key={st}
                      onClick={() => setStatus(st)}
                      className={cn(
                        "flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-medium transition-all",
                        status === st ? cn("border-transparent", st === "done" ? "bg-green-500/15 text-green-600 dark:text-green-400" : st === "in-progress" ? "bg-blue-500/15 text-blue-600 dark:text-blue-400" : "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-200") : "border-neutral-200 text-neutral-500 hover:bg-neutral-50 dark:border-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-800/60"
                      )}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {m.label}
                    </button>
                  )
                })}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="ph-reminder">Reminder time (optional)</Label>
              <Input id="ph-reminder" type="datetime-local" value={reminder} onChange={(e) => setReminder(e.target.value)} />
            </div>
          </div>
          <Button onClick={handleSubmit} className="w-full" disabled={!title.trim()}>
            {isEdit ? "Save changes" : "Add milestone"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function PhaseCard({
  roadmapId, phase, index, total,
}: {
  roadmapId: string
  phase: RoadmapPhase
  index: number
  total: number
}) {
  const { setPhaseStatus, updatePhase, deletePhase, addTask, toggleTask, deleteTask } = useRoadmapStore()
  const [expanded, setExpanded] = useState(phase.status !== "done")
  const [editOpen, setEditOpen] = useState(false)
  const [newTask, setNewTask] = useState("")
  const meta = STATUS_META[phase.status]
  const StatusIcon = meta.icon
  const doneTasks = phase.tasks.filter((t) => t.completed).length
  const pct = phase.tasks.length ? Math.round((doneTasks / phase.tasks.length) * 100) : phase.status === "done" ? 100 : 0

  const nextStatus: PhaseStatus = phase.status === "todo" ? "in-progress" : phase.status === "in-progress" ? "done" : "todo"

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      className="rounded-2xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900"
    >
      <div className="flex items-center gap-3 p-4">
        <button
          onClick={() => setPhaseStatus(roadmapId, phase.id, nextStatus)}
          title={`Mark ${STATUS_META[nextStatus].label.toLowerCase()}`}
          className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 transition-all", meta.ring, phase.status === "done" ? "bg-green-500 border-green-500 text-white" : phase.status === "in-progress" ? "bg-white dark:bg-neutral-900" : "bg-white dark:bg-neutral-900")}
        >
          <StatusIcon className={cn("h-4 w-4", phase.status === "todo" && "text-neutral-400")} />
        </button>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-neutral-300 dark:text-neutral-600">{String(index + 1).padStart(2, "0")}</span>
          <div className="min-w-0">
            <button onClick={() => setExpanded((v) => !v)} className="flex items-center gap-1.5">
              <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">{phase.title}</p>
              {expanded ? <ChevronDown className="h-3.5 w-3.5 text-neutral-400" /> : <ChevronRight className="h-3.5 w-3.5 text-neutral-400" />}
            </button>
            <p className="text-[11px] text-neutral-400">{STATUS_META[phase.status].label}{phase.tasks.length > 0 && ` · ${doneTasks}/${phase.tasks.length} tasks`}</p>
          </div>
        </div>

        <div className="ml-auto flex items-center gap-1">
          <button onClick={() => setEditOpen(true)} className="rounded-lg p-1.5 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-600 dark:hover:bg-neutral-800 dark:hover:text-neutral-300">
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button onClick={() => deletePhase(roadmapId, phase.id)} className="rounded-lg p-1.5 text-neutral-400 transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/50">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {phase.tasks.length > 0 && (
        <div className="px-4 pb-3">
          <div className="flex items-center gap-2">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
              <div className="h-full rounded-full bg-neutral-900 transition-all dark:bg-white" style={{ width: `${pct}%` }} />
            </div>
            <span className="text-[10px] font-medium text-neutral-400">{pct}%</span>
          </div>
        </div>
      )}

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-neutral-100 dark:border-neutral-800"
          >
            <div className="space-y-1 p-4">
              {phase.description && <p className="text-xs text-neutral-500 dark:text-neutral-400">{phase.description}</p>}

              <div className="space-y-1">
                {phase.tasks.map((t) => (
                  <div key={t.id} className="group flex items-center gap-2.5 rounded-lg px-2 py-1.5 hover:bg-neutral-50 dark:hover:bg-neutral-800/60">
                    <button
                      onClick={() => toggleTask(roadmapId, phase.id, t.id)}
                      className={cn(
                        "flex h-4.5 w-4.5 h-[18px] w-[18px] shrink-0 items-center justify-center rounded-md border transition-all",
                        t.completed ? "border-neutral-900 bg-neutral-900 dark:border-white dark:bg-white" : "border-neutral-300 hover:border-neutral-500 dark:border-neutral-600"
                      )}
                    >
                      {t.completed && <CheckCircle2 className="h-3 w-3 text-white dark:text-neutral-900" />}
                    </button>
                    <span className={cn("flex-1 text-sm", t.completed ? "text-neutral-400 line-through dark:text-neutral-500" : "text-neutral-700 dark:text-neutral-200")}>{t.title}</span>
                    <button onClick={() => deleteTask(roadmapId, phase.id, t.id)} className="rounded p-1 text-neutral-300 opacity-0 transition-all group-hover:opacity-100 hover:text-red-500 max-sm:opacity-100 dark:text-neutral-600">
                      <MinusCircle className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  if (!newTask.trim()) return
                  addTask(roadmapId, phase.id, newTask.trim())
                  setNewTask("")
                }}
                className="flex items-center gap-2 pt-1"
              >
                <Input value={newTask} onChange={(e) => setNewTask(e.target.value)} placeholder="Add a task…" className="h-8 flex-1 text-sm" />
                <Button type="submit" size="sm" className="h-8 gap-1" disabled={!newTask.trim()}>
                  <Plus className="h-3.5 w-3.5" /> Add
                </Button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <PhaseDialog open={editOpen} onOpenChange={setEditOpen} roadmapId={roadmapId} phase={phase} />
    </motion.div>
  )
}

function RoadmapCard({ roadmap, onOpen }: { roadmap: Roadmap; onOpen: () => void }) {
  const deleteRoadmap = useRoadmapStore((s) => s.deleteRoadmap)
  const [editOpen, setEditOpen] = useState(false)
  const donePhases = roadmap.phases.filter((p) => p.status === "done").length
  const pct = roadmap.phases.length ? Math.round((donePhases / roadmap.phases.length) * 100) : 0
  const totalTasks = roadmap.phases.reduce((n, p) => n + p.tasks.length, 0)
  const doneTasks = roadmap.phases.reduce((n, p) => n + p.tasks.filter((t) => t.completed).length, 0)

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="group relative overflow-hidden rounded-2xl border border-neutral-200 bg-white p-5 transition-all hover:-translate-y-0.5 hover:border-neutral-300 hover:shadow-lg hover:shadow-neutral-200/50 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-neutral-700 dark:hover:shadow-black/30"
    >
      <button onClick={onOpen} className="absolute inset-0 z-0" aria-label={`Open ${roadmap.title}`} />

      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-neutral-100 text-2xl dark:bg-neutral-800">{roadmap.emoji}</div>
          <div className="min-w-0">
            <h3 className="truncate font-semibold text-neutral-900 dark:text-neutral-50">{roadmap.title}</h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              {roadmap.phases.length} {roadmap.phases.length === 1 ? "milestone" : "milestones"}
              {roadmap.deadline && <> · due {format(new Date(roadmap.deadline), "MMM d")}</>}
            </p>
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-1 opacity-0 transition-all group-hover:opacity-100 max-sm:opacity-100">
          <button onClick={() => setEditOpen(true)} className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 dark:hover:bg-neutral-800 dark:hover:text-neutral-300">
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => {
              if (confirm(`Delete "${roadmap.title}" and all its milestones?`)) deleteRoadmap(roadmap.id)
            }}
            className="rounded-lg p-1.5 text-neutral-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/50"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {roadmap.target && (
        <p className="mt-3 flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400">
          <Target className="h-3.5 w-3.5 text-neutral-400" />
          {roadmap.target}
        </p>
      )}
      {roadmap.description && <p className="mt-1.5 line-clamp-2 text-xs text-neutral-400 dark:text-neutral-500">{roadmap.description}</p>}

      <div className="mt-4">
        <div className="flex items-center justify-between text-[11px] font-medium text-neutral-400">
          <span>{donePhases} of {roadmap.phases.length || 0} milestones done</span>
          <span>{pct}%</span>
        </div>
        <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
          <div className="h-full rounded-full bg-neutral-900 transition-all dark:bg-white" style={{ width: `${pct}%` }} />
        </div>
      </div>

      {totalTasks > 0 && (
        <p className="mt-2.5 text-[11px] text-neutral-400">{doneTasks}/{totalTasks} tasks completed</p>
      )}

      <EditRoadmapDialog roadmap={roadmap} open={editOpen} onOpenChange={setEditOpen} />
    </motion.div>
  )
}

function RoadmapDetail({ roadmap, onBack }: { roadmap: Roadmap; onBack: () => void }) {
  const deleteRoadmap = useRoadmapStore((s) => s.deleteRoadmap)
  const updateRoadmap = useRoadmapStore((s) => s.updateRoadmap)
  const [editOpen, setEditOpen] = useState(false)
  const [phaseOpen, setPhaseOpen] = useState(false)
  const donePhases = roadmap.phases.filter((p) => p.status === "done").length
  const pct = roadmap.phases.length ? Math.round((donePhases / roadmap.phases.length) * 100) : 0
  const totalTasks = roadmap.phases.reduce((n, p) => n + p.tasks.length, 0)
  const doneTasks = roadmap.phases.reduce((n, p) => n + p.tasks.filter((t) => t.completed).length, 0)

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
      <div className="mb-5 flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-1.5">
          <ArrowLeft className="h-4 w-4" /> All roadmaps
        </Button>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={() => setEditOpen(true)} className="gap-1.5">
            <Pencil className="h-3.5 w-3.5" /> Edit
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 text-red-500 hover:text-red-600"
            onClick={() => {
              if (confirm(`Delete "${roadmap.title}" and everything inside it?`)) {
                deleteRoadmap(roadmap.id)
                onBack()
              }
            }}
          >
            <Trash2 className="h-3.5 w-3.5" /> Delete
          </Button>
        </div>
      </div>

      <div className="rounded-3xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
        <div className="flex items-start gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-neutral-100 text-3xl dark:bg-neutral-800">{roadmap.emoji}</div>
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-neutral-900 dark:text-white">{roadmap.title}</h1>
            {roadmap.description && <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">{roadmap.description}</p>}
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-neutral-400">
              {roadmap.target && <span className="flex items-center gap-1.5"><Target className="h-3.5 w-3.5" /> {roadmap.target}</span>}
              {roadmap.deadline && <span className="flex items-center gap-1.5"><CalendarDays className="h-3.5 w-3.5" /> Due {format(new Date(roadmap.deadline), "MMM d, yyyy")}</span>}
            </div>
          </div>
        </div>

        <div className="mt-6">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">Overall progress</p>
              <p className="text-xs text-neutral-400">
                {donePhases} of {roadmap.phases.length || 0} milestones done
                {totalTasks > 0 && <> · {doneTasks}/{totalTasks} tasks</>}
              </p>
            </div>
            <p className="text-2xl font-bold text-neutral-900 dark:text-white">{pct}%</p>
          </div>
          <div className="mt-2 h-3 overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
            <div className="h-full rounded-full bg-neutral-900 transition-all dark:bg-white" style={{ width: `${pct}%` }} />
          </div>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-neutral-400">
          <Map className="h-4 w-4" /> Milestones
        </h2>
        <Button size="sm" onClick={() => setPhaseOpen(true)} className="gap-1.5">
          <Plus className="h-3.5 w-3.5" /> Add milestone
        </Button>
      </div>

      {roadmap.phases.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-4 flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-neutral-200 py-14 dark:border-neutral-800"
        >
          <Map className="mb-3 h-10 w-10 text-neutral-300 dark:text-neutral-600" />
          <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">No milestones yet</p>
          <p className="mt-1 text-xs text-neutral-400 dark:text-neutral-500">
            Break it down — “5 videos”, “10 videos”, “15 videos”…
          </p>
          <Button onClick={() => setPhaseOpen(true)} variant="outline" size="sm" className="mt-4 gap-1.5">
            <Plus className="h-3.5 w-3.5" /> Add your first milestone
          </Button>
        </motion.div>
      ) : (
        <div className="relative mt-4 space-y-3">
          <div className="absolute bottom-4 left-[27px] top-4 w-px bg-neutral-200 dark:bg-neutral-800" />
          <AnimatePresence mode="popLayout">
            {roadmap.phases.map((phase, i) => (
              <div key={phase.id} className="relative pl-14">
                <div className="absolute left-0 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full border bg-white dark:border-neutral-700 dark:bg-neutral-900">
                  <span className={cn("h-2.5 w-2.5 rounded-full", phase.status === "done" ? "bg-green-500" : phase.status === "in-progress" ? "bg-blue-500" : "bg-neutral-300 dark:bg-neutral-600")} />
                </div>
                <PhaseCard roadmapId={roadmap.id} phase={phase} index={i} total={roadmap.phases.length} />
              </div>
            ))}
          </AnimatePresence>
        </div>
      )}

      <EditRoadmapDialog roadmap={roadmap} open={editOpen} onOpenChange={setEditOpen} />
      <PhaseDialog open={phaseOpen} onOpenChange={setPhaseOpen} roadmapId={roadmap.id} />
    </motion.div>
  )
}

export function RoadmapPanel() {
  const router = useRouter()
  const roadmaps = useRoadmapStore((s) => s.roadmaps)
  const [createOpen, setCreateOpen] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const selected = roadmaps.find((r) => r.id === selectedId)

  if (selected) {
    return <RoadmapDetail roadmap={selected} onBack={() => setSelectedId(null)} />
  }

  const totalPhases = roadmaps.reduce((n, r) => n + r.phases.length, 0)
  const donePhases = roadmaps.reduce((n, r) => n + r.phases.filter((p) => p.status === "done").length, 0)
  const active = roadmaps.filter((r) => r.phases.some((p) => p.status === "in-progress")).length

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 self-start">
          <Button onClick={() => setCreateOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            New Roadmap
          </Button>
        </div>
        {roadmaps.length > 0 && (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-neutral-500 dark:text-neutral-400">
            <span>{roadmaps.length} roadmaps</span>
            <span>{totalPhases} milestones</span>
            {active > 0 && <span className="text-blue-500">{active} in progress</span>}
            <span>{donePhases} done</span>
          </div>
        )}
      </div>

      {roadmaps.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-neutral-200 py-20 dark:border-neutral-800"
        >
          <Map className="mb-4 h-12 w-12 text-neutral-300 dark:text-neutral-600" />
          <p className="text-lg font-medium text-neutral-500 dark:text-neutral-400">No roadmaps yet</p>
          <p className="mt-1 max-w-xs text-center text-sm text-neutral-400 dark:text-neutral-500">
            Plan big goals, break them into milestones, and track every step.
          </p>
          <Button onClick={() => setCreateOpen(true)} variant="outline" className="mt-4 gap-2">
            <Plus className="h-4 w-4" />
            Create your first roadmap
          </Button>
        </motion.div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          <AnimatePresence mode="popLayout">
            {roadmaps.map((r) => (
              <RoadmapCard key={r.id} roadmap={r} onOpen={() => setSelectedId(r.id)} />
            ))}
          </AnimatePresence>
        </div>
      )}

      <CreateRoadmapDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  )
}