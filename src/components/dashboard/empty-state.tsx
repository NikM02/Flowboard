"use client"

import { motion } from "framer-motion"
import { ClipboardList, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTaskStore } from "@/store/use-task-store"

export function EmptyState({ archive }: { archive?: boolean }) {
  const { setIsCreateModalOpen } = useTaskStore()

  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-neutral-200 py-20 dark:border-neutral-800">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", damping: 15 }}
        className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-neutral-100 dark:bg-neutral-800"
      >
        <ClipboardList className="h-8 w-8 text-neutral-400 dark:text-neutral-500" />
      </motion.div>
      <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-50">
        {archive ? "No completed tasks" : "No tasks yet"}
      </h3>
      <p className="mt-1 max-w-xs text-center text-sm text-neutral-500 dark:text-neutral-400">
        {archive ? "Complete a task and it will appear here." : "Create your first task to get started."}
      </p>
      {!archive && (
        <Button onClick={() => setIsCreateModalOpen(true)} className="mt-5 gap-2 rounded-xl">
          <Plus className="h-4 w-4" /> Create task
        </Button>
      )}
    </div>
  )
}
