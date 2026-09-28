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
import type { Priority } from "@/types"
import { generateId } from "@/lib/utils"

export function CreateTaskModal() {
  const { isCreateModalOpen, setIsCreateModalOpen, addTask, getProjects, createPriority } = useTaskStore()
  const projects = getProjects()
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [project, setProject] = useState("")
  const [priority, setPriority] = useState<Priority>("medium")
  const [storyPoints, setStoryPoints] = useState("")
  const [dueDate, setDueDate] = useState("")
  const [dueTime, setDueTime] = useState("")
  const [subtasks, setSubtasks] = useState<{ id: string; title: string }[]>([])

  useEffect(() => {
    if (!isCreateModalOpen) return
    setTitle("")
    setDescription("")
    setProject("")
    setPriority(createPriority)
    setStoryPoints("")
    setDueDate(new Date().toISOString().slice(0, 10))
    setDueTime("")
    setSubtasks([])
  }, [isCreateModalOpen, createPriority])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    const finalDueDate = dueDate || new Date().toISOString().slice(0, 10)

    addTask({
      title: title.trim(),
      description: description.trim(),
      project: project.trim() || "Uncategorized",
      priority,
      storyPoints: storyPoints.trim() ? Math.max(0, Math.min(100, parseInt(storyPoints.trim(), 10) || 0)) : undefined,
      dueDate: finalDueDate,
      dueTime: dueTime || undefined,
      reminder: null,
      subtasks: subtasks.map((s) => ({ id: s.id, title: s.title, completed: false })),
    })

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

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
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
              <Label htmlFor="task-points">Story Points</Label>
              <Input
                id="task-points"
                type="number"
                min={0}
                max={100}
                placeholder="e.g. 5"
                value={storyPoints}
                onChange={(e) => setStoryPoints(e.target.value)}
              />
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
                onChange={(e) => setDueTime(e.target.value)}
              />
            </div>
           </div>

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
