"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { AlarmClock, Plus, Trash2, BellOff, Check, Pencil } from "lucide-react"
import { useAlarmStore } from "@/store/use-alarm-store"
import { cn } from "@/lib/shadcn-utils"

function mapTimeToToday(time: string): string {
  // Return the next occurrence of "HH:mm" as a sortable "yyyy-MM-ddTHH:mm".
  const [hh, mm] = time.split(":").map(Number)
  const d = new Date()
  d.setHours(hh, mm, 0, 0)
  if (d.getTime() <= Date.now()) d.setDate(d.getDate() + 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")} ${time}`
}

export function AlarmCard() {
  const { alarms, addAlarm, updateAlarm, deleteAlarm, toggleAlarm } = useAlarmStore()
  const [open, setOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [label, setLabel] = useState("")
  const [time, setTime] = useState("08:00")

  const sorted = [...alarms].sort((a, b) => mapTimeToToday(a.time).localeCompare(mapTimeToToday(b.time)))

  const startAdd = () => {
    setEditingId(null)
    setLabel("")
    setTime("08:00")
    setOpen(true)
  }

  const startEdit = (id: string) => {
    const a = alarms.find((x) => x.id === id)
    if (!a) return
    setEditingId(id)
    setLabel(a.label)
    setTime(a.time)
    setOpen(true)
  }

  const close = () => {
    setOpen(false)
    setEditingId(null)
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!time) return
    if (editingId) updateAlarm(editingId, { label: label.trim(), time })
    else addAlarm({ label: label.trim(), time })
    close()
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05, duration: 0.3 }}
      className="relative overflow-hidden rounded-[14px] bg-white p-4 dark:bg-neutral-900 sm:p-5"
    >
      <div className="mb-3 flex items-center gap-2.5">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-neutral-100 dark:bg-neutral-800">
          <AlarmClock className="h-4 w-4 text-neutral-600 dark:text-neutral-300" />
        </div>
        <h3 className="text-[13px] font-bold tracking-tight text-neutral-900 dark:text-neutral-50">Alarms</h3>
        <span className="text-[10px] text-neutral-400 dark:text-neutral-500">Rings daily</span>
        <button
          onClick={startAdd}
          className="ml-auto flex h-8 w-8 items-center justify-center rounded-[10px] bg-neutral-100 text-neutral-500 transition-colors hover:bg-neutral-900 hover:text-white dark:bg-neutral-800 dark:text-neutral-400 dark:hover:bg-white dark:hover:text-neutral-900"
          title="Add alarm"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.form
            onSubmit={submit}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="space-y-2.5 rounded-xl bg-neutral-50 p-3 dark:bg-neutral-800/50">
              <input
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="Label (e.g. Wake up)"
                className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 outline-none placeholder:text-neutral-400 focus:border-neutral-400 dark:border-neutral-700 dark:bg-neutral-950 dark:text-white"
              />
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                required
                className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 outline-none focus:border-neutral-400 dark:border-neutral-700 dark:bg-neutral-950 dark:text-white"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={close}
                  className="flex-1 rounded-lg border border-neutral-200 py-2 text-sm font-medium text-neutral-500 transition-colors hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-neutral-900 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 dark:bg-white dark:text-neutral-900"
                >
                  <Check className="h-4 w-4" /> {editingId ? "Save" : "Set"}
                </button>
              </div>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {sorted.length === 0 && !open ? (
        <div className="flex flex-col items-center gap-2 py-8 text-neutral-400">
          <AlarmClock className="h-7 w-7" />
          <p className="text-xs">No alarms set</p>
          <p className="text-[10px] text-neutral-400 dark:text-neutral-500">Tap + to set one</p>
        </div>
      ) : (
        <div className="space-y-2">
          {sorted.map((a) => (
            <motion.div
              key={a.id}
              layout
              className={cn(
                "flex items-center gap-3 rounded-xl border px-3 py-2.5 transition-colors",
                a.enabled
                  ? "border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900"
                  : "border-dashed border-neutral-200 bg-neutral-50 opacity-60 dark:border-neutral-800 dark:bg-neutral-900/40"
              )}
            >
              <button
                onClick={() => toggleAlarm(a.id)}
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] transition-colors",
                  a.enabled
                    ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
                    : "border border-neutral-200 text-neutral-400 dark:border-neutral-700"
                )}
                title={a.enabled ? "Turn off" : "Turn on"}
              >
                {a.enabled ? <AlarmClock className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
              </button>
              <div className="min-w-0 flex-1">
                <p className={cn("text-sm font-semibold tracking-tight", a.enabled ? "text-neutral-900 dark:text-white" : "text-neutral-400 dark:text-neutral-500 line-through")}>
                  {a.time}
                </p>
                {a.label && (
                  <p className="truncate text-[11px] text-neutral-400 dark:text-neutral-500">{a.label}</p>
                )}
              </div>
              <button
                onClick={() => startEdit(a.id)}
                className="rounded-[10px] p-1.5 text-neutral-300 transition-colors hover:bg-neutral-100 hover:text-neutral-600 dark:text-neutral-600 dark:hover:bg-neutral-800 dark:hover:text-neutral-300"
                title="Edit alarm"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => deleteAlarm(a.id)}
                className="rounded-[10px] p-1.5 text-neutral-300 transition-colors hover:bg-red-50 hover:text-red-500 dark:text-neutral-600 dark:hover:bg-red-950/40"
                title="Delete alarm"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  )
}
