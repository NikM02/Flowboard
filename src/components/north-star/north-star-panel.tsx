"use client"

import { useState, useMemo } from "react"
import { motion } from "framer-motion"
import {
  Pencil, Check, X, Eye, Target, Calendar, ChevronLeft, ChevronRight, Flag,
} from "lucide-react"
import { cn } from "@/lib/shadcn-utils"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useNorthStarStore } from "@/store/use-north-star-store"

function InlineEditText({
  value,
  onSave,
  placeholder,
}: {
  value: string
  onSave: (v: string) => void
  placeholder?: string
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)

  const save = () => {
    onSave(draft)
    setEditing(false)
  }

  if (!editing) {
    return (
      <div
        onClick={() => { setDraft(value); setEditing(true) }}
        className="group/edit cursor-pointer rounded-[10px] px-3 py-2 transition-colors hover:bg-neutral-50 "
      >
        {value ? (
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-neutral-800 ">{value}</p>
        ) : (
          <p className="text-sm italic text-neutral-400 ">{placeholder || "Click to add..."}</p>
        )}
        <Pencil className="mt-1 h-3 w-3 text-neutral-300 opacity-0 transition-opacity group-hover/edit:opacity-100 " />
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <Textarea
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        rows={4}
        className="text-sm"
        placeholder={placeholder}
        autoFocus
      />
      <div className="flex gap-1.5">
        <Button size="sm" className="h-7 gap-1 px-2.5" onClick={save}>
          <Check className="h-3 w-3" /> Save
        </Button>
        <Button size="sm" variant="ghost" className="h-7 gap-1 px-2.5" onClick={() => setEditing(false)}>
          <X className="h-3 w-3" /> Cancel
        </Button>
      </div>
    </div>
  )
}

const QUARTER_LABELS = ["Q1 (Jan–Mar)", "Q2 (Apr–Jun)", "Q3 (Jul–Sep)", "Q4 (Oct–Dec)"] as const
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
]

function QuarterlyPlansCard() {
  const { quarterlyPlans, setQuarterlyPlan } = useNorthStarStore()
  const currentYear = new Date().getFullYear()
  const [year, setYear] = useState(currentYear)

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.16 }}>
      <div className="rounded-[10px] border border-neutral-200/60 bg-white p-6 sm:p-8 ">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-neutral-100 shadow-sm">
              <Flag className="h-4 w-4 text-neutral-600 " />
            </div>
            <div>
              <h2 className="text-[11px] font-bold uppercase tracking-widest text-neutral-500 ">Quarterly Plans</h2>
              <p className="text-[11px] text-neutral-400/70 ">Set goals for each quarter</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => setYear((y) => y - 1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="min-w-[4rem] text-center text-sm font-semibold text-neutral-700 ">{year}</span>
            <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => setYear((y) => y + 1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {([1, 2, 3, 4] as const).map((q) => {
            const plan = quarterlyPlans.find((p) => p.year === year && p.quarter === q)?.plan ?? ""
            return (
              <div key={q} className="rounded-[10px] border border-neutral-200 bg-neutral-50/50 p-4 ">
                <h3 className="text-sm font-bold text-neutral-800 ">{QUARTER_LABELS[q - 1]}</h3>
                <div className="mt-2">
                  <InlineEditText
                    value={plan}
                    onSave={(v) => setQuarterlyPlan(year, q, v)}
                    placeholder={`What do you want to achieve in Q${q}?`}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </motion.div>
  )
}

function MonthlyPlanCard() {
  const { monthlyPlans, setMonthlyPlan } = useNorthStarStore()
  const now = new Date()
  const [cursor, setCursor] = useState(() => ({ year: now.getFullYear(), month: now.getMonth() + 1 }))

  const plan = useMemo(
    () => monthlyPlans.find((p) => p.year === cursor.year && p.month === cursor.month)?.plan ?? "",
    [monthlyPlans, cursor]
  )

  const goPrev = () => {
    setCursor((c) => (c.month === 1 ? { year: c.year - 1, month: 12 } : { year: c.year, month: c.month - 1 }))
  }
  const goNext = () => {
    setCursor((c) => (c.month === 12 ? { year: c.year + 1, month: 1 } : { year: c.year, month: c.month + 1 }))
  }
  const goToday = () => {
    const d = new Date()
    setCursor({ year: d.getFullYear(), month: d.getMonth() + 1 })
  }

  const isCurrentMonth = cursor.year === now.getFullYear() && cursor.month === now.getMonth() + 1

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.24 }}>
      <div className="rounded-[10px] border border-neutral-200/60 bg-white p-6 sm:p-8 ">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-neutral-100 shadow-sm">
              <Calendar className="h-4 w-4 text-neutral-600 " />
            </div>
            <div>
              <h2 className="text-[11px] font-bold uppercase tracking-widest text-neutral-500 ">Monthly Plan</h2>
              <p className="text-[11px] text-neutral-400/70 ">Navigate month by month</p>
            </div>
          </div>
          {!isCurrentMonth && (
            <Button variant="outline" size="sm" className="h-8 rounded-[10px] text-xs" onClick={goToday}>
              This month
            </Button>
          )}
        </div>

        {/* Month slider/navigation */}
        <div className="mt-6 flex items-center justify-between gap-2 rounded-[10px] border border-neutral-200 bg-neutral-50/50 px-2 py-2 ">
          <Button variant="ghost" size="sm" className="h-9 w-9 shrink-0 p-0" onClick={goPrev} aria-label="Previous month">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="min-w-0 flex-1 text-center">
            <p className="text-base font-bold tracking-tight text-neutral-900 sm:text-lg">
              {MONTH_NAMES[cursor.month - 1]} {cursor.year}
            </p>
            {isCurrentMonth && <p className="text-xs font-medium text-blue-600">Current month</p>}
          </div>
          <Button variant="ghost" size="sm" className="h-9 w-9 shrink-0 p-0" onClick={goNext} aria-label="Next month">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="mt-4 rounded-[10px] border border-neutral-200 p-4 ">
          <InlineEditText
            value={plan}
            onSave={(v) => setMonthlyPlan(cursor.year, cursor.month, v)}
            placeholder={`Plan your focus and goals for ${MONTH_NAMES[cursor.month - 1]} ${cursor.year}...`}
          />
        </div>
      </div>
    </motion.div>
  )
}

export function NorthStarPanel() {
  const { vision, mission, setVision, setMission } = useNorthStarStore()

  return (
    <div className="space-y-8">
      {/* Vision */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
        <div className="relative overflow-hidden rounded-[10px] border border-neutral-200/60 bg-white p-6 sm:p-8 ">
          <div className="pointer-events-none absolute inset-0 opacity-[0.035] " style={{ backgroundImage: "radial-gradient(circle, currentColor 1px, transparent 1px)", backgroundSize: "24px 24px" }} />
          <div className="relative">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-neutral-100 shadow-sm">
                <Eye className="h-4 w-4 text-neutral-600 " />
              </div>
              <div>
                <h2 className="text-[11px] font-bold uppercase tracking-widest text-neutral-400 ">Vision</h2>
                <p className="text-[11px] text-neutral-400/70 ">Where you&apos;re headed</p>
              </div>
            </div>
            <div className="mt-5">
              <InlineEditText
                value={vision}
                onSave={setVision}
                placeholder="Write your vision — the future you're building toward..."
              />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Mission */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.08 }}>
        <div className="rounded-[10px] border border-neutral-200 bg-white p-6 sm:p-8 ">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-neutral-100 shadow-sm">
              <Target className="h-4 w-4 text-neutral-600 " />
            </div>
            <div>
              <h2 className="text-[11px] font-bold uppercase tracking-widest text-neutral-600 ">Mission</h2>
              <p className="text-[11px] text-neutral-400/70 ">Your purpose</p>
            </div>
          </div>
          <div className="mt-5">
            <InlineEditText
              value={mission}
              onSave={setMission}
              placeholder="How you bring your vision to life..."
            />
          </div>
        </div>
      </motion.div>

      <QuarterlyPlansCard />
      <MonthlyPlanCard />
    </div>
  )
}
