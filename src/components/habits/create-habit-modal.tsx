"use client"

import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { useHabitStore } from "@/store/use-habit-store"
import { useState } from "react"
import type { HabitCategory } from "@/types"

const categoryLabels: Record<HabitCategory, string> = {
  health: "Health", fitness: "Fitness", mindfulness: "Mindfulness",
  learning: "Learning", productivity: "Productivity", creative: "Creative", social: "Social",
}

export function CreateHabitModal() {
  const { isCreateModalOpen, setIsCreateModalOpen, addHabit } = useHabitStore()
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [category, setCategory] = useState<HabitCategory>("health")
  const [frequency, setFrequency] = useState<"daily" | "weekly">("daily")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    addHabit({
      name: name.trim(),
      description: description.trim(),
      category,
      icon: "heart",
      frequency,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
    })
    setName("")
    setDescription("")
    setCategory("health")
    setFrequency("daily")
    setStartDate("")
    setEndDate("")
    setIsCreateModalOpen(false)
  }

  return (
    <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl">New Habit</DialogTitle>
          <DialogDescription>Create a new habit to track daily.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="habit-name">Name</Label>
            <Input id="habit-name" placeholder="e.g. Morning Meditation" value={name} onChange={(e) => setName(e.target.value)} autoFocus required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="habit-description">Description</Label>
            <Textarea id="habit-description" placeholder="Add a description..." value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="habit-category">Category</Label>
            <Select value={category} onValueChange={(v) => setCategory(v as HabitCategory)}>
              <SelectTrigger id="habit-category"><SelectValue /></SelectTrigger>
              <SelectContent>
                {(Object.entries(categoryLabels) as [HabitCategory, string][]).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="habit-start">Start Date</Label>
              <Input id="habit-start" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="habit-end">End Date</Label>
              <Input id="habit-end" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={!name.trim()}>Create</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
