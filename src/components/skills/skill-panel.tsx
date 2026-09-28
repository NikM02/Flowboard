"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Book, Video, GraduationCap, Users, Plus, Check, Archive, Download, Trash2, Pencil, List } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/shadcn-utils"
import { Button } from "@/components/ui/button"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { useSkillStore } from "@/store/use-skill-store"
import { downloadCSV } from "@/lib/csv"
import type { SkillSource } from "@/types"

const sourceConfig: Record<SkillSource, { label: string; icon: typeof Book }> = {
  book: { label: "Book", icon: Book },
  course: { label: "Course", icon: GraduationCap },
  youtube: { label: "YouTube", icon: Video },
  person: { label: "Person", icon: Users },
}

function formatSkillDate(d: string) {
  const dt = new Date(d)
  if (isNaN(dt.getTime())) return d
  return dt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

function CreateSkillDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const addSkill = useSkillStore((s) => s.addSkill)
  const [name, setName] = useState("")
  const [source, setSource] = useState<SkillSource>("book")
  const [sourceDetail, setSourceDetail] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [notes, setNotes] = useState("")

  const dateInvalid = !!startDate && !!endDate && endDate < startDate
  const endTooEarly = !!endDate && endDate < new Date().toISOString().slice(0, 10)

  const handleSubmit = () => {
    if (!name.trim() || !startDate || !endDate || dateInvalid || endTooEarly) return
    addSkill({ name: name.trim(), source, sourceDetail: sourceDetail.trim(), startDate, endDate, notes: notes.trim() })
    setName("")
    setSource("book")
    setSourceDetail("")
    setStartDate("")
    setEndDate("")
    setNotes("")
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New Skill</DialogTitle>
          <DialogDescription>Track a skill you're learning</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="create-skill-name">Skill name</Label>
            <Input id="create-skill-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. TypeScript" />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="create-skill-source">Source</Label>
              <Select value={source} onValueChange={(v) => setSource(v as SkillSource)}>
                <SelectTrigger id="create-skill-source">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="book">Book</SelectItem>
                  <SelectItem value="course">Course</SelectItem>
                  <SelectItem value="youtube">YouTube</SelectItem>
                  <SelectItem value="person">Person</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-skill-source-detail">Source detail</Label>
              <Input id="create-skill-source-detail"
                value={sourceDetail}
                onChange={(e) => setSourceDetail(e.target.value)}
                placeholder="Title, channel, name..."
              />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="create-skill-start-date">Start date</Label>
              <Input id="create-skill-start-date" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-skill-end-date">End date</Label>
              <Input id="create-skill-end-date" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
          </div>
          {endTooEarly ? (
            <p className="text-xs font-medium text-red-500">
              End date must be today or in the future.
            </p>
          ) : dateInvalid ? (
            <p className="text-xs font-medium text-red-500">
              End date must be on or after the start date.
            </p>
          ) : null}
          <div className="space-y-2">
            <Label htmlFor="create-skill-notes">Notes (optional)</Label>
            <Textarea id="create-skill-notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Any notes..." />
          </div>
          <Button onClick={handleSubmit} className="w-full" disabled={!name.trim() || !startDate || !endDate || dateInvalid || endTooEarly}>
            Create skill
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function EditSkillDialog({
  skill, open, onOpenChange,
}: {
  skill: { id: string; name: string; source: SkillSource; sourceDetail: string; startDate: string; endDate: string; notes: string }
  open: boolean
  onOpenChange: (v: boolean) => void
}) {
  const updateSkill = useSkillStore((s) => s.updateSkill)
  const [name, setName] = useState(skill.name)
  const [source, setSource] = useState(skill.source)
  const [sourceDetail, setSourceDetail] = useState(skill.sourceDetail)
  const [startDate, setStartDate] = useState(skill.startDate)
  const [endDate, setEndDate] = useState(skill.endDate)
  const [notes, setNotes] = useState(skill.notes)

  const dateInvalid = !!startDate && !!endDate && endDate < startDate
  const endTooEarly = !!endDate && endDate < new Date().toISOString().slice(0, 10)

  const handleSubmit = () => {
    if (!name.trim() || !startDate || !endDate || dateInvalid || endTooEarly) return
    updateSkill(skill.id, { name: name.trim(), source, sourceDetail: sourceDetail.trim(), startDate, endDate, notes: notes.trim() })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Skill</DialogTitle>
          <DialogDescription>Update the skill details</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-skill-name">Skill name</Label>
            <Input id="edit-skill-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. TypeScript" />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="edit-skill-source">Source</Label>
              <Select value={source} onValueChange={(v) => setSource(v as SkillSource)}>
                <SelectTrigger id="edit-skill-source">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="book">Book</SelectItem>
                  <SelectItem value="course">Course</SelectItem>
                  <SelectItem value="youtube">YouTube</SelectItem>
                  <SelectItem value="person">Person</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-skill-source-detail">Source detail</Label>
              <Input id="edit-skill-source-detail" value={sourceDetail} onChange={(e) => setSourceDetail(e.target.value)} placeholder="Title, channel, name..." />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="edit-skill-start-date">Start date</Label>
              <Input id="edit-skill-start-date" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-skill-end-date">End date</Label>
              <Input id="edit-skill-end-date" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
          </div>
          {endTooEarly ? (
            <p className="text-xs font-medium text-red-500">
              End date must be today or in the future.
            </p>
          ) : dateInvalid ? (
            <p className="text-xs font-medium text-red-500">
              End date must be on or after the start date.
            </p>
          ) : null}
          <div className="space-y-2">
            <Label htmlFor="edit-skill-notes">Notes (optional)</Label>
            <Textarea id="edit-skill-notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Any notes..." />
          </div>
          <Button onClick={handleSubmit} className="w-full" disabled={!name.trim() || !startDate || !endDate || dateInvalid || endTooEarly}>
            Save changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function SkillCard({ skill }: { skill: { id: string; name: string; source: SkillSource; sourceDetail: string; startDate: string; endDate: string; progress: number; notes: string } }) {
  const { updateProgress, completeSkill, deleteSkill } = useSkillStore()
  const [editOpen, setEditOpen] = useState(false)
  const SourceIcon = sourceConfig[skill.source].icon

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="card-modern card-hover glass group rounded-2xl p-4 sm:p-5"
    >
<div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex min-w-0 items-center gap-2.5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
                <SourceIcon className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <h3 className="truncate font-semibold text-neutral-900 dark:text-neutral-50">{skill.name}</h3>
                <p className="truncate text-xs text-neutral-500 dark:text-neutral-400">
                  {sourceConfig[skill.source].label} &middot; {skill.sourceDetail}
                </p>
              </div>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1">
          <button
            onClick={() => setEditOpen(true)}
            aria-label="Edit skill"
            className="flex h-10 w-10 items-center justify-center rounded-lg text-neutral-400 opacity-0 transition-all hover:bg-neutral-100 hover:text-neutral-600 group-hover:opacity-100 max-sm:opacity-100 dark:hover:bg-neutral-800 dark:hover:text-neutral-300"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => deleteSkill(skill.id)}
            aria-label="Delete skill"
            className="flex h-10 w-10 items-center justify-center rounded-lg text-neutral-400 opacity-0 transition-all hover:bg-red-50 hover:text-red-500 group-hover:opacity-100 max-sm:opacity-100 dark:hover:bg-red-950/50"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-neutral-500 dark:text-neutral-400">
        <span className="whitespace-nowrap">{formatSkillDate(skill.startDate)}</span>
        <span className="text-neutral-300 dark:text-neutral-600">&rarr;</span>
        <span className="whitespace-nowrap">{formatSkillDate(skill.endDate)}</span>
        {skill.notes && (
          <>
            <span className="text-neutral-300 dark:text-neutral-600">&middot;</span>
            <span className="truncate">{skill.notes}</span>
          </>
        )}
      </div>

      <div className="mt-3 space-y-2.5 sm:flex sm:items-center sm:gap-3 sm:space-y-0">
        <div className="flex-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-neutral-500 dark:text-neutral-400">Progress</span>
            <span className="font-medium text-neutral-700 dark:text-neutral-300">{skill.progress}%</span>
          </div>
          <div className="relative mt-1.5 h-2 w-full overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
            <motion.div
              className="absolute inset-y-0 left-0 rounded-full bg-neutral-900 dark:bg-neutral-50"
              initial={{ width: 0 }}
              animate={{ width: `${skill.progress}%` }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            />
          </div>
        </div>
        <div className="flex w-full items-center gap-2 sm:w-auto">
          <Button
            variant="outline"
            size="sm"
            className="h-9 flex-1 gap-1.5 text-xs sm:w-auto sm:flex-none sm:px-2.5"
            onClick={() => updateProgress(skill.id, Math.max(0, skill.progress - 10))}
          >
            -10
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-9 flex-1 gap-1.5 text-xs sm:w-auto sm:flex-none sm:px-2.5"
            onClick={() => updateProgress(skill.id, Math.min(100, skill.progress + 10))}
          >
            +10
          </Button>
        </div>
      </div>

      {skill.progress === 100 && (
        <Button
          onClick={() => completeSkill(skill.id)}
          className="mt-3 h-10 w-full gap-2"
          size="sm"
        >
          <Check className="h-4 w-4" />
          Mark as Complete
        </Button>
      )}

      <EditSkillDialog skill={skill} open={editOpen} onOpenChange={setEditOpen} />
    </motion.div>
  )
}

export function SkillPanel() {
  const [createOpen, setCreateOpen] = useState(false)
  const [tab, setTab] = useState<"active" | "archive">("active")
  const { getActive, getCompleted, clearCompleted } = useSkillStore()

  const active = getActive()
  const completed = getCompleted()

  const handleExport = () => {
    const header = ["Name", "Source", "Source Detail", "Start Date", "End Date", "Progress %", "Notes"]
    const rows = completed.map((s) => [
      s.name,
      sourceConfig[s.source].label,
      s.sourceDetail,
      s.startDate,
      s.endDate,
      `${s.progress}%`,
      s.notes,
    ])
    downloadCSV(`skill-archive-${new Date().toISOString().slice(0, 10)}.csv`, header, rows)
  }

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-2">
          <Link href="/skills/bucket-list" className="flex-1 sm:w-auto sm:flex-none">
            <Button variant="outline" className="w-full gap-2">
              <List className="h-4 w-4" />
              Bucket List
            </Button>
          </Link>
          <Button onClick={() => setCreateOpen(true)} className="w-full flex-1 gap-2 sm:w-auto sm:flex-none">
            <Plus className="h-4 w-4" />
            New Skill
          </Button>
        </div>

        <div className="flex w-full gap-1 overflow-x-auto rounded-xl bg-neutral-100 p-1 dark:bg-neutral-800 sm:w-auto">
          {(["active", "archive"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                "flex min-h-10 flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg px-4 py-2.5 text-sm font-medium capitalize transition-all sm:flex-none",
                tab === t
                  ? "bg-white text-neutral-900 shadow-sm dark:bg-neutral-900 dark:text-neutral-50"
                  : "text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
              )}
            >
              {t === "archive" && <Archive className="h-3.5 w-3.5" />}
              {t} ({t === "active" ? active.length : completed.length})
            </button>
          ))}
        </div>
      </div>

      {tab === "active" ? (
        active.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-neutral-200 py-20 dark:border-neutral-800"
          >
            <GraduationCap className="mb-4 h-12 w-12 text-neutral-300 dark:text-neutral-600" />
            <p className="text-lg font-medium text-neutral-500 dark:text-neutral-400">No skills yet</p>
            <p className="mt-1 text-sm text-neutral-400 dark:text-neutral-500">
              Start tracking something you're learning
            </p>
            <Button onClick={() => setCreateOpen(true)} variant="outline" className="mt-4 gap-2">
              <Plus className="h-4 w-4" />
              Add your first skill
            </Button>
          </motion.div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            <AnimatePresence mode="popLayout">
              {active.map((skill) => (
                <SkillCard key={skill.id} skill={skill} />
              ))}
            </AnimatePresence>
          </div>
        )
      ) : completed.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-neutral-200 py-20 text-center dark:border-neutral-800"
        >
          <Archive className="mb-4 h-12 w-12 text-neutral-300 dark:text-neutral-600" />
          <p className="text-lg font-medium text-neutral-500 dark:text-neutral-400">Archive is empty</p>
          <p className="mt-1 text-sm text-neutral-400 dark:text-neutral-500">
            Skills you mark as complete will show up here.
          </p>
        </motion.div>
      ) : (
        <div>
          <div className="mb-3 flex flex-col gap-2 sm:flex-row">
            <Button variant="outline" size="sm" onClick={handleExport} className="h-10 gap-2 sm:h-9">
              <Download className="h-3.5 w-3.5" />
              Export (.csv)
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => { if (confirm(`Clear all ${completed.length} completed skills?`)) clearCompleted() }}
              className="h-10 gap-2 text-red-500 hover:text-red-600 sm:h-9"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Clear all
            </Button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <AnimatePresence mode="popLayout">
              {completed.map((skill) => (
                <div
                  key={skill.id}
                  className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-900/50"
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <Check className="h-4 w-4 shrink-0 text-green-500" />
                    <span className="min-w-0 truncate font-medium text-neutral-700 dark:text-neutral-300">{skill.name}</span>
                  </div>
                  <p className="mt-1 truncate text-xs text-neutral-500">
                    {sourceConfig[skill.source].label} &middot; {skill.sourceDetail}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-neutral-400">
                    <span>{skill.startDate} &rarr; {skill.endDate}</span>
                    <span className="font-semibold text-green-600 dark:text-green-400">{skill.progress}%</span>
                  </div>
                </div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}

      <CreateSkillDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  )
}
