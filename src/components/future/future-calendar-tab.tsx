"use client"

import { useState, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  ChevronLeft, ChevronRight,
} from "lucide-react"
import { cn } from "@/lib/shadcn-utils"
import {
  format, startOfWeek, startOfMonth, endOfMonth, endOfWeek,
  eachDayOfInterval, addMonths, subMonths, isToday, isSameMonth,
} from "date-fns"
import { useTaskStore } from "@/store/use-task-store"
import type { Task } from "@/types"

const priorityColors: Record<string, string> = {
  high: "bg-red-500",
  medium: "bg-amber-500",
  low: "bg-blue-500",
}

export function CalendarTab() {
  const [baseDate, setBaseDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const { tasks } = useTaskStore()

  const activeTasks = useMemo(() => tasks.filter((t) => !t.completed), [tasks])
  const tasksByDate = useMemo(() => {
    const map = new Map<string, Task[]>()
    for (const task of activeTasks) {
      if (!task.dueDate) continue
      const existing = map.get(task.dueDate) || []
      existing.push(task)
      map.set(task.dueDate, existing)
    }
    return map
  }, [activeTasks])

  const monthStart = startOfMonth(baseDate)
  const monthEnd = endOfMonth(baseDate)
  const calStart = startOfWeek(monthStart, { weekStartsOn: 0 })
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 0 })
  const allDays = eachDayOfInterval({ start: calStart, end: calEnd })

  const weeks = []
  for (let i = 0; i < allDays.length; i += 7) {
    weeks.push(allDays.slice(i, i + 7))
  }

  const navigatePrev = () => setBaseDate((d) => subMonths(d, 1))
  const navigateNext = () => setBaseDate((d) => addMonths(d, 1))
  const goToToday = () => { setBaseDate(new Date()); setSelectedDate(null) }

  const selectedTasks = selectedDate ? tasksByDate.get(selectedDate) || [] : []

  return (
    <div className="space-y-3">
      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button onClick={goToToday} className="text-xs font-medium text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 px-2 py-1">
          Today
        </button>
        <div className="flex items-center gap-1">
          <button onClick={navigatePrev} className="rounded-lg p-1.5 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-800">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <h2 className="min-w-[150px] text-center text-sm sm:text-base font-semibold text-neutral-900 dark:text-neutral-50 select-none">
            {format(baseDate, "MMMM yyyy")}
          </h2>
          <button onClick={navigateNext} className="rounded-lg p-1.5 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-800">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Calendar grid */}
      <AnimatePresence mode="wait">
        <motion.div
          key={baseDate.toISOString().slice(0, 7)}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.15 }}
          className="rounded-xl border border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-800/50 overflow-hidden"
        >
          {/* Day headers */}
          <div className="grid grid-cols-7 border-b border-neutral-200 dark:border-neutral-700">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <div key={d} className="py-1.5 sm:py-2 text-center text-[10px] sm:text-xs font-medium text-neutral-400">
                <span className="hidden sm:inline">{d}</span>
                <span className="sm:hidden">{d[0]}</span>
              </div>
            ))}
          </div>
          {/* Day cells */}
          {weeks.map((week, wi) => (
            <div key={wi} className="grid grid-cols-7 border-b border-neutral-100 dark:border-neutral-700/50 last:border-b-0">
              {week.map((d) => {
                const isCurrentMonth = isSameMonth(d, baseDate)
                const isTodayDate = isToday(d)
                const dateKey = format(d, "yyyy-MM-dd")
                const dayTasks = tasksByDate.get(dateKey) || []
                const isSelected = selectedDate === dateKey
                return (
                  <button
                    key={d.toISOString()}
                    onClick={() => setSelectedDate(isSelected ? null : dateKey)}
                    className={cn(
                      "flex flex-col items-start p-0.5 sm:p-1 text-sm transition-colors relative min-h-[52px] sm:min-h-[72px]",
                      isSelected && "bg-neutral-100 dark:bg-neutral-700/50",
                      isTodayDate
                        ? "text-neutral-900 dark:text-neutral-50"
                        : isCurrentMonth
                          ? "text-neutral-700 dark:text-neutral-300"
                          : "text-neutral-300 dark:text-neutral-600"
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-5 w-5 sm:h-6 sm:w-6 items-center justify-center rounded-full text-[10px] sm:text-xs font-medium mx-auto",
                        isTodayDate && "bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900"
                      )}
                    >
                      {format(d, "d")}
                    </span>
                    <div className="w-full px-0.5 space-y-[1px] mt-0.5">
                      {dayTasks.slice(0, 2).map((task) => (
                        <div
                          key={task.id}
                          title={task.title}
                          className="text-[7px] sm:text-[9px] leading-tight truncate text-neutral-600 dark:text-neutral-400 border-l-2 pl-1"
                          style={{ borderLeftColor: task.priority === "high" ? "#ef4444" : task.priority === "medium" ? "#f59e0b" : "#3b82f6" }}
                        >
                          {task.title}
                        </div>
                      ))}
                      {dayTasks.length > 2 && (
                        <div className="text-[7px] sm:text-[9px] text-neutral-400 font-medium pl-1">
                          +{dayTasks.length - 2} more
                        </div>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          ))}
        </motion.div>
      </AnimatePresence>

      {/* Selected day detail */}
      {selectedDate && selectedTasks.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-neutral-200 bg-white p-3 sm:p-4 dark:border-neutral-700 dark:bg-neutral-800/50 space-y-2"
        >
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">
            Tasks due {format(new Date(selectedDate + "T00:00:00"), "MMM d, yyyy")}
          </h3>
          <div className="space-y-1">
            {selectedTasks.map((task) => (
              <div
                key={task.id}
                className="flex items-center gap-2 rounded-lg border border-neutral-100 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/30 px-2.5 py-2"
              >
                <span className={cn("h-2 w-2 rounded-full shrink-0", priorityColors[task.priority])} />
                <span className="flex-1 text-xs sm:text-sm text-neutral-700 dark:text-neutral-300 truncate">
                  {task.title}
                </span>
                <span className={cn(
                  "text-[10px] font-medium px-1.5 py-0.5 rounded",
                  task.priority === "high" ? "text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-950/30" :
                  task.priority === "medium" ? "text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-950/30" :
                  "text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-950/30"
                )}>
                  {task.priority}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  )
}
