"use client"

import { motion } from "framer-motion"
import { ClipboardList, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTaskStore } from "@/store/use-task-store"

export function EmptyState() {
  const { setIsCreateModalOpen } = useTaskStore()

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col items-center justify-center py-20"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: "spring", damping: 15 }}
        className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-neutral-100 dark:bg-neutral-800"
      >
        <ClipboardList className="h-10 w-10 text-neutral-400 dark:text-neutral-500" />
      </motion.div>
      <h3 className="mb-2 text-xl font-semibold text-neutral-900 dark:text-neutral-50">
        No tasks yet
      </h3>
      <p className="mb-8 max-w-sm text-center text-sm text-neutral-500 dark:text-neutral-400">
        Create your first task and start organizing your work.
      </p>
      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
        <Button
          onClick={() => setIsCreateModalOpen(true)}
          className="gap-2 rounded-xl px-6 py-2.5 text-sm shadow-lg shadow-neutral-200/50 dark:shadow-neutral-950/50"
        >
          <Plus className="h-4 w-4" />
          Create your first task
        </Button>
      </motion.div>
    </motion.div>
  )
}
