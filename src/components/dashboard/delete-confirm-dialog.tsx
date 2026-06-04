"use client"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useTaskStore } from "@/store/use-task-store"

export function DeleteConfirmDialog() {
  const { selectedTask, isDeleteDialogOpen, setIsDeleteDialogOpen, deleteTask } = useTaskStore()

  const handleDelete = () => {
    if (selectedTask) {
      deleteTask(selectedTask.id)
      setIsDeleteDialogOpen(false)
    }
  }

  return (
    <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl">Delete Task</DialogTitle>
          <DialogDescription className="text-sm">
            Are you sure you want to delete{" "}
            <span className="font-medium text-neutral-900 dark:text-neutral-50">
              {selectedTask?.title}
            </span>
            ? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => setIsDeleteDialogOpen(false)}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
          >
            Delete Task
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
