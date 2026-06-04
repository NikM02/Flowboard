"use client"

import { useState } from "react"
import { List, Zap, Archive, Brain } from "lucide-react"
import { cn } from "@/lib/shadcn-utils"
import { HabitListView } from "./habit-list-view"
import { ChallengeSliderPanel } from "./challenge-slider-panel"
import { HabitArchiveView } from "./habit-archive-view"
import { DopaminePanel } from "./dopamine-panel"
import { CreateHabitModal } from "./create-habit-modal"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { useHabitStore } from "@/store/use-habit-store"
import type { Habit, HabitCategory } from "@/types"

const categoryLabels: Record<HabitCategory, string> = {
  health: "Health", fitness: "Fitness", mindfulness: "Mindfulness",
  learning: "Learning", productivity: "Productivity", creative: "Creative", social: "Social",
}

const tabs = [
  { key: "habits", label: "Habits", icon: List },
  { key: "challenges", label: "Challenges", icon: Zap },
  { key: "dopamine", label: "Dopamine", icon: Brain },
  { key: "archive", label: "Archive", icon: Archive },
] as const

type TabKey = (typeof tabs)[number]["key"]

export function HabitTrackerSection() {
  const { updateHabit } = useHabitStore()
  const [tab, setTab] = useState<TabKey>("habits")
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null)
  const [editName, setEditName] = useState("")
  const [editDesc, setEditDesc] = useState("")
  const [editCategory, setEditCategory] = useState<HabitCategory>("health")

  const openEdit = (habit: Habit) => {
    setEditingHabit(habit)
    setEditName(habit.name)
    setEditDesc(habit.description)
    setEditCategory(habit.category)
  }

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingHabit || !editName.trim()) return
    updateHabit(editingHabit.id, { name: editName.trim(), description: editDesc.trim(), category: editCategory })
    setEditingHabit(null)
  }

  return (
    <div className="space-y-5">
      <div className="flex gap-1.5 overflow-x-auto rounded-2xl bg-neutral-100/80 p-1.5 dark:bg-neutral-800/40">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium whitespace-nowrap transition-all shrink-0",
              tab === t.key
                ? "bg-white text-neutral-900 shadow-sm dark:bg-neutral-900 dark:text-neutral-50"
                : "text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
            )}
          >
            <t.icon className="h-4 w-4" />
            {t.label}
          </button>
        ))}
      </div>

      {tab === "habits" && <HabitListView onEdit={openEdit} />}

      {tab === "challenges" && <ChallengeSliderPanel />}

      {tab === "dopamine" && <DopaminePanel />}

      {tab === "archive" && <HabitArchiveView />}

      <CreateHabitModal />

      <Dialog open={!!editingHabit} onOpenChange={(o) => !o && setEditingHabit(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl">Edit Habit</DialogTitle>
            <DialogDescription>Update habit details.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="habit-name">Name</Label>
              <Input id="habit-name" value={editName} onChange={(e) => setEditName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="habit-description">Description</Label>
              <Textarea id="habit-description" value={editDesc} onChange={(e) => setEditDesc(e.target.value)} rows={2} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="habit-category">Category</Label>
                <Select value={editCategory} onValueChange={(v) => setEditCategory(v as HabitCategory)}>
                  <SelectTrigger id="habit-category"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(Object.entries(categoryLabels) as [HabitCategory, string][]).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => setEditingHabit(null)}>Cancel</Button>
              <Button type="submit">Save</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
