"use client"

import { ArrowUpDown } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useTaskStore } from "@/store/use-task-store"
import type { SortOption } from "@/types"

export function Filters() {
  const { sortBy, setSortBy } = useTaskStore()

  return (
    <div className="flex items-center gap-2">
      <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
        <SelectTrigger aria-label="Sort tasks" className="h-9 w-[110px] sm:w-[140px] gap-1 border-neutral-200/60 bg-white text-xs sm:text-sm dark:border-neutral-800/60 dark:bg-neutral-950">
          <ArrowUpDown className="h-3.5 w-3.5 text-neutral-500" />
          <SelectValue placeholder="Sort by" />
        </SelectTrigger>
        <SelectContent align="end">
          <SelectItem value="createdAt">Recently Added</SelectItem>
          <SelectItem value="dueDate">Due Date</SelectItem>
          <SelectItem value="progress">Progress</SelectItem>
          <SelectItem value="priority">Priority</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}
