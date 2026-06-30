"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Zap, Medal, Flame, Check, Trophy, Plus, Edit3, Trash2, LayoutGrid, List } from "lucide-react"
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
  "21": Zap, "30": Medal, "90": Trophy,
}

const typeLabel: Record<ChallengeType, string> = {
  "21": "21 Days", "30": "30 Days", "90": "90 Days",
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
      className="group rounded-2xl border border-neutral-200/60 bg-white p-4 shadow-sm transition-all hover:shadow-md dark:border-neutral-800/60 dark:bg-neutral-950"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-neutral-100 dark:bg-neutral-800">
            <Icon className="h-4 w-4 text-neutral-600 dark:text-neutral-400" />
          </div>
          <div className="min-w-0">
            <h4 className="text-sm font-semibold text-neutral-900 dark:text-neutral-50 truncate">{challenge.title}</h4>
            {challenge.description && <p className="text-xs text-neutral-400 truncate">{challenge.description}</p>}
            <p className="text-[10px] text-neutral-400 mt-0.5">
              {format(new Date(challenge.startDate), "MMM d")} → {format(new Date(challenge.endDate), "MMM d, yyyy")}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button onClick={() => onEdit(challenge)} className="flex h-7 w-7 items-center justify-center rounded-lg text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-800 dark:hover:text-neutral-300 transition-colors">
            <Edit3 className="h-3.5 w-3.5" />
          </button>
          <button onClick={() => deleteChallenge(challenge.id)} className="flex h-7 w-7 items-center justify-center rounded-lg text-neutral-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
          {allDone && (
            <Button size="sm" className="h-7 gap-1 text-xs rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => deleteChallenge(challenge.id)}>
              <Check className="h-3.5 w-3.5" />Done
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="rounded-lg bg-neutral-50 p-2 text-center dark:bg-neutral-900">
          <p className="text-lg font-bold text-neutral-900 dark:text-neutral-50">{completed}</p>
          <p className="text-[10px] text-neutral-400">Done</p>
        </div>
        <div className="rounded-lg bg-neutral-50 p-2 text-center dark:bg-neutral-900">
          <p className="text-lg font-bold text-neutral-900 dark:text-neutral-50">{remaining}</p>
          <p className="text-[10px] text-neutral-400">Left</p>
        </div>
        <div className="rounded-lg bg-neutral-50 p-2 text-center dark:bg-neutral-900">
          <p className="text-lg font-bold text-neutral-900 dark:text-neutral-50">{progress}%</p>
          <p className="text-[10px] text-neutral-400">Progress</p>
        </div>
      </div>

      <Progress value={progress} className="h-1.5 mb-3" />

      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] font-medium text-neutral-400 uppercase">{typeLabel[challenge.type]}</span>
        <button
          onClick={() => {
            const todayDay = challenge.days.find((d) => d.date === format(new Date(), "yyyy-MM-dd"))
            if (todayDay) toggleDay(challenge.id, todayDay.day)
          }}
          className={cn(
            "flex items-center justify-center rounded-lg border text-xs font-medium transition-all h-7 px-2 gap-1",
            challenge.days.some((d) => d.date === format(new Date(), "yyyy-MM-dd") && d.completed)
              ? "bg-emerald-50 border-emerald-300 text-emerald-700 dark:bg-emerald-950/30 dark:border-emerald-600 dark:text-emerald-400"
              : "bg-white border-neutral-200 text-neutral-500 hover:border-neutral-400 dark:bg-neutral-950 dark:border-neutral-700 dark:hover:border-neutral-500"
          )}
        >
          {challenge.days.some((d) => d.date === format(new Date(), "yyyy-MM-dd") && d.completed) ? (
            <Check className="h-3 w-3" strokeWidth={3} />
          ) : (
            <span className="h-3 w-3 rounded-sm border border-current" />
          )}
          Today
        </button>
      </div>

      <ChallengeDayGrid challenge={challenge} toggleDay={toggleDay} />
    </motion.div>
  )
}

function ChallengeDayGrid({ challenge, toggleDay }: { challenge: Challenge; toggleDay: (id: string, day: number) => void }) {
  const total = challenge.days.length
  const cols = total === 21 ? 7 : 10
  const todayDate = format(new Date(), "yyyy-MM-dd")

  return (
    <div className="max-h-48 overflow-y-auto pr-1">
      <div className={cn("grid gap-1.5", cols === 7 ? "grid-cols-7" : "grid-cols-10")}>
        {challenge.days.map((d) => {
          const isToday = d.date === todayDate
          return (
            <button
              key={d.day}
              onClick={() => toggleDay(challenge.id, d.day)}
              className={cn(
                "flex items-center justify-center rounded-lg border-2 font-semibold text-xs transition-all relative",
                total === 21 ? "h-[34px]" : "h-[30px]",
                d.completed
                  ? "bg-neutral-900 border-neutral-900 text-white dark:bg-neutral-50 dark:border-neutral-50 dark:text-neutral-900"
                  : "bg-neutral-50 border-neutral-200 text-neutral-400 hover:border-neutral-900/30 dark:bg-neutral-900 dark:border-neutral-700 dark:hover:border-neutral-50/30",
                isToday && !d.completed && "ring-2 ring-amber-400 ring-offset-1 dark:ring-offset-neutral-950"
              )}
              title={`Day ${d.day} - ${d.date}${isToday ? " (Today)" : ""}`}
            >
              {d.completed ? <Check className={cn(total === 21 ? "h-4 w-4" : "h-3.5 w-3.5")} strokeWidth={3} /> : <span>{d.day}</span>}
              {isToday && !d.completed && (
                <span className="absolute -top-1 -right-1 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function ChallengeListItem({ challenge, onEdit }: { challenge: Challenge; onEdit: (c: Challenge) => void }) {
  const { toggleDay, getProgress, deleteChallenge } = useChallengeStore()
  const progress = getProgress(challenge.id)
  const completed = challenge.days.filter((d) => d.completed).length
  const allDone = completed === challenge.days.length
  const Icon = typeIcon[challenge.type]
  const todayDate = format(new Date(), "yyyy-MM-dd")

  return (
    <motion.div layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-neutral-200/60 bg-white p-3 shadow-sm transition-all hover:shadow-md dark:border-neutral-800/60 dark:bg-neutral-950"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-neutral-100 dark:bg-neutral-800">
          <Icon className="h-4 w-4 text-neutral-600 dark:text-neutral-400" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-semibold text-neutral-900 dark:text-neutral-50 truncate">{challenge.title}</h4>
            <span className="text-[10px] font-medium text-neutral-400 shrink-0">{typeLabel[challenge.type]}</span>
          </div>
          <p className="text-[11px] text-neutral-400 truncate">
            {completed}/{challenge.days.length} · {progress}%
            {challenge.description && ` · ${challenge.description}`}
          </p>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto max-w-[80px] sm:max-w-[200px]">
          {challenge.days.filter((d) => d.day <= 14 || d.day > challenge.days.length - 7).map((d) => {
            const isToday = d.date === todayDate
            return (
              <button
                key={d.day}
                onClick={() => toggleDay(challenge.id, d.day)}
                className={cn(
                  "flex items-center justify-center rounded border transition-all shrink-0",
                  "h-6 w-6 text-[10px] font-medium",
                  d.completed
                    ? "bg-neutral-900 border-neutral-900 text-white dark:bg-neutral-50 dark:border-neutral-50 dark:text-neutral-900"
                    : "bg-neutral-50 border-neutral-200 text-neutral-400 hover:border-neutral-400 dark:bg-neutral-900 dark:border-neutral-700 dark:hover:border-neutral-500",
                  isToday && !d.completed && "ring-2 ring-amber-400 ring-offset-1 dark:ring-offset-neutral-950"
                )}
              >
                {d.completed ? <Check className="h-3 w-3" strokeWidth={3} /> : d.day}
              </button>
            )
          })}
          {challenge.days.length > 21 && (
            <span className="text-[10px] text-neutral-400 shrink-0">...</span>
          )}
        </div>

        <button
          onClick={() => {
            const todayDay = challenge.days.find((d) => d.date === todayDate)
            if (todayDay) toggleDay(challenge.id, todayDay.day)
          }}
          className={cn(
            "flex items-center justify-center rounded-lg border text-[10px] font-medium transition-all h-7 px-1.5 gap-0.5 shrink-0",
            challenge.days.some((d) => d.date === todayDate && d.completed)
              ? "bg-emerald-50 border-emerald-300 text-emerald-700 dark:bg-emerald-950/30 dark:border-emerald-600 dark:text-emerald-400"
              : "bg-white border-neutral-200 text-neutral-500 hover:border-neutral-400 dark:bg-neutral-950 dark:border-neutral-700 dark:hover:border-neutral-500"
          )}
        >
          {challenge.days.some((d) => d.date === todayDate && d.completed) ? (
            <Check className="h-3 w-3" strokeWidth={3} />
          ) : (
            <span className="h-3 w-3 rounded-sm border border-current" />
          )}
          Today
        </button>

        <div className="flex gap-0.5 shrink-0">
          <button onClick={() => onEdit(challenge)} className="flex h-7 w-7 items-center justify-center rounded-lg text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-800 dark:hover:text-neutral-300">
            <Edit3 className="h-3.5 w-3.5" />
          </button>
          {allDone ? (
            <Button size="sm" className="h-7 gap-1 text-xs rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => deleteChallenge(challenge.id)}>
              <Check className="h-3 w-3" />Done
            </Button>
          ) : (
            <button onClick={() => deleteChallenge(challenge.id)} className="flex h-7 w-7 items-center justify-center rounded-lg text-neutral-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
    </motion.div>
  )
}

export function ChallengeSliderPanel() {
  const { challenges, viewMode, setViewMode, isCreateModalOpen, setIsCreateModalOpen, addChallenge, updateChallenge } = useChallengeStore()
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
    updateChallenge(editing.id, { title: editTitle.trim(), description: editDesc.trim(), type: editType, startDate: editStart, endDate: editEnd })
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
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-neutral-200 p-0.5 dark:border-neutral-700">
            <button
              onClick={() => setViewMode("card")}
              className={cn("rounded-md p-1.5 transition-colors", viewMode === "card" ? "bg-neutral-100 text-neutral-900 dark:bg-neutral-700 dark:text-neutral-50" : "text-neutral-400 hover:text-neutral-600")}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={cn("rounded-md p-1.5 transition-colors", viewMode === "list" ? "bg-neutral-100 text-neutral-900 dark:bg-neutral-700 dark:text-neutral-50" : "text-neutral-400 hover:text-neutral-600")}
            >
              <List className="h-3.5 w-3.5" />
            </button>
          </div>
          <Button onClick={() => setIsCreateModalOpen(true)} className="gap-1.5 rounded-xl text-xs h-9 sm:h-8 px-3 sm:px-2.5">
            <Plus className="h-4 w-4 sm:h-3.5 sm:w-3.5" />New Challenge
          </Button>
        </div>
      </div>

      {challenges.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-neutral-200 p-12 text-center text-sm text-neutral-400 dark:border-neutral-700">
          No challenges yet
        </div>
      ) : viewMode === "card" ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {challenges.map((c) => <ChallengeCard key={c.id} challenge={c} onEdit={openEdit} />)}
        </div>
      ) : (
        <div className="space-y-2">
          {challenges.map((c) => <ChallengeListItem key={c.id} challenge={c} onEdit={openEdit} />)}
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
                {(["21", "30", "90"] as ChallengeType[]).map((t) => (
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
          <DialogDescription>Start a 21, 30, or 90 day challenge.</DialogDescription>
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
              {(["21", "30", "90"] as ChallengeType[]).map((t) => (
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