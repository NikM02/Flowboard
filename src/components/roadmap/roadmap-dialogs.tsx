"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select"
import { cn } from "@/lib/shadcn-utils"
import { useRoadmapStore } from "@/store/use-roadmap-store"
import type { Roadmap, RoadmapPhase, PhaseStatus, RoadmapPriority, RoadmapCategory } from "@/types"
import {
  CATEGORY_LIST, CATEGORY_META, PRIORITY_LIST, PRIORITY_META, STATUS_LIST, STATUS_META,
} from "./roadmap-meta"

const EMOJIS = ["🎯", "🚀", "📢", "🎬", "🎧", "💪", "💰", "🌱", "🧠", "🏦", "📚", "🏃"]

function EmojiPicker({ value, onChange }: { value: string; onChange: (e: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {EMOJIS.map((e) => (
        <button
          key={e}
          onClick={() => onChange(e)}
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-xl border text-lg transition-all",
            value === e
              ? "border-neutral-900 bg-neutral-900/5 dark:border-white dark:bg-white/10"
              : "border-neutral-200 hover:bg-neutral-50 dark:border-neutral-800 dark:hover:bg-neutral-800/60"
          )}
        >
          {e}
        </button>
      ))}
    </div>
  )
}

function CategorySelect({ value, onChange }: { value: RoadmapCategory; onChange: (v: RoadmapCategory) => void }) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as RoadmapCategory)}>
      <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
      <SelectContent>
        {CATEGORY_LIST.map((c) => (
          <SelectItem key={c} value={c}>{CATEGORY_META[c].label}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

function PrioritySelect({ value, onChange }: { value: RoadmapPriority; onChange: (v: RoadmapPriority) => void }) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as RoadmapPriority)}>
      <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
      <SelectContent>
        {PRIORITY_LIST.map((p) => (
          <SelectItem key={p} value={p}>{PRIORITY_META[p].label}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

export function CreateRoadmapDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const addRoadmap = useRoadmapStore((s) => s.addRoadmap)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [emoji, setEmoji] = useState("🎯")
  const [category, setCategory] = useState<RoadmapCategory>("product")
  const [priority, setPriority] = useState<RoadmapPriority>("medium")
  const [target, setTarget] = useState("")
  const [deadline, setDeadline] = useState("")
  const [error, setError] = useState("")

  const submit = () => {
    if (!title.trim()) {
      setError("Give your roadmap a name.")
      return
    }
    addRoadmap({
      title: title.trim(),
      description: description.trim(),
      emoji,
      category,
      priority,
      target: target.trim(),
      deadline: deadline || undefined,
    })
    setTitle(""); setDescription(""); setEmoji("🎯"); setCategory("product"); setPriority("medium")
    setTarget(""); setDeadline(""); setError("")
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New Roadmap</DialogTitle>
          <DialogDescription>Plan a big goal, define its type and priority, then break it into tracked milestones.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="rm-title">Roadmap name</Label>
            <Input id="rm-title" value={title} onChange={(e) => { setTitle(e.target.value); setError("") }} placeholder="e.g. Launch a YouTube channel" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="rm-desc">Description</Label>
            <Textarea id="rm-desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What does success look like and why does this matter?" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Category</Label>
              <CategorySelect value={category} onChange={setCategory} />
            </div>
            <div className="space-y-2">
              <Label>RoadmapPriority</Label>
              <PrioritySelect value={priority} onChange={setPriority} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="rm-target">Goal / target</Label>
              <Input id="rm-target" value={target} onChange={(e) => setTarget(e.target.value)} placeholder="e.g. 1,000 subscribers" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rm-deadline">Deadline</Label>
              <Input id="rm-deadline" type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Icon</Label>
            <EmojiPicker value={emoji} onChange={setEmoji} />
          </div>
          {error && <p className="text-xs font-medium text-red-500">{error}</p>}
          <Button onClick={submit} className="w-full" disabled={!title.trim()}>Create roadmap</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function EditRoadmapDialog({ roadmap, open, onOpenChange }: { roadmap: Roadmap; open: boolean; onOpenChange: (v: boolean) => void }) {
  const updateRoadmap = useRoadmapStore((s) => s.updateRoadmap)
  const [title, setTitle] = useState(roadmap.title)
  const [description, setDescription] = useState(roadmap.description ?? "")
  const [emoji, setEmoji] = useState(roadmap.emoji)
  const [category, setCategory] = useState<RoadmapCategory>(roadmap.category)
  const [priority, setPriority] = useState<RoadmapPriority>(roadmap.priority)
  const [target, setTarget] = useState(roadmap.target ?? "")
  const [deadline, setDeadline] = useState(roadmap.deadline ?? "")

  const submit = () => {
    updateRoadmap(roadmap.id, {
      title: title.trim(),
      description: description.trim(),
      emoji,
      category,
      priority,
      target: target.trim(),
      deadline: deadline || undefined,
    })
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
              <Label>Category</Label>
              <CategorySelect value={category} onChange={setCategory} />
            </div>
            <div className="space-y-2">
              <Label>RoadmapPriority</Label>
              <PrioritySelect value={priority} onChange={setPriority} />
            </div>
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
            <EmojiPicker value={emoji} onChange={setEmoji} />
          </div>
          <Button onClick={submit} className="w-full" disabled={!title.trim()}>Save changes</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function PhaseDialog({
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
  const [status, setStatus] = useState<PhaseStatus>(phase?.status ?? "not-started")
  const [priority, setPriority] = useState<RoadmapPriority>(phase?.priority ?? "medium")
  const [startDate, setStartDate] = useState(phase?.startDate ?? "")
  const [dueDate, setDueDate] = useState(phase?.dueDate ?? "")

  const submit = () => {
    if (!title.trim()) return
    if (isEdit && phase) {
      updatePhase(roadmapId, phase.id, {
        title: title.trim(),
        description: description.trim() || undefined,
        status,
        priority,
        startDate: startDate || undefined,
        dueDate: dueDate || undefined,
      })
    } else {
      addPhase(roadmapId, {
        title: title.trim(),
        description: description.trim() || undefined,
        status,
        priority,
        startDate: startDate || undefined,
        dueDate: dueDate || undefined,
      })
    }
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Milestone" : "New Milestone"}</DialogTitle>
          <DialogDescription>A tracked stage of the roadmap — set dates, priority, and status.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="ph-title">Milestone title</Label>
            <Input id="ph-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder='e.g. "5 videos" or "First 30 days"' />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ph-desc">Description</Label>
            <Textarea id="ph-desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What gets delivered at this milestone?" />
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <div className="grid grid-cols-2 gap-1.5">
              {STATUS_LIST.map((st) => {
                const m = STATUS_META[st]
                const Icon = m.icon
                return (
                  <button
                    key={st}
                    onClick={() => setStatus(st)}
                    className={cn(
                      "flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-medium transition-all",
                      status === st
                        ? "border-transparent bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
                        : "border-neutral-200 text-neutral-500 hover:bg-neutral-50 dark:border-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-800/60"
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
            <Label>RoadmapPriority</Label>
            <PrioritySelect value={priority} onChange={setPriority} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="ph-start">Start date</Label>
              <Input id="ph-start" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ph-due">Due date</Label>
              <Input id="ph-due" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
          </div>
          <Button onClick={submit} className="w-full" disabled={!title.trim()}>
            {isEdit ? "Save changes" : "Add milestone"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function TaskDialog({
  open, onOpenChange, roadmapId, phaseId,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  roadmapId: string
  phaseId: string
}) {
  const addTask = useRoadmapStore((s) => s.addTask)
  const [title, setTitle] = useState("")
  const [priority, setPriority] = useState<RoadmapPriority>("medium")
  const [dueDate, setDueDate] = useState("")

  const submit = () => {
    if (!title.trim()) return
    addTask(roadmapId, phaseId, {
      title: title.trim(),
      priority,
      dueDate: dueDate || undefined,
    })
    setTitle(""); setPriority("medium"); setDueDate("")
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Task</DialogTitle>
          <DialogDescription>A concrete action that moves this milestone forward.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="task-title">Task</Label>
            <Input id="task-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Script and record first video" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>RoadmapPriority</Label>
              <PrioritySelect value={priority} onChange={setPriority} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="task-due">Due date</Label>
              <Input id="task-due" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
          </div>
          <Button onClick={submit} className="w-full" disabled={!title.trim()}>Add task</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}