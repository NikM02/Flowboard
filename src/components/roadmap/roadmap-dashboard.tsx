"use client"

import { useEffect, useMemo, useState, type FormEvent } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useRouter } from "next/navigation"
import {
  ArrowLeft, Pencil, Trash2, Plus, ChevronDown, ChevronRight,
  Target, CalendarDays, MessageSquarePlus, X, StickyNote,
} from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/shadcn-utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  getPhaseProgress, getRoadmapHealth, useRoadmapStore,
} from "@/store/use-roadmap-store"
import { usePageTitleStore } from "@/store/use-page-title-store"
import {
  CATEGORY_META, PRIORITY_META, HEALTH_META, STATUS_META, STATUS_LIST,
  formatShortDate,
} from "./roadmap-meta"
import { EditRoadmapDialog, PhaseDialog, TaskDialog } from "./roadmap-dialogs"
import { RoadmapAnalytics } from "./roadmap-analytics"
import { RoadmapPhaseView } from "./roadmap-phase-view"
import type { PhaseStatus, Roadmap, RoadmapPhase } from "@/types"

function StatusBadge({ status }: { status: PhaseStatus }) {
  const m = STATUS_META[status]
  const Icon = m.icon
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-semibold", m.badge)}>
      <Icon className="h-3 w-3" />
      {m.label}
    </span>
  )
}

function PhaseTasks({ roadmapId, phase }: { roadmapId: string; phase: RoadmapPhase }) {
  const { toggleTask, deleteTask, addTask } = useRoadmapStore()
  const [taskOpen, setTaskOpen] = useState(false)
  const [quick, setQuick] = useState("")

  const quickAdd = (e: FormEvent) => {
    e.preventDefault()
    if (!quick.trim()) return
    addTask(roadmapId, phase.id, { title: quick.trim(), priority: "medium" })
    setQuick("")
  }

  return (
    <div className="space-y-1.5">
      {phase.tasks.map((t) => (
        <div key={t.id} className="group flex items-center gap-2.5 rounded-lg px-2 py-1.5 hover:bg-neutral-50 dark:hover:bg-neutral-800/60">
          <button
            onClick={() => toggleTask(roadmapId, phase.id, t.id)}
            className={cn(
              "flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-md border transition-all",
              t.completed ? "border-neutral-900 bg-neutral-900 dark:border-white dark:bg-white" : "border-neutral-300 hover:border-neutral-500 dark:border-neutral-600"
            )}
          >
            {t.completed && <svg viewBox="0 0 12 12" className="h-3 w-3 text-white dark:text-neutral-900"><path d="M2 6l2.5 2.5L10 3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>}
          </button>
          <div className="min-w-0 flex-1">
            <p className={cn("truncate text-sm", t.completed ? "text-neutral-400 line-through dark:text-neutral-500" : "text-neutral-700 dark:text-neutral-200")}>{t.title}</p>
            {(t.priority && t.priority !== "medium") || t.dueDate ? (
              <p className="flex items-center gap-1.5 text-[10px] text-neutral-400">
                {t.priority && t.priority !== "medium" && (
                  <span className={cn("rounded px-1 py-px font-semibold", PRIORITY_META[t.priority].badge)}>{PRIORITY_META[t.priority].label}</span>
                )}
                {t.dueDate && <span className="flex items-center gap-0.5"><CalendarDays className="h-3 w-3" />{formatShortDate(t.dueDate)}</span>}
              </p>
            ) : null}
          </div>
          <button onClick={() => deleteTask(roadmapId, phase.id, t.id)} className="rounded p-1 text-neutral-300 opacity-0 transition-all group-hover:opacity-100 hover:text-red-500 max-sm:opacity-100 dark:text-neutral-600">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}

      <Button variant="outline" size="sm" onClick={() => setTaskOpen(true)} className="h-7 w-full gap-1 text-xs">
        <Plus className="h-3 w-3" /> Add task
      </Button>
      <form onSubmit={quickAdd} className="flex items-center gap-2">
        <Input value={quick} onChange={(e) => setQuick(e.target.value)} placeholder="Quick add…" className="h-8 flex-1 text-sm" />
        <Button type="submit" size="sm" className="h-8 gap-1" disabled={!quick.trim()}>
          <Plus className="h-3.5 w-3.5" /> Add
        </Button>
      </form>
      <TaskDialog open={taskOpen} onOpenChange={setTaskOpen} roadmapId={roadmapId} phaseId={phase.id} />
    </div>
  )
}

function PhaseNotes({ roadmapId, phase }: { roadmapId: string; phase: RoadmapPhase }) {
  const { addNote, deleteNote } = useRoadmapStore()
  const [text, setText] = useState("")
  const [open, setOpen] = useState(phase.notes.length > 0)

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!text.trim()) return
    addNote(roadmapId, phase.id, text.trim())
    setText("")
  }

  return (
    <div className="mt-3 border-t border-neutral-100 pt-3 dark:border-neutral-800">
      <button onClick={() => setOpen((v) => !v)} className="flex items-center gap-1.5 text-xs font-semibold text-neutral-500 dark:text-neutral-400">
        <StickyNote className="h-3.5 w-3.5" />
        Notes ({phase.notes.length})
        {open ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-2 space-y-2">
              {phase.notes.map((n) => (
                <div key={n.id} className="flex items-start gap-2 rounded-lg bg-neutral-50 px-3 py-2 dark:bg-neutral-800/60">
                  <p className="flex-1 whitespace-pre-wrap text-xs text-neutral-600 dark:text-neutral-300">{n.text}</p>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <button onClick={() => deleteNote(roadmapId, phase.id, n.id)} className="rounded p-0.5 text-neutral-300 hover:text-red-500 dark:text-neutral-600">
                      <X className="h-3 w-3" />
                    </button>
                    <span className="text-[9px] text-neutral-400">{format(n.createdAt, "MMM d")}</span>
                  </div>
                </div>
              ))}
              <form onSubmit={submit} className="flex items-start gap-2">
                <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="Add a note / update…" className="h-8 flex-1 text-sm" />
                <Button type="submit" size="sm" variant="outline" className="h-8 gap-1" disabled={!text.trim()}>
                  <MessageSquarePlus className="h-3.5 w-3.5" /> Note
                </Button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function PhaseRow({
  roadmap, phase, index, onOpen,
}: {
  roadmap: Roadmap
  phase: RoadmapPhase
  index: number
  onOpen: () => void
}) {
  const { setPhaseStatus, deletePhase } = useRoadmapStore()
  const [expanded, setExpanded] = useState((phase.status === "in-progress" || phase.status === "blocked") && phase.tasks.length > 0)
  const [editOpen, setEditOpen] = useState(false)
  const meta = STATUS_META[phase.status]
  const pct = getPhaseProgress(phase)
  const doneTasks = phase.tasks.filter((t) => t.completed).length
  const overdue = phase.dueDate && !["completed", "on-hold"].includes(phase.status)
    ? new Date(phase.dueDate).getTime() < Date.now()
    : false

  const nextStatus: PhaseStatus =
    phase.status === "completed" ? "not-started"
    : phase.status === "not-started" ? "planning"
    : phase.status === "planning" ? "in-progress"
    : phase.status === "in-progress" ? "completed"
    : "in-progress"

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      className="rounded-2xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900"
    >
      <div className="flex items-start gap-3 p-4 pb-2.5">
        <button
          onClick={() => setPhaseStatus(roadmap.id, phase.id, nextStatus)}
          title={`Advance to "${STATUS_META[nextStatus].label}"`}
          className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 transition-all"
          style={{ borderColor: meta.dot, background: phase.status === "completed" ? meta.dot : "transparent" }}
        >
          {phase.status === "completed" ? (
            <svg viewBox="0 0 12 12" className="h-4 w-4 text-white"><path d="M2 6l2.5 2.5L10 3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
          ) : phase.status === "in-progress" ? (
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: meta.dot }} />
          ) : (
            <span
              className="h-2.5 w-2.5 rounded-full bg-neutral-300 dark:bg-neutral-700"
              style={["planning", "on-hold", "blocked"].includes(phase.status) ? { background: meta.dot } : undefined}
            />
          )}
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-neutral-300 dark:text-neutral-600">{String(index + 1).padStart(2, "0")}</span>
            <button onClick={onOpen} className="flex min-w-0 flex-1 items-center gap-1.5 text-left">
              <span className="truncate text-sm font-semibold text-neutral-900 dark:text-neutral-50">{phase.title}</span>
              {overdue && <span className="shrink-0 rounded bg-red-100 px-1 py-px text-[9px] font-bold text-red-600 dark:bg-red-500/15 dark:text-red-400">OVERDUE</span>}
            </button>
            <ChevronRight className="h-3.5 w-3.5 shrink-0 text-neutral-300 dark:text-neutral-600" />
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <StatusBadge status={phase.status} />
            {phase.priority && phase.priority !== "medium" && (
              <span className={cn("rounded-md px-1.5 py-0.5 text-[10px] font-semibold", PRIORITY_META[phase.priority].badge)}>{PRIORITY_META[phase.priority].label}</span>
            )}
            {(phase.startDate || phase.dueDate) && (
              <span className="flex items-center gap-1 rounded-md bg-neutral-100 px-1.5 py-0.5 text-[10px] font-medium text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400">
                <CalendarDays className="h-3 w-3" />
                {phase.startDate ? formatShortDate(phase.startDate) : "…"} – {phase.dueDate ? formatShortDate(phase.dueDate) : "…"}
              </span>
            )}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <button onClick={() => setExpanded((v) => !v)} className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 dark:hover:bg-neutral-800 dark:hover:text-neutral-300">
            {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <div className="px-4 pb-3">
        <div className="flex items-center gap-2">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
            <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: meta.dot }} />
          </div>
          <span className="text-[10px] font-bold" style={{ color: meta.dot }}>{pct}%</span>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-neutral-100 dark:border-neutral-800"
          >
            <div className="p-4 pt-3">
              {phase.description && <p className="mb-3 text-xs text-neutral-500 dark:text-neutral-400">{phase.description}</p>}
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-semibold uppercase tracking-wide text-neutral-400">Tasks · {doneTasks}/{phase.tasks.length}</span>
              </div>
              <div className="mt-1.5 space-y-1">
                <PhaseTasks roadmapId={roadmap.id} phase={phase} />
              </div>
              <PhaseNotes roadmapId={roadmap.id} phase={phase} />
              <div className="mt-3 flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setEditOpen(true)} className="h-7 gap-1 text-xs">
                  <Pencil className="h-3 w-3" /> Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 gap-1 text-xs text-red-500 hover:text-red-600"
                  onClick={() => { if (confirm(`Delete milestone "${phase.title}"?`)) deletePhase(roadmap.id, phase.id) }}
                >
                  <Trash2 className="h-3 w-3" /> Delete
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <PhaseDialog open={editOpen} onOpenChange={setEditOpen} roadmapId={roadmap.id} phase={phase} />
    </motion.div>
  )
}

export function RoadmapDashboard({ roadmap }: { roadmap: Roadmap }) {
  const router = useRouter()
  const deleteRoadmap = useRoadmapStore((s) => s.deleteRoadmap)
  const setPageTitle = usePageTitleStore((s) => s.setPageTitle)
  const [editOpen, setEditOpen] = useState(false)
  const [phaseOpen, setPhaseOpen] = useState(false)
  const [filter, setFilter] = useState<PhaseStatus | "all">("all")
  const [openPhaseId, setOpenPhaseId] = useState<string | null>(null)

  useEffect(() => {
    setPageTitle(roadmap.title)
    return () => setPageTitle(null)
  }, [roadmap.title, setPageTitle])

  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [openPhaseId])

  const openPhase = roadmap.phases.find((p) => p.id === openPhaseId)
  if (openPhase) {
    return (
      <RoadmapPhaseView
        roadmap={roadmap}
        phase={openPhase}
        onBack={() => setOpenPhaseId(null)}
        onOpenPhase={setOpenPhaseId}
      />
    )
  }

  const donePhases = roadmap.phases.filter((p) => p.status === "completed").length
  const blocked = roadmap.phases.filter((p) => p.status === "blocked").length
  const inProgress = roadmap.phases.filter((p) => p.status === "in-progress").length
  const totalTasks = roadmap.phases.reduce((n, p) => n + p.tasks.length, 0)
  const doneTasks = roadmap.phases.reduce((n, p) => n + p.tasks.filter((t) => t.completed).length, 0)
  const pct = roadmap.phases.length ? Math.round((donePhases / roadmap.phases.length) * 100) : 0
  const health = getRoadmapHealth(roadmap)
  const healthMeta = HEALTH_META[health]

  const counts = useMemo(() => {
    const c: Record<PhaseStatus, number> = { "not-started": 0, planning: 0, "in-progress": 0, "on-hold": 0, blocked: 0, completed: 0 }
    roadmap.phases.forEach((p) => { c[p.status] += 1 })
    return c
  }, [roadmap.phases])

  const visible = filter === "all" ? roadmap.phases : roadmap.phases.filter((p) => p.status === filter)

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
      <div className="mb-5 flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => { setPageTitle(null); router.push("/roadmap") }} className="gap-1.5">
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
                setPageTitle(null)
                router.push("/roadmap")
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
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-bold text-neutral-900 dark:text-white">{roadmap.title}</h1>
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
              <span className={cn("rounded-md px-1.5 py-0.5 text-[10px] font-semibold", PRIORITY_META[roadmap.priority].badge)}>{PRIORITY_META[roadmap.priority].label} priority</span>
              <span className="rounded-md bg-neutral-100 px-1.5 py-0.5 text-[10px] font-medium text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400">{CATEGORY_META[roadmap.category].label}</span>
              <span className={cn("rounded-md px-1.5 py-0.5 text-[10px] font-semibold", healthMeta.badge)}>{healthMeta.label}</span>
            </div>
            {roadmap.description && <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">{roadmap.description}</p>}
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-neutral-400">
              {roadmap.target && <span className="flex items-center gap-1.5"><Target className="h-3.5 w-3.5" /> {roadmap.target}</span>}
              {roadmap.deadline && <span className="flex items-center gap-1.5"><CalendarDays className="h-3.5 w-3.5" /> by {format(new Date(roadmap.deadline), "MMM d, yyyy")}</span>}
            </div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-3 gap-3 text-center sm:grid-cols-6">
          {STATUS_LIST.map((st) => (
            <div key={st} className="rounded-xl bg-neutral-50 py-2.5 dark:bg-neutral-800/60">
              <p className="text-lg font-bold text-neutral-900 dark:text-white">{counts[st]}</p>
              <p className="text-[10px] font-medium text-neutral-400">{STATUS_META[st].label}</p>
            </div>
          ))}
        </div>

        <div className="mt-6">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">Overall progress</p>
              <p className="text-xs text-neutral-400">
                {donePhases}/{roadmap.phases.length || 0} milestones · {doneTasks}/{totalTasks} tasks
                {blocked > 0 && <span className="text-rose-500"> · {blocked} blocked</span>}
                {inProgress > 0 && <span className="text-blue-500"> · {inProgress} in progress</span>}
              </p>
            </div>
            <p className="text-2xl font-bold text-neutral-900 dark:text-white">{pct}%</p>
          </div>
          <div className="mt-2 h-3 overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
            <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: pct === 100 ? "#10b981" : "#171717" }} />
          </div>
        </div>
      </div>

      <RoadmapAnalytics roadmap={roadmap} />

      <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <button
            onClick={() => setFilter("all")}
            className={cn("shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-all",
              filter === "all" ? "border-neutral-900 bg-neutral-900 text-white dark:border-white dark:bg-white dark:text-neutral-900" : "border-neutral-200 text-neutral-500 hover:bg-neutral-50 dark:border-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-800/60")}
          >
            All ({roadmap.phases.length})
          </button>
          {STATUS_LIST.map((st) => (
            <button
              key={st}
              onClick={() => setFilter(st)}
              className={cn("flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all",
                filter === st ? "border-neutral-900 bg-neutral-900 text-white dark:border-white dark:bg-white dark:text-neutral-900" : "border-neutral-200 text-neutral-500 hover:bg-neutral-50 dark:border-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-800/60")}
            >
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: STATUS_META[st].dot }} />
              {STATUS_META[st].label} ({counts[st]})
            </button>
          ))}
        </div>
        <Button size="sm" onClick={() => setPhaseOpen(true)} className="gap-1.5">
          <Plus className="h-3.5 w-3.5" /> Add milestone
        </Button>
      </div>

      {visible.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-4 flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-neutral-200 py-14 dark:border-neutral-800"
        >
          <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
            {roadmap.phases.length === 0 ? "No milestones yet" : "No milestones in this status"}
          </p>
          {roadmap.phases.length === 0 && (
            <>
              <p className="mt-1 text-xs text-neutral-400 dark:text-neutral-500">Break it down — “5 videos”, “10 videos”, “15 videos”…</p>
              <Button onClick={() => setPhaseOpen(true)} variant="outline" size="sm" className="mt-4 gap-1.5">
                <Plus className="h-3.5 w-3.5" /> Add your first milestone
              </Button>
            </>
          )}
        </motion.div>
      ) : (
        <div className="relative mt-4 space-y-3">
          <div className="absolute bottom-5 left-[27px] top-5 w-px bg-neutral-200 dark:bg-neutral-800" />
          <AnimatePresence mode="popLayout">
            {visible.map((phase) => (
              <div key={phase.id} className="relative pl-14">
                <div className="absolute left-[19px] top-[26px] h-4 w-4 -translate-y-1/2 rounded-full border-4 border-white dark:border-neutral-900" style={{ background: STATUS_META[phase.status].dot }} />
                <PhaseRow roadmap={roadmap} phase={phase} index={roadmap.phases.indexOf(phase)} onOpen={() => setOpenPhaseId(phase.id)} />
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