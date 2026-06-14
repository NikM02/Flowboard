"use client"

import { useMemo } from "react"
import { Check, Plus, Edit3, Trash2, LayoutGrid, List } from "lucide-react"
import { cn } from "@/lib/shadcn-utils"
import { useHabitStore } from "@/store/use-habit-store"
import { format, startOfWeek, endOfWeek, eachDayOfInterval } from "date-fns"
import type { Habit } from "@/types"

export function HabitListView({ onEdit }: { onEdit?: (habit: Habit) => void }) {
  const { habits, toggleDay, deleteHabit, setIsCreateModalOpen, habitViewMode, setHabitViewMode } = useHabitStore()

  const weekDays = useMemo(() => {
    const start = startOfWeek(new Date(), { weekStartsOn: 1 })
    const end = endOfWeek(new Date(), { weekStartsOn: 1 })
    return eachDayOfInterval({ start, end })
  }, [])

  const dayLabels = useMemo(() => weekDays.map((d) => format(d, "EEEEE")), [weekDays])

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
          Week of {format(weekDays[0], "MMM d")} – {format(weekDays[6], "MMM d, yyyy")}
        </p>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-neutral-200 p-0.5 dark:border-neutral-700">
            <button
              onClick={() => setHabitViewMode("card")}
              className={cn("rounded-md p-1.5 transition-colors", habitViewMode === "card" ? "bg-neutral-100 text-neutral-900 dark:bg-neutral-700 dark:text-neutral-50" : "text-neutral-400 hover:text-neutral-600")}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setHabitViewMode("list")}
              className={cn("rounded-md p-1.5 transition-colors", habitViewMode === "list" ? "bg-neutral-100 text-neutral-900 dark:bg-neutral-700 dark:text-neutral-50" : "text-neutral-400 hover:text-neutral-600")}
            >
              <List className="h-3.5 w-3.5" />
            </button>
          </div>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-1 text-xs font-medium text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-50 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />New Habit
          </button>
        </div>
      </div>

      {habits.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-neutral-200 p-12 text-center text-sm text-neutral-400 dark:border-neutral-700">
          No habits yet
        </div>
      ) : habitViewMode === "card" ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {habits.map((habit) => (
            <HabitCard key={habit.id} habit={habit} weekDays={weekDays} dayLabels={dayLabels} onEdit={onEdit} toggleDay={toggleDay} deleteHabit={deleteHabit} />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {habits.map((habit) => (
            <HabitListItem key={habit.id} habit={habit} weekDays={weekDays} dayLabels={dayLabels} onEdit={onEdit} toggleDay={toggleDay} deleteHabit={deleteHabit} />
          ))}
        </div>
      )}
    </div>
  )
}

function HabitCard({
  habit, weekDays, dayLabels, onEdit, toggleDay, deleteHabit,
}: {
  habit: Habit
  weekDays: Date[]
  dayLabels: string[]
  onEdit?: (h: Habit) => void
  toggleDay: (id: string, date: string) => void
  deleteHabit: (id: string) => void
}) {
  const today = format(new Date(), "yyyy-MM-dd")

  return (
    <div className="group rounded-2xl border border-neutral-200/60 bg-white p-4 shadow-sm transition-all hover:shadow-md dark:border-neutral-800/60 dark:bg-neutral-950">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h4 className="text-sm font-semibold text-neutral-900 dark:text-neutral-50 truncate">{habit.name}</h4>
          {habit.description && (
            <p className="mt-0.5 text-xs text-neutral-400 truncate">{habit.description}</p>
          )}
        </div>
        <div className="flex gap-0.5 shrink-0 sm:opacity-0 sm:group-hover:opacity-100 sm:transition-opacity">
          <button onClick={() => onEdit?.(habit)} className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-800 dark:hover:text-neutral-300">
            <Edit3 className="h-3.5 w-3.5" />
          </button>
          <button onClick={() => deleteHabit(habit.id)} className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {(habit.startDate || habit.endDate) && (
        <div className="mb-3 flex items-center gap-3 text-[11px] text-neutral-400">
          {habit.startDate && <span>From {format(new Date(habit.startDate as string), "MMM d, yyyy")}</span>}
          {habit.endDate && <span>To {format(new Date(habit.endDate as string), "MMM d, yyyy")}</span>}
        </div>
      )}

      <div className="mb-3 flex items-center justify-center gap-3">
        {weekDays.map((d, i) => {
          const ds = format(d, "yyyy-MM-dd")
          const done = habit.records.some((r) => r.date === ds && r.completed)
          const isFuture = ds > today
          return (
            <button
              key={ds}
              onClick={() => !isFuture && toggleDay(habit.id, ds)}
              disabled={isFuture}
              aria-label={`Toggle ${format(d, "EEEE")}`}
              className={cn(
                "flex flex-col items-center gap-1",
                isFuture && "opacity-40 cursor-not-allowed"
              )}
            >
              <span className="text-[10px] font-medium text-neutral-400 uppercase">{dayLabels[i]}</span>
              <div
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-lg border-2 transition-all",
                  done
                    ? "bg-neutral-900 border-neutral-900 text-white dark:bg-neutral-50 dark:border-neutral-50 dark:text-neutral-900"
                    : "bg-white border-neutral-200 dark:bg-neutral-950 dark:border-neutral-700"
                )}
              >
                {done && <Check className="h-4 w-4" strokeWidth={3} />}
              </div>
            </button>
          )
        })}
      </div>

      <div className="flex items-center justify-between border-t border-neutral-100 pt-2 dark:border-neutral-800">
        <div className="flex items-center gap-2">
          <button
            onClick={() => toggleDay(habit.id, today)}
            className={cn(
              "flex items-center justify-center rounded-lg border-2 transition-all h-8 px-2 gap-1 text-xs font-medium",
              habit.records.some((r) => r.date === today && r.completed)
                ? "bg-emerald-50 border-emerald-300 text-emerald-700 dark:bg-emerald-950/30 dark:border-emerald-600 dark:text-emerald-400"
                : "bg-white border-neutral-200 text-neutral-500 hover:border-neutral-400 dark:bg-neutral-950 dark:border-neutral-700 dark:hover:border-neutral-500"
            )}
          >
            {habit.records.some((r) => r.date === today && r.completed) ? (
              <Check className="h-3.5 w-3.5" strokeWidth={3} />
            ) : (
              <span className="h-3.5 w-3.5 rounded-sm border border-current" />
            )}
            Today
          </button>
          <span className="text-[11px] text-neutral-400">
            {weekDays.filter((d) => {
              const ds = format(d, "yyyy-MM-dd")
              return habit.records.some((r) => r.date === ds && r.completed)
            }).length}/7
          </span>
        </div>
        <span className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400">{habit.category}</span>
      </div>
    </div>
  )
}

function HabitListItem({
  habit, weekDays, dayLabels, onEdit, toggleDay, deleteHabit,
}: {
  habit: Habit
  weekDays: Date[]
  dayLabels: string[]
  onEdit?: (h: Habit) => void
  toggleDay: (id: string, date: string) => void
  deleteHabit: (id: string) => void
}) {
  const today = format(new Date(), "yyyy-MM-dd")
  const doneToday = habit.records.some((r) => r.date === today && r.completed)

  return (
    <div className="group rounded-2xl border border-neutral-200/60 bg-white p-3 shadow-sm transition-all hover:shadow-md dark:border-neutral-800/60 dark:bg-neutral-950">
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
            <span className="text-[10px] font-medium text-neutral-400 uppercase shrink-0">{habit.category}</span>
          </div>
          {(habit.description || habit.startDate || habit.endDate) && (
            <p className="mt-0.5 text-[11px] text-neutral-400 truncate">
              {habit.description}
              {habit.startDate && (habit.description ? " · " : "")}From {format(new Date(habit.startDate as string), "MMM d")}
              {habit.endDate && ` → ${format(new Date(habit.endDate as string), "MMM d, yyyy")}`}
            </p>
          )}
        </div>

        <div className="flex items-center gap-1 overflow-x-auto">
          {weekDays.map((d, i) => {
            const ds = format(d, "yyyy-MM-dd")
            const done = habit.records.some((r) => r.date === ds && r.completed)
            const isFuture = ds > today
            return (
              <button
                key={ds}
                onClick={() => !isFuture && toggleDay(habit.id, ds)}
                disabled={isFuture}
                aria-label={`Toggle ${format(d, "EEEE")}`}
                className={cn(
                  "flex items-center justify-center rounded-sm transition-all h-5 w-5 sm:h-4 sm:w-4",
                  done
                    ? "bg-neutral-900 dark:bg-neutral-50"
                    : isFuture
                    ? "bg-neutral-100 dark:bg-neutral-800"
                    : "bg-neutral-200 hover:bg-neutral-300 dark:bg-neutral-700 dark:hover:bg-neutral-600"
                )}
              >
                {done && <Check className="h-3 w-3 text-white dark:text-neutral-900" strokeWidth={3} />}
              </button>
            )
          })}
        </div>

        <div className="flex gap-0.5 shrink-0 sm:opacity-0 sm:group-hover:opacity-100 sm:transition-opacity">
          <button onClick={() => onEdit?.(habit)} className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-800 dark:hover:text-neutral-300">
            <Edit3 className="h-3.5 w-3.5" />
          </button>
          <button onClick={() => deleteHabit(habit.id)} className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}