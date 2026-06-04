"use client"

import { LayoutGrid, List, ArrowUpDown } from "lucide-react"
import { Button } from "@/components/ui/button"
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
  const { viewMode, setViewMode, sortBy, setSortBy } = useTaskStore()

  return (
    <div className="flex items-center gap-2">
      <div className="flex overflow-hidden rounded-xl border border-neutral-200/60 bg-white p-0.5 dark:border-neutral-800/60 dark:bg-neutral-950">
        <Button
          variant={viewMode === "card" ? "secondary" : "ghost"}
          size="sm"
          onClick={() => setViewMode("card")}
          className="rounded-lg px-2.5"
        >
          <LayoutGrid className="h-4 w-4" />
        </Button>
        <Button
          variant={viewMode === "list" ? "secondary" : "ghost"}
          size="sm"
          onClick={() => setViewMode("list")}
          className="rounded-lg px-2.5"
        >
          <List className="h-4 w-4" />
        </Button>
      </div>

      <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
        <SelectTrigger aria-label="Sort tasks" className="h-9 w-[140px] gap-1.5 border-neutral-200/60 bg-white text-sm dark:border-neutral-800/60 dark:bg-neutral-950">
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
