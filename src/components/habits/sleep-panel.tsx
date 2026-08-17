"use client"

import { useMemo, useState } from "react"
import { Moon, Plus, Pencil, Trash2, MoonStar, Clock } from "lucide-react"
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  ResponsiveContainer, ReferenceLine, Cell,
} from "recharts"
import {
  ChartTooltip, ChartGradients,
  CHART_GRID_STYLES, CHART_AXIS_STYLES, CHART_CURSOR_STYLES,
} from "@/components/charts/chart-components"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useSleepStore, computeSleepHours } from "@/store/use-sleep-store"
import { cn } from "@/lib/shadcn-utils"
import type { SleepEntry } from "@/types"

const QUALITY_LABELS = ["", "Poor", "Fair", "Okay", "Good", "Great"]

function StatChip({ label, value, icon: Icon }: { label: string; value: string; icon: typeof Moon }) {
  return (
    <div className="flex items-center gap-2.5 rounded-2xl border border-neutral-200 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-900">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-neutral-100 dark:bg-neutral-800">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <p className="truncate text-[11px] text-neutral-500 dark:text-neutral-400">{label}</p>
        <p className="truncate text-sm font-bold text-neutral-900 dark:text-neutral-50">{value}</p>
      </div>
    </div>
  )
}

function QualityDots({ quality }: { quality: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((q) => (
        <span
          key={q}
          className={cn(
            "h-2 w-2 rounded-full",
            q <= quality ? "bg-indigo-500" : "bg-neutral-200 dark:bg-neutral-700"
          )}
        />
      ))}
    </div>
  )
}

function SleepFormDialog({
  open,
  onOpenChange,
  entry,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  entry: SleepEntry | null
}) {
  const { addEntry, updateEntry } = useSleepStore()
  const [date, setDate] = useState(entry?.date ?? new Date().toISOString().slice(0, 10))
  const [bedtime, setBedtime] = useState(entry?.bedtime ?? "23:30")
  const [wakeTime, setWakeTime] = useState(entry?.wakeTime ?? "07:00")
  const [quality, setQuality] = useState(String(entry?.quality ?? 3))
  const [notes, setNotes] = useState(entry?.notes ?? "")

  const hours = useMemo(() => computeSleepHours(bedtime, wakeTime), [bedtime, wakeTime])

  const reset = () => {
    setDate(entry?.date ?? new Date().toISOString().slice(0, 10))
    setBedtime(entry?.bedtime ?? "23:30")
    setWakeTime(entry?.wakeTime ?? "07:00")
    setQuality(String(entry?.quality ?? 3))
    setNotes(entry?.notes ?? "")
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!date || !bedtime || !wakeTime) return
    const data = { date, bedtime, wakeTime, quality: Number(quality), notes: notes.trim() }
    if (entry) {
      updateEntry(entry.id, data)
    } else {
      addEntry(data)
    }
    reset()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) reset(); onOpenChange(o) }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <MoonStar className="h-5 w-5 text-indigo-500" />
            {entry ? "Edit Sleep" : "Log Sleep"}
          </DialogTitle>
          <DialogDescription>Track your night to spot patterns and improve rest.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="sleep-date">Date</Label>
            <Input id="sleep-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required autoFocus />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="sleep-bedtime">Bedtime</Label>
              <Input id="sleep-bedtime" type="time" value={bedtime} onChange={(e) => setBedtime(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sleep-wake">Wake up</Label>
              <Input id="sleep-wake" type="time" value={wakeTime} onChange={(e) => setWakeTime(e.target.value)} required />
            </div>
          </div>
          <div className="flex items-center justify-between rounded-xl border border-neutral-200 bg-indigo-50/50 px-4 py-2.5 dark:border-neutral-800 dark:bg-indigo-500/5">
            <span className="flex items-center gap-1.5 text-xs font-medium text-neutral-500 dark:text-neutral-400">
              <Clock className="h-3.5 w-3.5 text-indigo-500" />
              Sleep duration
            </span>
            <span className="text-sm font-bold text-indigo-600 dark:text-indigo-300">
              {hours} hrs
            </span>
          </div>
          <div className="space-y-2">
            <Label htmlFor="sleep-quality">Quality</Label>
            <Select value={quality} onValueChange={setQuality}>
              <SelectTrigger id="sleep-quality" className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 4, 5].map((q) => (
                  <SelectItem key={q} value={String(q)}>{QUALITY_LABELS[q]} ({q}/5)</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="sleep-notes">Notes</Label>
            <Textarea id="sleep-notes" placeholder="Anything affecting your sleep..." value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit">{entry ? "Save" : "Log sleep"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function SleepPanel() {
  const { entries, getStats, getWeekEntries, deleteEntry } = useSleepStore()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<SleepEntry | null>(null)

  const stats = useMemo(() => getStats(), [getStats, entries.length])
  const weekEntries = useMemo(() => getWeekEntries(), [getWeekEntries, entries.length])
  const recent = useMemo(() => [...entries].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 10), [entries])

  const chartData = useMemo(() => {
    const days: { day: string; hours: number; quality: number; has: boolean }[] = []
    const now = new Date()
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(d.getDate() - i)
      const dateStr = d.toISOString().slice(0, 10)
      const entry = weekEntries.find((e) => e.date === dateStr) || entries.find((e) => e.date === dateStr)
      days.push({
        day: dateStr.slice(5),
        hours: entry?.hours ?? 0,
        quality: entry?.quality ?? 0,
        has: !!entry,
      })
    }
    return days
  }, [entries, weekEntries])

  const openCreate = () => { setEditing(null); setDialogOpen(true) }
  const openEdit = (entry: SleepEntry) => { setEditing(entry); setDialogOpen(true) }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="grid flex-1 grid-cols-3 gap-2.5 sm:gap-4">
          <StatChip label="Avg (30d)" value={`${stats.avgHours}h`} icon={Clock} />
          <StatChip label="Avg quality" value={QUALITY_LABELS[stats.avgQuality] || "—"} icon={MoonStar} />
          <StatChip label="Nights logged" value={String(stats.totalNights)} icon={Moon} />
        </div>
        <Button onClick={openCreate} className="shrink-0">
          <Plus className="mr-1.5 h-4 w-4" /> Log Sleep
        </Button>
      </div>

      {entries.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-neutral-300 py-12 text-neutral-400 dark:border-neutral-700">
          <div className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-neutral-100 dark:bg-neutral-800">
            <Moon className="h-4 w-4 text-indigo-500" />
          </div>
          <p className="text-sm">No sleep logged yet.</p>
          <Button variant="outline" onClick={openCreate}>Log your first night</Button>
        </div>
      ) : (
        <>
          <div className="card-modern rounded-2xl border border-neutral-200 bg-white p-4 sm:p-5 dark:border-neutral-800 dark:bg-neutral-900">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-neutral-100 dark:bg-neutral-800">
                  <Moon className="h-4 w-4 text-indigo-500" />
                </div>
                <h3 className="text-[13px] font-bold tracking-tight text-neutral-900 dark:text-neutral-50">
                  Last 14 Nights
                </h3>
              </div>
              <span className="flex items-center gap-1 text-[10px] font-medium text-neutral-400">
                <span className="h-0.5 w-4 bg-indigo-500" /> 8h target
              </span>
            </div>
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 4, right: 4, left: -22, bottom: 0 }}>
                  <ChartGradients ids={["sleep-hours"]} />
                  <CartesianGrid {...CHART_GRID_STYLES} />
                  <XAxis dataKey="day" {...CHART_AXIS_STYLES} />
                  <YAxis {...CHART_AXIS_STYLES} />
                  <Tooltip
                    content={
                      <ChartTooltip
                        formatter={(v) => `${v}h`}
                        labelFormatter={(l) => `Day ${l}`}
                      />
                    }
                    cursor={CHART_CURSOR_STYLES}
                  />
                  <ReferenceLine y={8} stroke="#525252" strokeDasharray="4 4" strokeOpacity={0.5} />
                  <Bar dataKey="hours" radius={[5, 5, 2, 2]} barSize={14}>
                    {chartData.map((d, i) => (
                      <Cell
                        key={i}
                        fill={d.has ? (d.hours >= 8 ? "url(#sleep-hours)" : "#737373") : "#e5e7eb"}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card-modern rounded-2xl border border-neutral-200 bg-white p-4 sm:p-5 dark:border-neutral-800 dark:bg-neutral-900">
            <div className="mb-3 flex items-center gap-2.5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-neutral-100 dark:bg-neutral-800">
                <MoonStar className="h-4 w-4 text-indigo-500" />
              </div>
              <h3 className="text-[13px] font-bold tracking-tight text-neutral-900 dark:text-neutral-50">
                Sleep History
              </h3>
            </div>
            <div className="space-y-1.5">
              {recent.map((e) => (
                <div
                  key={e.id}
                  className="group flex items-center gap-3 rounded-xl border border-neutral-200 bg-white px-3 py-2.5 transition-colors hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:bg-neutral-800/60"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-neutral-900 dark:text-neutral-50">
                      {e.date}
                      <span className="ml-2 text-xs font-semibold text-indigo-500 dark:text-indigo-300">{e.hours}h</span>
                    </p>
                    <p className="flex items-center gap-2 text-[11px] text-neutral-500 dark:text-neutral-400">
                      <Clock className="h-3 w-3" /> {e.bedtime} → {e.wakeTime}
                      {e.notes && <span className="truncate">· {e.notes}</span>}
                    </p>
                  </div>
                  <QualityDots quality={e.quality} />
                  <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100 max-sm:opacity-100">
                    <button
                      onClick={() => openEdit(e)}
                      className="rounded-lg p-1.5 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-600 dark:hover:bg-neutral-800 dark:hover:text-neutral-300"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => deleteEntry(e.id)}
                      className="rounded-lg p-1.5 text-neutral-400 transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/40"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      <SleepFormDialog open={dialogOpen} onOpenChange={setDialogOpen} entry={editing} />
    </div>
  )
}
