"use client"

import { useState } from "react"
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
  const { isCreateModalOpen, setIsCreateModalOpen, addTask } = useTaskStore()
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [priority, setPriority] = useState<Priority>("medium")
  const [dueDate, setDueDate] = useState("")
  const [subtasks, setSubtasks] = useState<{ id: string; title: string }[]>([])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    addTask({
      title: title.trim(),
      description: description.trim(),
      priority,
      dueDate: dueDate || new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0],
      subtasks: subtasks.map((s) => ({ id: s.id, title: s.title, completed: false })),
    })

    setTitle("")
    setDescription("")
    setPriority("medium")
    setDueDate("")
    setSubtasks([])
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

          <div className="grid grid-cols-2 gap-4">
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
