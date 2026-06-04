"use client"

import { AnimatePresence } from "framer-motion"
import { TaskCard } from "./task-card"
import { useTaskStore } from "@/store/use-task-store"
import { EmptyState } from "./empty-state"

export function TaskCardView() {
  const { getFilteredTasks } = useTaskStore()
  const tasks = getFilteredTasks()

  if (tasks.length === 0) {
    return <EmptyState />
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      <AnimatePresence mode="popLayout">
        {tasks.map((task, index) => (
          <TaskCard key={task.id} task={task} index={index} />
        ))}
      </AnimatePresence>
    </div>
  )
}
