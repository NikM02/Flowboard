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

export function CompleteTaskDialog() {
  const { tasks, completePendingId, confirmComplete, cancelComplete } = useTaskStore()
  const task = tasks.find((t) => t.id === completePendingId)

  return (
    <Dialog open={!!completePendingId} onOpenChange={(open) => { if (!open) cancelComplete() }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl">Mark as done?</DialogTitle>
          <DialogDescription className="text-sm">
            Moving{" "}
            <span className="font-medium text-neutral-900 dark:text-neutral-50">
              {task?.title}
            </span>{" "}
            to the Archive. You can reopen it from the Archive anytime.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={cancelComplete}
          >
            Cancel
          </Button>
          <Button
            onClick={confirmComplete}
            className="gap-2"
          >
            Mark as done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
