"use client"

import { useMemo } from "react"
import { Check, Plus, Edit3, Trash2 } from "lucide-react"
import { cn } from "@/lib/shadcn-utils"
import { useHabitStore } from "@/store/use-habit-store"
import { format, startOfWeek, endOfWeek, eachDayOfInterval } from "date-fns"
import type { Habit } from "@/types"

export function HabitListView({ onEdit }: { onEdit?: (habit: Habit) => void }) {
  const { habits, toggleDay, deleteHabit, setIsCreateModalOpen } = useHabitStore()

  const weekDays = useMemo(() => {
    const start = startOfWeek(new Date(), { weekStartsOn: 1 })
    const end = endOfWeek(new Date(), { weekStartsOn: 1 })
    return eachDayOfInterval({ start, end })
  }, [])

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
          Week of {format(weekDays[0], "MMM d")} – {format(weekDays[6], "MMM d, yyyy")}
        </p>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-1 text-xs font-medium text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-50 transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />New Habit
        </button>
      </div>

      {habits.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-neutral-200 p-12 text-center text-sm text-neutral-400 dark:border-neutral-700">
          No habits yet
        </div>
      ) : (
        <div className="space-y-2">
          {habits.map((habit) => (
            <HabitCard key={habit.id} habit={habit} weekDays={weekDays} onEdit={onEdit} toggleDay={toggleDay} deleteHabit={deleteHabit} />
          ))}
        </div>
      )}
    </div>
  )
}

function HabitCard({
  habit, weekDays, onEdit, toggleDay, deleteHabit,
}: {
  habit: Habit
  weekDays: Date[]
  onEdit?: (h: Habit) => void
  toggleDay: (id: string, date: string) => void
  deleteHabit: (id: string) => void
}) {
  const today = format(new Date(), "yyyy-MM-dd")
  const doneToday = habit.records.some((r) => r.date === today && r.completed)
  const weekDone = weekDays.filter((d) => {
    const ds = format(d, "yyyy-MM-dd")
    return habit.records.some((r) => r.date === ds && r.completed)
  }).length
  const allDone = weekDone === 7

  return (
    <div className="group rounded-2xl border border-neutral-200/60 bg-white p-4 shadow-sm transition-all hover:shadow-md dark:border-neutral-800/60 dark:bg-neutral-950">
      <div className="flex items-center gap-3">
        <button
          onClick={() => toggleDay(habit.id, today)}
          className={cn(
            "flex items-center justify-center rounded-xl border-2 transition-all shrink-0",
            "h-10 w-10",
            doneToday
              ? "bg-neutral-900 border-neutral-900 text-white dark:bg-neutral-50 dark:border-neutral-50 dark:text-neutral-900"
              : "bg-white border-neutral-200 text-neutral-300 hover:border-neutral-400 hover:text-neutral-500 dark:bg-neutral-950 dark:border-neutral-700 dark:hover:border-neutral-500"
          )}
        >
          {doneToday && <Check className="h-5 w-5" strokeWidth={3} />}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-semibold text-neutral-900 dark:text-neutral-50 truncate">{habit.name}</h4>
            {allDone && <Check className="h-3 w-3 text-emerald-500 shrink-0" strokeWidth={3} />}
          </div>
          {habit.description && (
            <p className="text-xs text-neutral-400 truncate">{habit.description}</p>
          )}
          <div className="flex items-center gap-1 mt-1">
            {weekDays.map((d) => {
              const ds = format(d, "yyyy-MM-dd")
              const done = habit.records.some((r) => r.date === ds && r.completed)
              const isFuture = ds > today
              return (
                <button
                  key={ds}
                  onClick={() => !isFuture && toggleDay(habit.id, ds)}
                  disabled={isFuture}
                  className={cn(
                    "h-3 w-3 rounded-sm transition-all",
                    done
                      ? "bg-neutral-900 dark:bg-neutral-50"
                      : isFuture
                      ? "bg-neutral-100 dark:bg-neutral-800"
                      : "bg-neutral-200 hover:bg-neutral-300 dark:bg-neutral-700 dark:hover:bg-neutral-600"
                  )}
                />
              )
            })}
          </div>
        </div>

        <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 max-sm:opacity-100 transition-opacity shrink-0">
          <button onClick={() => onEdit?.(habit)} className="flex h-7 w-7 items-center justify-center rounded-lg text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-800 dark:hover:text-neutral-300">
            <Edit3 className="h-3.5 w-3.5" />
          </button>
          <button onClick={() => deleteHabit(habit.id)} className="flex h-7 w-7 items-center justify-center rounded-lg text-neutral-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}
