"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Plus, X, Circle } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useTaskStore } from "@/store/use-task-store"
import { useRoutineStore } from "@/store/use-routine-store"
import type { Priority } from "@/types"
import { generateId } from "@/lib/utils"
import { cn } from "@/lib/shadcn-utils"

const toHours = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number)
  return h + m / 60
}

export function CreateTaskModal() {
  const { isCreateModalOpen, setIsCreateModalOpen, addTask, getProjects } = useTaskStore()
  const projects = getProjects()
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [project, setProject] = useState("")
  const [priority, setPriority] = useState<Priority>("medium")
  const [dueDate, setDueDate] = useState("")
  const [dueTime, setDueTime] = useState("")
  const [addToCalendar, setAddToCalendar] = useState(false)
  const [startTime, setStartTime] = useState("09:00")
  const [endTime, setEndTime] = useState("10:00")
  const [subtasks, setSubtasks] = useState<{ id: string; title: string }[]>([])

  useEffect(() => {
    if (!isCreateModalOpen) return
    setTitle("")
    setDescription("")
    setProject("")
    setPriority("medium")
    setDueDate("")
    setDueTime("")
    setAddToCalendar(false)
    setStartTime("09:00")
    setEndTime("10:00")
    setSubtasks([])
  }, [isCreateModalOpen])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    const finalDueDate = dueDate || new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0]

    const taskId = addTask({
      title: title.trim(),
      description: description.trim(),
      project: project.trim() || "Uncategorized",
      priority,
      dueDate: finalDueDate,
      dueTime: dueTime || undefined,
      reminder: null,
      subtasks: subtasks.map((s) => ({ id: s.id, title: s.title, completed: false })),
    })

    if (addToCalendar) {
      const start = toHours(startTime)
      const end = Math.max(toHours(endTime), start + 0.5)
      useRoutineStore.getState().addEvent({
        date: finalDueDate,
        title: title.trim(),
        taskId,
        category: "Task",
        startHour: start,
        endHour: end,
      })
    }

    setIsCreateModalOpen(false)
  }

  const addSubtaskField = () => {
    setSubtasks([...subtasks, { id: generateId(), title: "" }])
  }

  const removeSubtaskField = (id: string) => {
    setSubtasks(subtasks.filter((s) => s.id !== id))
  }

  const updateSubtaskField = (id: string, value: string) => {
    setSubtasks(subtasks.map((s) => (s.id === id ? { ...s, title: value } : s)))
  }

  return (
    <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl">Create Task</DialogTitle>
          <DialogDescription>
            Add a new task to your dashboard.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              placeholder="Enter task title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Add a description..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="project">Project</Label>
            <Input
              id="project"
              placeholder="Enter project name..."
              value={project}
              onChange={(e) => setProject(e.target.value)}
              list="project-suggestions"
            />
            <datalist id="project-suggestions">
              {projects.map((p) => (
                <option key={p} value={p} />
              ))}
            </datalist>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="task-priority">Priority</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as Priority)}>
                <SelectTrigger id="task-priority">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="dueDate">Due Date</Label>
              <Input
                id="dueDate"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dueTime">Due Time</Label>
              <Input
                id="dueTime"
                type="time"
                step={900}
                value={dueTime}
                onChange={(e) => {
                  setDueTime(e.target.value)
                  if (e.target.value) {
                    const [h, m] = e.target.value.split(":").map(Number)
                    const startH = `${String(h).padStart(2, "0")}:${m >= 30 ? "30" : "00"}`
                    setStartTime(startH)
                    const endTotal = Math.min(h * 60 + (m >= 30 ? 90 : 60), 23 * 60 + 59)
                    setEndTime(`${String(Math.floor(endTotal / 60)).padStart(2, "0")}:${String(endTotal % 60).padStart(2, "0")}`)
                  }
                }}
              />
            </div>
          </div>

          <button
            type="button"
            onClick={() => setAddToCalendar(!addToCalendar)}
            className="flex w-full items-center justify-between rounded-[10px] border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-left transition-colors hover:bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:bg-neutral-800"
          >
            <div>
              <p className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">Show on routine calendar</p>
              <p className="text-[10px] text-neutral-500">Reserve a time slab on the Routine page</p>
            </div>
            <span className={cn("relative h-5 w-9 rounded-full transition-colors", addToCalendar ? "bg-neutral-900 dark:bg-white" : "bg-neutral-300 dark:bg-neutral-700")}>
              <span className={cn("absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all dark:bg-neutral-950", addToCalendar ? "left-[18px]" : "left-0.5")} />
            </span>
          </button>

          {addToCalendar && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cal-start">From</Label>
                <Input
                  id="cal-start"
                  type="time"
                  step={1800}
                  value={startTime}
                  onChange={(e) => {
                    setStartTime(e.target.value)
                    if (e.target.value && toHours(e.target.value) >= toHours(endTime)) {
                      const [h, m] = e.target.value.split(":").map(Number)
                      const total = Math.min(h * 60 + m + 60, 23 * 60 + 59)
                      setEndTime(`${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`)
                    }
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cal-end">To</Label>
                <Input
                  id="cal-end"
                  type="time"
                  step={1800}
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                />
              </div>
            </div>
          )}

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Subtasks</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={addSubtaskField}
                className="gap-1 text-xs"
              >
                <Plus className="h-3 w-3" />
                Add Subtask
              </Button>
            </div>

            <div className="space-y-2">
              {subtasks.map((sub, i) => (
                <motion.div
                  key={sub.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-2"
                >
                  <Circle className="h-4 w-4 shrink-0 text-neutral-300 dark:text-neutral-600" />
                  <Input
                    aria-label="New subtask"
                    placeholder={`Subtask ${i + 1}...`}
                    value={sub.title}
                    onChange={(e) => updateSubtaskField(sub.id, e.target.value)}
                    className="h-9 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => removeSubtaskField(sub.id)}
                    className="shrink-0 rounded-lg p-1 text-neutral-400 hover:text-red-500"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </motion.div>
              ))}
              {subtasks.length === 0 && (
                <p className="text-xs text-neutral-400">
                  No subtasks yet. Click &quot;Add Subtask&quot; to create one.
                </p>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsCreateModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!title.trim()}>
              Create Task
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
