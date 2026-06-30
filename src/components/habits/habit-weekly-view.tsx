"use client"

import { useMemo } from "react"
import { Check } from "lucide-react"
import { cn } from "@/lib/shadcn-utils"
import { useHabitStore } from "@/store/use-habit-store"
import { format, startOfWeek, endOfWeek, eachDayOfInterval } from "date-fns"

import type { Habit } from "@/types"

export function HabitWeeklyView({ onEdit }: { onEdit?: (habit: Habit) => void }) {
  const { habits, toggleDay, setIsCreateModalOpen } = useHabitStore()

  const weekDays = useMemo(() => {
    const start = startOfWeek(new Date(), { weekStartsOn: 1 })
    const end = endOfWeek(new Date(), { weekStartsOn: 1 })
    return eachDayOfInterval({ start, end })
  }, [])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
          Week of {format(weekDays[0], "MMM d")} – {format(weekDays[6], "MMM d, yyyy")}
        </p>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="text-xs font-medium text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-50 transition-colors"
        >
          + New Habit
        </button>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-neutral-200/60 bg-white p-4 dark:border-neutral-800/60 dark:bg-neutral-950">
        <div className="grid grid-cols-[1fr_repeat(7,minmax(0,1fr))] gap-1 min-w-[320px]">
          <div className="text-[10px] font-semibold text-neutral-300 dark:text-neutral-600" />

          {weekDays.map((d) => (
            <div key={d.toISOString()} className="flex flex-col items-center py-2">
              <span className="text-[10px] font-semibold text-neutral-400 dark:text-neutral-500 uppercase">
                {format(d, "EEE")}
              </span>
              <span className="mt-1 flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-neutral-700 dark:text-neutral-300">
                {format(d, "d")}
              </span>
            </div>
          ))}

          {habits.map((habit) => {
            const allDoneThisWeek = weekDays.every((d) => {
              const ds = format(d, "yyyy-MM-dd")
              const r = habit.records.find((rec) => rec.date === ds)
              return r?.completed
            })

            return (
              <HabitWeekRow
                key={habit.id}
                habit={habit}
                weekDays={weekDays}
                allDoneThisWeek={allDoneThisWeek}
                toggleDay={toggleDay}
                onEdit={onEdit}
              />
            )
          })}
        </div>

        {habits.length === 0 && (
          <div className="flex items-center justify-center py-12 text-sm text-neutral-400">
            No habits yet — click + New Habit to start
          </div>
        )}
      </div>
    </div>
  )
}

function HabitWeekRow({
  habit, weekDays, allDoneThisWeek, toggleDay, onEdit,
}: {
  habit: Habit
  weekDays: Date[]
  allDoneThisWeek: boolean
  toggleDay: (habitId: string, date: string) => void
  onEdit?: (habit: Habit) => void
}) {
  return (
    <>
      <div className="flex items-center gap-2 px-2 py-1.5">
        <button
          onClick={() => onEdit?.(habit)}
          className={cn(
            "text-xs font-medium truncate text-left hover:underline",
            allDoneThisWeek
              ? "text-neutral-900 dark:text-neutral-50"
              : "text-neutral-600 dark:text-neutral-400"
          )}
        >
          {habit.name}
        </button>
        {allDoneThisWeek && <Check className="h-3 w-3 text-emerald-500 shrink-0" strokeWidth={3} />}
      </div>

      {weekDays.map((d) => {
        const dateStr = format(d, "yyyy-MM-dd")
        const record = habit.records.find((r) => r.date === dateStr)
        const isDone = record?.completed ?? false
        const isFuture = dateStr > format(new Date(), "yyyy-MM-dd")

        return (
          <div key={dateStr} className="flex items-center justify-center py-1">
            <button
              onClick={() => !isFuture && toggleDay(habit.id, dateStr)}
              disabled={isFuture}
              className={cn(
                "flex items-center justify-center rounded-lg border-2 transition-all",
                "h-9 w-9",
                isDone
                  ? "bg-neutral-900 border-neutral-900 text-white dark:bg-neutral-50 dark:border-neutral-50 dark:text-neutral-900"
                  : isFuture
                  ? "bg-neutral-50 border-neutral-100 text-neutral-200 cursor-default dark:bg-neutral-900 dark:border-neutral-800"
                  : "bg-white border-neutral-200 text-neutral-300 hover:border-neutral-400 hover:text-neutral-500 dark:bg-neutral-950 dark:border-neutral-700 dark:hover:border-neutral-500"
              )}
            >
              {isDone && <Check className="h-5 w-5" strokeWidth={3} />}
            </button>
          </div>
        )
      })}
    </>
  )
}
