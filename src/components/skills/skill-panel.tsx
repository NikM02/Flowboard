"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Book, Video, GraduationCap, Users, Plus, Check, Archive, Download, Trash2, Pencil } from "lucide-react"
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
import type { SkillSource } from "@/types"

const sourceConfig: Record<SkillSource, { label: string; icon: typeof Book }> = {
  book: { label: "Book", icon: Book },
  course: { label: "Course", icon: GraduationCap },
  youtube: { label: "YouTube", icon: Video },
  person: { label: "Person", icon: Users },
}

function CreateSkillDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const addSkill = useSkillStore((s) => s.addSkill)
  const [name, setName] = useState("")
  const [source, setSource] = useState<SkillSource>("book")
  const [sourceDetail, setSourceDetail] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [notes, setNotes] = useState("")

  const handleSubmit = () => {
    if (!name.trim() || !startDate || !endDate) return
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
          <div className="grid grid-cols-2 gap-4">
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
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="create-skill-start-date">Start date</Label>
              <Input id="create-skill-start-date" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-skill-end-date">End date</Label>
              <Input id="create-skill-end-date" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="create-skill-notes">Notes (optional)</Label>
            <Textarea id="create-skill-notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Any notes..." />
          </div>
          <Button onClick={handleSubmit} className="w-full" disabled={!name.trim() || !startDate || !endDate}>
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

  const handleSubmit = () => {
    if (!name.trim() || !startDate || !endDate) return
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
          <div className="grid grid-cols-2 gap-4">
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
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-skill-start-date">Start date</Label>
              <Input id="edit-skill-start-date" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-skill-end-date">End date</Label>
              <Input id="edit-skill-end-date" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-skill-notes">Notes (optional)</Label>
            <Textarea id="edit-skill-notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Any notes..." />
          </div>
          <Button onClick={handleSubmit} className="w-full" disabled={!name.trim() || !startDate || !endDate}>
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
      className="group rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm transition-all duration-200 hover:shadow-md dark:border-neutral-800 dark:bg-neutral-900"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400">
              <SourceIcon className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-semibold text-neutral-900 dark:text-neutral-50">{skill.name}</h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                {sourceConfig[skill.source].label} &middot; {skill.sourceDetail}
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setEditOpen(true)}
            className="shrink-0 rounded-lg p-1.5 text-neutral-400 opacity-0 transition-all hover:bg-neutral-100 hover:text-neutral-600 group-hover:opacity-100 max-sm:opacity-100 dark:hover:bg-neutral-800 dark:hover:text-neutral-300"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => deleteSkill(skill.id)}
            className="shrink-0 rounded-lg p-1.5 text-neutral-400 opacity-0 transition-all hover:bg-red-50 hover:text-red-500 group-hover:opacity-100 max-sm:opacity-100 dark:hover:bg-red-950/50"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-neutral-500 dark:text-neutral-400">
        <span>{skill.startDate}</span>
        <span className="text-neutral-300 dark:text-neutral-600">&rarr;</span>
        <span>{skill.endDate}</span>
        {skill.notes && (
          <>
            <span className="text-neutral-300 dark:text-neutral-600">&middot;</span>
            <span className="truncate">{skill.notes}</span>
          </>
        )}
      </div>

      <div className="mt-3 flex items-center gap-3">
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
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-8 px-2 text-xs"
            onClick={() => updateProgress(skill.id, Math.max(0, skill.progress - 10))}
          >
            -10
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8 px-2 text-xs"
            onClick={() => updateProgress(skill.id, Math.min(100, skill.progress + 10))}
          >
            +10
          </Button>
        </div>
      </div>

      {skill.progress === 100 && (
        <Button
          onClick={() => completeSkill(skill.id)}
          className="mt-3 w-full gap-2"
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
  const [showArchive, setShowArchive] = useState(false)
  const skills = useSkillStore((s) => s.skills)
  const { getActive, getCompleted, clearCompleted } = useSkillStore()

  const active = getActive()
  const completed = getCompleted()

  const handleExport = () => {
    const data = completed.map((s) => ({
      Name: s.name,
      Source: sourceConfig[s.source].label,
      "Source Detail": s.sourceDetail,
      "Start Date": s.startDate,
      "End Date": s.endDate,
      Progress: `${s.progress}%`,
      Notes: s.notes,
    }))
    const ws = { sheet: data }
    import("xlsx").then((XLSX) => {
      const wb = XLSX.utils.book_new()
      const sheet = XLSX.utils.json_to_sheet(data)
      XLSX.utils.book_append_sheet(wb, sheet, "Skills")
      XLSX.writeFile(wb, "skill-archive.xlsx")
    })
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">
            Skill Enhancement
          </h1>
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
            Track skills you're learning from books, courses, YouTube, and people
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          New Skill
        </Button>
      </div>

      {active.length === 0 && completed.length === 0 ? (
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
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <AnimatePresence mode="popLayout">
              {active.map((skill) => (
                <SkillCard key={skill.id} skill={skill} />
              ))}
            </AnimatePresence>
          </div>

          {completed.length > 0 && (
            <div className="mt-10">
              <button
                onClick={() => setShowArchive(!showArchive)}
                className="flex items-center gap-2 text-sm font-medium text-neutral-500 transition-colors hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-50"
              >
                <Archive className="h-4 w-4" />
                Completed Skills ({completed.length})
              </button>

              <AnimatePresence>
                {showArchive && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="mt-4 overflow-hidden"
                  >
                    <div className="mb-3 flex gap-2">
                      <Button variant="outline" size="sm" onClick={handleExport} className="gap-2">
                        <Download className="h-3.5 w-3.5" />
                        Export
                      </Button>
                      <Button variant="outline" size="sm" onClick={clearCompleted} className="gap-2 text-red-500 hover:text-red-600">
                        <Trash2 className="h-3.5 w-3.5" />
                        Clear
                      </Button>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {completed.map((skill) => (
                        <div
                          key={skill.id}
                          className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-900/50"
                        >
                          <div className="flex items-center gap-2">
                            <Check className="h-4 w-4 text-green-500" />
                            <span className="font-medium text-neutral-700 dark:text-neutral-300">{skill.name}</span>
                          </div>
                          <p className="mt-1 text-xs text-neutral-500">
                            {sourceConfig[skill.source].label} &middot; {skill.sourceDetail}
                          </p>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </>
      )}

      <CreateSkillDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  )
}
