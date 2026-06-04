"use client"

import { ListTodo, CheckCircle2, Circle, Plus } from "lucide-react"
import { useTaskStore } from "@/store/use-task-store"
import { cn } from "@/lib/shadcn-utils"
import type { DashboardSection } from "@/types"

export function BottomNav({ onSectionChange }: { onSectionChange?: (s: DashboardSection) => void }) {
  const { filterStatus, setFilterStatus, setIsCreateModalOpen } = useTaskStore()

  const handleClick = (id: typeof filterStatus) => {
    setFilterStatus(id)
    onSectionChange?.("tasks")
  }

  const items = [
    { id: "all" as const, icon: ListTodo, label: "All" },
    { id: "active" as const, icon: Circle, label: "Active" },
    { id: "completed" as const, icon: CheckCircle2, label: "Done" },
  ] as const

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-neutral-200/60 bg-white/80 backdrop-blur-xl md:hidden dark:border-neutral-800/60 dark:bg-neutral-950/80">
      <div className="flex items-center justify-around px-2 py-1">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => handleClick(item.id)}
            className={cn(
              "flex flex-col items-center gap-0.5 rounded-xl px-4 py-2 text-xs font-medium transition-colors",
              filterStatus === item.id
                ? "text-neutral-900 dark:text-neutral-50"
                : "text-neutral-400 dark:text-neutral-500"
            )}
          >
            <item.icon className="h-5 w-5" />
            {item.label}
          </button>
        ))}
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
