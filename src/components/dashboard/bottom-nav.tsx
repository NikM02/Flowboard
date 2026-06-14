"use client"

import { ListTodo, Plus } from "lucide-react"
import { useTaskStore } from "@/store/use-task-store"
import { cn } from "@/lib/shadcn-utils"
import type { DashboardSection } from "@/types"

export function BottomNav({ onSectionChange }: { onSectionChange?: (s: DashboardSection) => void }) {
  const { setIsCreateModalOpen } = useTaskStore()

  const handleTasks = () => {
    onSectionChange?.("tasks")
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-neutral-200/60 bg-white/80 backdrop-blur-xl md:hidden dark:border-neutral-800/60 dark:bg-neutral-950/80">
      <div className="flex items-center justify-around px-4 py-2">
        <button
          onClick={handleTasks}
          className="flex flex-col items-center gap-0.5 rounded-xl px-6 py-2 text-xs font-medium text-neutral-600 dark:text-neutral-400"
        >
          <ListTodo className="h-5 w-5" />
          Tasks
        </button>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex flex-col items-center gap-0.5 rounded-xl bg-neutral-900 px-6 py-2 text-xs font-medium text-white dark:bg-neutral-50 dark:text-neutral-900"
        >
          <Plus className="h-5 w-5" />
          Add
        </button>
      </div>
    </nav>
  )
}
