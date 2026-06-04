"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Zap, Medal, Flame, Check, Trophy, Plus, Edit3 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { useChallengeStore } from "@/store/use-challenge-store"
import { cn } from "@/lib/shadcn-utils"
import { format } from "date-fns"
import type { Challenge, ChallengeType } from "@/types"

const typeIcon: Record<ChallengeType, typeof Zap> = {
  "21": Zap, "60": Medal, "90": Trophy,
}

function ChallengeCard({ challenge, onEdit }: { challenge: Challenge; onEdit: (c: Challenge) => void }) {
  const { toggleDay, getProgress, deleteChallenge } = useChallengeStore()
  const progress = getProgress(challenge.id)
  const completed = challenge.days.filter((d) => d.completed).length
  const remaining = challenge.days.length - completed
  const allDone = remaining === 0
  const Icon = typeIcon[challenge.type]

  return (
    <motion.div layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-neutral-200/60 bg-white p-5 shadow-sm dark:border-neutral-800/60 dark:bg-neutral-950"
    >
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-neutral-100 dark:bg-neutral-800">
            <Icon className="h-5 w-5 text-neutral-600 dark:text-neutral-400" />
          </div>
          <div className="min-w-0">
            <h4 className="text-sm font-semibold text-neutral-900 dark:text-neutral-50 truncate">{challenge.title}</h4>
            {challenge.description && <p className="text-xs text-neutral-400 truncate">{challenge.description}</p>}
            <p className="text-[10px] text-neutral-400 mt-0.5">{challenge.startDate} → {challenge.endDate}</p>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(challenge)}>
            <Edit3 className="h-3.5 w-3.5" />
          </Button>
          {allDone && (
            <Button size="sm" className="h-7 gap-1 text-xs rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => deleteChallenge(challenge.id)}>
              <Check className="h-3.5 w-3.5" />Done
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="rounded-xl bg-neutral-50 p-3 text-center dark:bg-neutral-900">
          <p className="text-xl font-bold text-neutral-900 dark:text-neutral-50">{completed}</p>
          <p className="text-[10px] text-neutral-400">Done</p>
        </div>
        <div className="rounded-xl bg-neutral-50 p-3 text-center dark:bg-neutral-900">
          <p className="text-xl font-bold text-neutral-900 dark:text-neutral-50">{remaining}</p>
          <p className="text-[10px] text-neutral-400">Left</p>
        </div>
        <div className="rounded-xl bg-neutral-50 p-3 text-center dark:bg-neutral-900">
          <p className="text-xl font-bold text-neutral-900 dark:text-neutral-50">{progress}%</p>
          <p className="text-[10px] text-neutral-400">Progress</p>
        </div>
      </div>

      <Progress value={progress} className="h-2 mb-4" />

      <div className="flex flex-wrap gap-2 max-h-64 overflow-y-auto pr-1">
        {challenge.days.map((d) => (
          <button
            key={d.day}
            onClick={() => toggleDay(challenge.id, d.day)}
            className={cn(
              "flex items-center justify-center rounded-xl border-2 font-semibold text-sm transition-all",
              "h-[50px] w-[50px]",
              d.completed
                ? "bg-neutral-900 border-neutral-900 text-white dark:bg-neutral-50 dark:border-neutral-50 dark:text-neutral-900"
                : "bg-neutral-50 border-neutral-200 text-neutral-400 hover:border-neutral-900/30 dark:bg-neutral-900 dark:border-neutral-700 dark:hover:border-neutral-50/30"
            )}
            title={`Day ${d.day} - ${d.date}`}
          >
            {d.completed ? (
              <Check className="h-6 w-6" strokeWidth={3} />
            ) : (
              <span>{d.day}</span>
            )}
          </button>
        ))}
      </div>
    </motion.div>
  )
}

export function ChallengeSliderPanel() {
  const { challenges, isCreateModalOpen, setIsCreateModalOpen, addChallenge, updateChallenge } = useChallengeStore()
  const [editing, setEditing] = useState<Challenge | null>(null)
  const [editTitle, setEditTitle] = useState("")
  const [editDesc, setEditDesc] = useState("")
  const [editType, setEditType] = useState<ChallengeType>("21")
  const [editStart, setEditStart] = useState("")
  const [editEnd, setEditEnd] = useState("")

  const openEdit = (c: Challenge) => {
    setEditing(c)
    setEditTitle(c.title)
    setEditDesc(c.description)
    setEditType(c.type)
    setEditStart(c.startDate)
    setEditEnd(c.endDate)
  }

  const handleEdit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!editing || !editTitle.trim()) return
    updateChallenge(editing.id, { title: editTitle.trim(), description: editDesc.trim(), startDate: editStart, endDate: editEnd })
    setEditing(null)
  }

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Flame className="h-5 w-5 text-amber-500" />
          <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-50">Challenges</h3>
        </div>
        <Button size="sm" onClick={() => setIsCreateModalOpen(true)} className="gap-1.5 rounded-xl text-xs h-8">
          <Plus className="h-3.5 w-3.5" />New Challenge
        </Button>
      </div>

      {challenges.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-neutral-200 p-12 text-center text-sm text-neutral-400 dark:border-neutral-700">
          No challenges yet
        </div>
      ) : (
        <div className="space-y-3">
          {challenges.map((c) => <ChallengeCard key={c.id} challenge={c} onEdit={openEdit} />)}
        </div>
      )}

      <CreateChallengeModal />

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl">Edit Challenge</DialogTitle>
            <DialogDescription>Update challenge details.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-challenge-title">Title</Label>
              <Input id="edit-challenge-title" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-challenge-description">Description</Label>
              <Textarea id="edit-challenge-description" value={editDesc} onChange={(e) => setEditDesc(e.target.value)} rows={2} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="edit-challenge-start">Start Date</Label>
                <Input id="edit-challenge-start" type="date" value={editStart} onChange={(e) => setEditStart(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-challenge-end">End Date</Label>
                <Input id="edit-challenge-end" type="date" value={editEnd} onChange={(e) => setEditEnd(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Challenge Type</Label>
              <div className="flex gap-2">
                {(["21", "60", "90"] as ChallengeType[]).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setEditType(t)}
                    className={`flex-1 rounded-xl py-2 text-xs font-semibold transition-all ${
                      editType === t
                        ? "bg-neutral-900 text-white dark:bg-neutral-50 dark:text-neutral-900"
                        : "bg-neutral-100 text-neutral-500 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-400"
                    }`}
                  >
                    {t} Days
                  </button>
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
              <Button type="submit">Save</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}

function CreateChallengeModal() {
  const { isCreateModalOpen, setIsCreateModalOpen, addChallenge } = useChallengeStore()
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [type, setType] = useState<ChallengeType>("21")
  const [startDate, setStartDate] = useState(format(new Date(), "yyyy-MM-dd"))
  const [endDate, setEndDate] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    addChallenge({ title: title.trim(), description: description.trim(), type, joined: true, startDate, endDate })
    setTitle("")
    setDescription("")
    setType("21")
    setStartDate(format(new Date(), "yyyy-MM-dd"))
    setEndDate("")
    setIsCreateModalOpen(false)
  }

  return (
    <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl">New Challenge</DialogTitle>
          <DialogDescription>Start a 21, 60, or 90 day challenge.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="create-challenge-title">Title</Label>
            <Input id="create-challenge-title" placeholder="e.g. 21 Days of Fitness" value={title} onChange={(e) => setTitle(e.target.value)} autoFocus required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="create-challenge-description">Description</Label>
            <Textarea id="create-challenge-description" placeholder="What's your challenge about?" value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="create-challenge-start">Start Date</Label>
              <Input id="create-challenge-start" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-challenge-end">End Date</Label>
              <Input id="create-challenge-end" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Challenge Type</Label>
            <div className="flex gap-2">
              {(["21", "60", "90"] as ChallengeType[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={`flex-1 rounded-xl py-2 text-xs font-semibold transition-all ${
                    type === t
                      ? "bg-neutral-900 text-white dark:bg-neutral-50 dark:text-neutral-900"
                      : "bg-neutral-100 text-neutral-500 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-400"
                  }`}
                >
                  {t} Days
                </button>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={!title.trim()}>Start Challenge</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
