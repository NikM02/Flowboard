"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Plus, Circle, CheckCircle2 } from "lucide-react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
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
import { useMediaQuery } from "@/hooks/use-media-query"
import { cn } from "@/lib/shadcn-utils"
import type { Priority } from "@/types"

function EditTaskForm({ taskId, onClose }: { taskId: string; onClose: () => void }) {
  const task = useTaskStore((s) => s.tasks.find((t) => t.id === taskId))
  const { updateTask, toggleSubtask } = useTaskStore()

  const [title, setTitle] = useState(task?.title ?? "")
  const [description, setDescription] = useState(task?.description ?? "")
  const [priority, setPriority] = useState<Priority>(task?.priority ?? "medium")
  const [dueDate, setDueDate] = useState(task?.dueDate ?? "")
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("")

  if (!task) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    updateTask(task.id, {
      title: title.trim(),
      description: description.trim(),
      priority,
      dueDate,
    })

    onClose()
  }

  const handleAddSubtask = () => {
    if (!newSubtaskTitle.trim()) return
    useTaskStore.getState().addSubtask(task.id, newSubtaskTitle.trim())
    setNewSubtaskTitle("")
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="edit-title">Title</Label>
        <Input
          id="edit-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="edit-description">Description</Label>
        <Textarea
          id="edit-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="edit-task-priority">Priority</Label>
          <Select value={priority} onValueChange={(v) => setPriority(v as Priority)}>
            <SelectTrigger id="edit-task-priority">
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
          <Label htmlFor="edit-dueDate">Due Date</Label>
          <Input
            id="edit-dueDate"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-3">
        <Label>Subtasks</Label>
        <div className="space-y-2">
          <AnimatePresence>
            {task.subtasks.map((sub) => (
              <motion.div
                key={sub.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="flex items-center gap-2 rounded-lg bg-neutral-50 px-3 py-2 dark:bg-neutral-900"
              >
                <button type="button" onClick={() => toggleSubtask(task.id, sub.id)}>
                  {sub.completed ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <Circle className="h-4 w-4 text-neutral-300 dark:text-neutral-600" />
                  )}
                </button>
                <span
                  className={`flex-1 text-sm ${
                    sub.completed
                      ? "text-neutral-400 line-through"
                      : "text-neutral-700 dark:text-neutral-300"
                  }`}
                >
                  {sub.title}
                </span>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <div className="flex items-center gap-2">
          <Input
            aria-label="New subtask"
            placeholder="Add a subtask..."
            value={newSubtaskTitle}
            onChange={(e) => setNewSubtaskTitle(e.target.value)}
            className="h-9 text-sm"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault()
                handleAddSubtask()
              }
            }}
          />
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleAddSubtask}
            className="shrink-0"
            disabled={!newSubtaskTitle.trim()}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" disabled={!title.trim()}>
          Save Changes
        </Button>
      </div>
    </form>
  )
}

export function EditTaskSheet() {
  const isMobile = useMediaQuery("(max-width: 768px)")
  const { selectedTask, isEditSheetOpen, setIsEditSheetOpen } = useTaskStore()

  return (
    <Sheet open={isEditSheetOpen} onOpenChange={setIsEditSheetOpen}>
      <SheetContent side={isMobile ? "bottom" : "right"} className={cn("overflow-y-auto", isMobile ? "max-h-[85vh] rounded-t-2xl" : "sm:max-w-lg")}>
        <SheetHeader className="mb-6">
          <SheetTitle className="text-xl">Edit Task</SheetTitle>
          <SheetDescription>
            Update your task details.
          </SheetDescription>
        </SheetHeader>

        {selectedTask && (
          <EditTaskForm
            key={selectedTask.id}
            taskId={selectedTask.id}
            onClose={() => setIsEditSheetOpen(false)}
          />
        )}
      </SheetContent>
    </Sheet>
  )
}
