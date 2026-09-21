"use client"

import { useState, type FormEvent } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  ArrowLeft, Pencil, Trash2, Plus, ChevronDown, ChevronRight, X,
  CalendarDays, Target, CheckCircle2, StickyNote, MessageSquarePlus,
} from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/shadcn-utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  getPhaseProgress, useRoadmapStore,
} from "@/store/use-roadmap-store"
import {
  PRIORITY_META, STATUS_META, STATUS_LIST, formatShortDate,
} from "./roadmap-meta"
import { PhaseDialog, TaskDialog } from "./roadmap-dialogs"
import type { Roadmap, RoadmapPhase } from "@/types"

export function RoadmapPhaseView({
  roadmap, phase, onBack, onOpenPhase,
}: {
  roadmap: Roadmap
  phase: RoadmapPhase
  onBack: () => void
  onOpenPhase: (phaseId: string) => void
}) {
  const {
    setPhaseStatus, deletePhase,
    toggleTask, deleteTask, addTask, deleteNote, addNote,
  } = useRoadmapStore()
  const [editOpen, setEditOpen] = useState(false)
  const [taskOpen, setTaskOpen] = useState(false)
  const [notesOpen, setNotesOpen] = useState(true)
  const [noteText, setNoteText] = useState("")
  const [quick, setQuick] = useState("")

  const meta = STATUS_META[phase.status]
  const StatusIcon = meta.icon
  const pct = getPhaseProgress(phase)
  const doneTasks = phase.tasks.filter((t) => t.completed).length
  const index = roadmap.phases.indexOf(phase)
  const prev = roadmap.phases[index - 1]
  const next = roadmap.phases[index + 1]
  const overdue = phase.dueDate && phase.status !== "completed" && phase.status !== "on-hold"
    ? new Date(phase.dueDate).getTime() < Date.now()
    : false

  const cycleStatus = () => {
    const order: Record<string, string> = {
      "not-started": "planning",
      planning: "in-progress",
      "in-progress": "completed",
      completed: "not-started",
      "on-hold": "in-progress",
      blocked: "in-progress",
    }
    setPhaseStatus(roadmap.id, phase.id, order[phase.status] as any)
  }

  const quickAdd = (e: FormEvent) => {
    e.preventDefault()
    if (!quick.trim()) return
    addTask(roadmap.id, phase.id, { title: quick.trim(), priority: "medium" })
    setQuick("")
  }

  const noteAdd = (e: FormEvent) => {
    e.preventDefault()
    if (!noteText.trim()) return
    addNote(roadmap.id, phase.id, noteText.trim())
    setNoteText("")
  }

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
      <div className="mb-5 flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-1.5">
          <ArrowLeft className="h-4 w-4" /> {roadmap.title}
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
              if (confirm(`Delete milestone "${phase.title}"?`)) {
                deletePhase(roadmap.id, phase.id)
                onBack()
              }
            }}
          >
            <Trash2 className="h-3.5 w-3.5" /> Delete
          </Button>
        </div>
      </div>

      <div className="rounded-3xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wide text-neutral-400">
              Milestone {String(index + 1).padStart(2, "0")} of {roadmap.phases.length}
              {overdue && <span className="rounded bg-red-100 px-1.5 py-0.5 text-[9px] font-bold normal-case tracking-normal text-red-600 dark:bg-red-500/15 dark:text-red-400">Overdue</span>}
            </p>
            <h1 className="mt-1 text-2xl font-bold leading-tight text-neutral-900 dark:text-white">{phase.title}</h1>
            {phase.description && <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">{phase.description}</p>}
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <span className={cn("inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold", meta.badge)}>
            <StatusIcon className="h-3.5 w-3.5" /> {meta.label}
          </span>
          {phase.priority && <span className={cn("rounded-lg px-2.5 py-1.5 text-xs font-semibold", PRIORITY_META[phase.priority].badge)}>{PRIORITY_META[phase.priority].label} priority</span>}
          {(phase.startDate || phase.dueDate) && (
            <span className="flex items-center gap-1.5 rounded-lg bg-neutral-100 px-2.5 py-1.5 text-xs font-medium text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400">
              <CalendarDays className="h-3.5 w-3.5" />
              {phase.startDate ? formatShortDate(phase.startDate) : "…"} – {phase.dueDate ? formatShortDate(phase.dueDate) : "…"}
            </span>
          )}
        </div>

        <div className="mt-5 flex items-center gap-3">
          <div className="flex-1">
            <div className="flex items-center justify-between text-[11px] font-medium text-neutral-400">
              <span>{doneTasks}/{phase.tasks.length} tasks</span>
              <span>{pct}%</span>
            </div>
            <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
              <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: meta.dot }} />
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={cycleStatus} className="shrink-0 gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5" /> Advance status
          </Button>
        </div>
      </div>

      <div className="mt-6 rounded-3xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-neutral-400">
            <Target className="h-4 w-4" /> Tasks
          </h2>
          <Button variant="outline" size="sm" onClick={() => setTaskOpen(true)} className="gap-1.5">
            <Plus className="h-3.5 w-3.5" /> Add task
          </Button>
        </div>

        <div className="mt-3 space-y-1">
          {phase.tasks.length === 0 ? (
            <p className="py-6 text-center text-sm text-neutral-400 dark:text-neutral-500">No tasks yet — add concrete actions for this milestone.</p>
          ) : (
            phase.tasks.map((t) => {
              const overdueTask = t.dueDate && !t.completed && new Date(t.dueDate).getTime() < Date.now()
              return (
                <div key={t.id} className="group flex items-center gap-2.5 rounded-lg px-2 py-2 hover:bg-neutral-50 dark:hover:bg-neutral-800/60">
                  <button
                    onClick={() => toggleTask(roadmap.id, phase.id, t.id)}
                    className={cn(
                      "flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-all",
                      t.completed ? "border-neutral-900 bg-neutral-900 dark:border-white dark:bg-white" : "border-neutral-300 hover:border-neutral-500 dark:border-neutral-600"
                    )}
                  >
                    {t.completed && <CheckCircle2 className="h-3.5 w-3.5 text-white dark:text-neutral-900" />}
                  </button>
                  <div className="min-w-0 flex-1">
                    <p className={cn("text-sm", t.completed ? "text-neutral-400 line-through dark:text-neutral-500" : "text-neutral-700 dark:text-neutral-200")}>{t.title}</p>
                    {(t.priority && t.priority !== "medium") || t.dueDate ? (
                      <p className="mt-0.5 flex items-center gap-1.5 text-[10px] text-neutral-400">
                        {t.priority && t.priority !== "medium" && (
                          <span className={cn("rounded px-1 py-px font-semibold", PRIORITY_META[t.priority].badge)}>{PRIORITY_META[t.priority].label}</span>
                        )}
                        {t.dueDate && (
                          <span className={cn("flex items-center gap-0.5", overdueTask && "font-semibold text-red-500")}>
                            <CalendarDays className="h-3 w-3" />{formatShortDate(t.dueDate)}{overdueTask ? " → overdue" : ""}
                          </span>
                        )}
                      </p>
                    ) : null}
                  </div>
                  <button onClick={() => deleteTask(roadmap.id, phase.id, t.id)} className="rounded p-1 text-neutral-300 opacity-0 transition-all group-hover:opacity-100 hover:text-red-500 max-sm:opacity-100 dark:text-neutral-600">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              )
            })
          )}
        </div>

        <form onSubmit={quickAdd} className="mt-2 flex items-center gap-2">
          <Input value={quick} onChange={(e) => setQuick(e.target.value)} placeholder="Quick add task…" className="h-8 flex-1 text-sm" />
          <Button type="submit" size="sm" className="h-8 gap-1" disabled={!quick.trim()}>
            <Plus className="h-3.5 w-3.5" /> Add
          </Button>
        </form>
      </div>

      <div className="mt-4 rounded-3xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
        <button onClick={() => setNotesOpen((v) => !v)} className="flex w-full items-center justify-between">
          <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-neutral-400">
            <StickyNote className="h-4 w-4" /> Log & notes ({phase.notes.length})
          </h2>
          {notesOpen ? <ChevronDown className="h-4 w-4 text-neutral-400" /> : <ChevronRight className="h-4 w-4 text-neutral-400" />}
        </button>
        <AnimatePresence initial={false}>
          {notesOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="mt-3 space-y-2">
                {phase.notes.map((n) => (
                  <div key={n.id} className="flex items-start gap-2 rounded-lg bg-neutral-50 px-3 py-2.5 dark:bg-neutral-800/60">
                    <p className="flex-1 whitespace-pre-wrap text-xs text-neutral-600 dark:text-neutral-300">{n.text}</p>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <button onClick={() => deleteNote(roadmap.id, phase.id, n.id)} className="rounded p-0.5 text-neutral-300 hover:text-red-500 dark:text-neutral-600">
                        <X className="h-3 w-3" />
                      </button>
                      <span className="text-[9px] text-neutral-400">{format(n.createdAt, "MMM d")}</span>
                    </div>
                  </div>
                ))}
                {phase.notes.length === 0 && <p className="py-4 text-center text-xs text-neutral-400">No notes yet — log decisions, blockers, or wins.</p>}
                <form onSubmit={noteAdd} className="flex items-start gap-2">
                  <Input value={noteText} onChange={(e) => setNoteText(e.target.value)} placeholder="Add a note…" className="h-8 flex-1 text-sm" />
                  <Button type="submit" size="sm" variant="outline" className="h-8 gap-1" disabled={!noteText.trim()}>
                    <MessageSquarePlus className="h-3.5 w-3.5" /> Log
                  </Button>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {(prev || next) && (
        <div className="mt-4 grid grid-cols-2 gap-3">
          {prev ? (
            <button
              onClick={() => onOpenPhase(prev.id)}
              className="rounded-2xl border border-neutral-200 bg-white p-4 text-left hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:bg-neutral-800/60"
            >
              <p className="flex items-center gap-1 text-[10px] font-semibold uppercase text-neutral-400"><ArrowLeft className="h-3 w-3" /> Previous</p>
              <p className="mt-1 truncate text-sm font-semibold text-neutral-700 dark:text-neutral-200">{prev.title}</p>
            </button>
          ) : <div />}
          {next && (
            <button
              onClick={() => onOpenPhase(next.id)}
              className="rounded-2xl border border-neutral-200 bg-white p-4 text-right hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:bg-neutral-800/60"
            >
              <p className="flex items-center justify-end gap-1 text-[10px] font-semibold uppercase text-neutral-400">Next <ArrowLeft className="h-3 w-3 rotate-180" /></p>
              <p className="mt-1 truncate text-sm font-semibold text-neutral-700 dark:text-neutral-200">{next.title}</p>
            </button>
          )}
        </div>
      )}

      <PhaseDialog open={editOpen} onOpenChange={setEditOpen} roadmapId={roadmap.id} phase={phase} />
      <TaskDialog open={taskOpen} onOpenChange={setTaskOpen} roadmapId={roadmap.id} phaseId={phase.id} />

      <div className="mt-6">
        <p className="mb-2 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-neutral-400">
          <Target className="h-4 w-4" /> Status flow
        </p>
        <div className="flex flex-wrap items-center gap-2">
          {STATUS_LIST.map((st, i) => {
            const m = STATUS_META[st]
            const isActive = st === phase.status
            const Icon = m.icon
            return (
              <button
                key={st}
                onClick={() => setPhaseStatus(roadmap.id, phase.id, st)}
                className={cn(
                  "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all",
                  isActive ? "border-neutral-900 bg-neutral-900 text-white dark:border-white dark:bg-white dark:text-neutral-900" : "border-neutral-200 text-neutral-500 hover:bg-neutral-50 dark:border-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-800/60"
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {m.label}
              </button>
            )
          })}
        </div>
      </div>
    </motion.div>
  )
}