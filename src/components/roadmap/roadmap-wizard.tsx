"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Plus, Trash2, ChevronLeft, ChevronRight, Wand2, Target, Check, Sparkles,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select"
import { cn } from "@/lib/shadcn-utils"
import { useRoadmapStore, normalizeRoadmap } from "@/store/use-roadmap-store"
import { generateId } from "@/lib/utils"
import type { Roadmap, RoadmapCategory, RoadmapPriority, RoadmapPhase, RoadmapPhaseTask } from "@/types"
import {
  CATEGORY_LIST, CATEGORY_META, PRIORITY_LIST, PRIORITY_META,
} from "./roadmap-meta"

const EMOJIS = ["🎯", "🚀", "📢", "🎬", "🎧", "💪", "💰", "🌱", "🧠", "🏦", "📚", "🏃"]

const TEMPLATES: Record<RoadmapCategory, { steps: string[]; milestones: string[] }> = {
  content: {
    milestones: ["5 videos", "10 videos", "20 videos", "50 videos"],
    steps: ["Plan & outline", "Create the content", "Edit & polish", "Publish & promote", "Review performance"],
  },
  business: {
    milestones: ["Validate the idea", "Build the offer", "First 10 customers", "100 customers"],
    steps: ["Market research", "Set up the offer", "Launch marketing", "Convert & retain"],
  },
  career: {
    milestones: ["Resume & profiles", "Skill upgrade", "Network & referrals", "Land the offer"],
    steps: ["Audit current position", "Build the skill", "Apply & prepare", "Interview & close"],
  },
  learning: {
    milestones: ["Basics", "Intermediate", "Advanced", "Mastery"],
    steps: ["Pick best resources", "Learn the core", "Practice daily", "Test & teach"],
  },
  financial: {
    milestones: ["3-month runway", "Clear the debt", "Save 6 months", "Start investing"],
    steps: ["Track spending", "Cut & budget", "Build the fund", "Grow the money"],
  },
  personal: {
    milestones: ["Month 1", "Month 2", "Month 3", "Month 4"],
    steps: ["Set intentions", "Build the routine", "Stay consistent", "Review & level up"],
  },
  product: {
    milestones: ["Research", "MVP", "Beta launch", "Version 1.0"],
    steps: ["User research", "Design the MVP", "Build & test", "Ship & iterate"],
  },
  health: {
    milestones: ["Assessment", "First month", "Second month", "Maintained"],
    steps: ["Get a baseline", "Build the plan", "Execute consistently", "Sustain the habit"],
  },
}

type Draft = {
  title: string
  description: string
  emoji: string
  category: RoadmapCategory
  priority: RoadmapPriority
  target: string
  deadline: string
}

type DraftMilestone = {
  id: string
  title: string
  description: string
  dueDate: string
}

function spreadDates(n: number, deadline?: string): string[] {
  if (n === 0) return []
  const start = Date.now()
  const end = deadline ? new Date(deadline + "T23:59:59").getTime() : start + 90 * 24 * 60 * 60 * 1000
  return Array.from({ length: n }, (_, i) => {
    const t = start + ((end - start) * (i + 1)) / n
    return new Date(t).toISOString().slice(0, 10)
  })
}

export function CreateRoadmapDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const addRoadmapFull = useRoadmapStore((s) => s.addRoadmapFull)
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [autoTasks, setAutoTasks] = useState(true)
  const [error, setError] = useState("")
  const [draft, setDraft] = useState<Draft>({
    title: "", description: "", emoji: "🎯", category: "product", priority: "medium", target: "", deadline: "",
  })
  const [milestones, setMilestones] = useState<DraftMilestone[]>(() =>
    TEMPLATES.product.milestones.map((title) => ({
      id: generateId(),
      title,
      description: defaultMilestoneBrief(title, "product"),
      dueDate: "",
    }))
  )

  const close = () => {
    setStep(1)
    setError("")
    setDraft({ title: "", description: "", emoji: "🎯", category: "product", priority: "medium", target: "", deadline: "" })
    setMilestones(
      TEMPLATES.product.milestones.map((title) => ({
        id: generateId(),
        title,
        description: defaultMilestoneBrief(title, "product"),
        dueDate: "",
      }))
    )
    onOpenChange(false)
  }

  const useTemplate = (cat: RoadmapCategory) => {
    setDraft((d) => ({ ...d, category: cat }))
    const tpl = TEMPLATES[cat].milestones
    setMilestones(
      tpl.map((title) => ({
        id: generateId(),
        title,
        description: defaultMilestoneBrief(title, cat),
        dueDate: "",
      }))
    )
  }

  const addMilestone = () =>
    setMilestones((m) => [...m, { id: generateId(), title: "", description: "", dueDate: "" }])

  const buildRoadmap = (): Roadmap => {
    const tmpl = TEMPLATES[draft.category]
    const dates = spreadDates(milestones.length, draft.deadline || undefined)
    const now = Date.now()
    const phases: RoadmapPhase[] = milestones.map((m, i) => {
      const due = m.dueDate || dates[i] || ""
      const tasks: RoadmapPhaseTask[] = autoTasks
        ? tmpl.steps.map((title, j) => ({
            id: generateId(),
            title,
            completed: false,
            priority: j === 0 || j === 1 ? "high" : "medium",
            dueDate: due || undefined,
          }))
        : []
      return {
        id: generateId(),
        title: m.title,
        description: m.description || defaultMilestoneBrief(m.title, draft.category),
        status: "not-started",
        startDate: dates[i] || undefined,
        dueDate: due || undefined,
        priority: i === 0 ? "high" : "medium",
        tasks,
        notes: [],
        createdAt: now,
      }
    })
    return normalizeRoadmap({
      id: generateId(),
      title: draft.title,
      description: draft.description,
      emoji: draft.emoji,
      category: draft.category,
      target: draft.target,
      deadline: draft.deadline || undefined,
      priority: draft.priority,
      createdAt: now,
      updatedAt: now,
      phases,
    })
  }

  const create = () => {
    if (!draft.title.trim()) {
      setError("Give your roadmap a name.")
      setStep(1)
      return
    }
    addRoadmapFull(buildRoadmap())
    close()
  }

  return (
    <Dialog open={open} onOpenChange={(v) => (v ? undefined : close())}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wand2 className="h-5 w-5" /> Roadmap Builder
          </DialogTitle>
          <DialogDescription>
            Tell us your end goal and milestones — we build the full roadmap with dates, briefs, and tasks.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-2">
          {[
            { n: 1, label: "Goal" },
            { n: 2, label: "Milestones" },
            { n: 3, label: "Generate" },
          ].map((s) => (
            <div key={s.n} className="flex flex-1 flex-col gap-1">
              <div className={cn("h-1 rounded-full transition-all", step >= s.n ? "bg-neutral-900 dark:bg-white" : "bg-neutral-200 dark:bg-neutral-800")} />
              <span className={cn("text-[10px] font-semibold", step >= s.n ? "text-neutral-900 dark:text-white" : "text-neutral-400")}>{s.label}</span>
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
              <div className="space-y-2">
                <Label>What is your end goal?</Label>
                <Input value={draft.title} onChange={(e) => { setDraft((d) => ({ ...d, title: e.target.value })); setError("") }} placeholder="e.g. Launch a YouTube channel" />
              </div>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={draft.category} onValueChange={(v) => useTemplate(v as RoadmapCategory)}>
                    <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CATEGORY_LIST.map((c) => <SelectItem key={c} value={c}>{CATEGORY_META[c].label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Priority</Label>
                  <Select value={draft.priority} onValueChange={(v) => setDraft((d) => ({ ...d, priority: v as RoadmapPriority }))}>
                    <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {PRIORITY_LIST.map((p) => <SelectItem key={p} value={p}>{PRIORITY_META[p].label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Target</Label>
                  <Input value={draft.target} onChange={(e) => setDraft((d) => ({ ...d, target: e.target.value }))} placeholder="e.g. 1,000 subs" />
                </div>
                <div className="space-y-2">
                  <Label>Deadline</Label>
                  <Input type="date" value={draft.deadline} onChange={(e) => setDraft((d) => ({ ...d, deadline: e.target.value }))} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Why this matters</Label>
                <Textarea value={draft.description} onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))} placeholder="What does success look like?" />
              </div>
              <div className="space-y-2">
                <Label>Icon</Label>
                <div className="flex flex-wrap gap-2">
                  {EMOJIS.map((e) => (
                    <button key={e} onClick={() => setDraft((d) => ({ ...d, emoji: e }))}
                      className={cn("flex h-9 w-9 items-center justify-center rounded-xl border text-lg transition-all",
                        draft.emoji === e ? "border-neutral-900 bg-neutral-900/5 dark:border-white dark:bg-white/10" : "border-neutral-200 hover:bg-neutral-50 dark:border-neutral-800 dark:hover:bg-neutral-800/60")}>
                      {e}
                    </button>
                  ))}
                </div>
              </div>
              <Button className="w-full gap-2" onClick={() => setStep(2)} disabled={!draft.title.trim()}>
                Next: milestones <ChevronRight className="h-4 w-4" />
              </Button>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
              <div className="rounded-xl bg-neutral-50 p-3 text-xs text-neutral-500 dark:bg-neutral-800/60 dark:text-neutral-400">
                We pre-filled milestones for <span className="font-semibold">{CATEGORY_META[draft.category].label}</span>. Edit, add, or remove them — dates auto-spread until your deadline.
              </div>

              <div className="max-h-56 space-y-2 overflow-y-auto pr-1">
                {milestones.map((m, i) => (
                  <div key={m.id} className="flex items-center gap-2 rounded-xl border border-neutral-200 p-2 dark:border-neutral-800">
                    <span className="w-5 shrink-0 text-center text-[10px] font-bold text-neutral-400">{i + 1}</span>
                    <Input value={m.title} onChange={(e) => setMilestones((ms) => ms.map((x) => x.id === m.id ? { ...x, title: e.target.value } : x))} placeholder="e.g. 5 videos" className="h-8 flex-1 text-sm" />
                    <Input type="date" value={m.dueDate} onChange={(e) => setMilestones((ms) => ms.map((x) => x.id === m.id ? { ...x, dueDate: e.target.value } : x))} className="h-8 w-[130px] text-xs max-sm:w-[110px]" />
                    <button onClick={() => setMilestones((ms) => ms.filter((x) => x.id !== m.id))} className="rounded-lg p-1.5 text-neutral-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/50">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              <Button variant="outline" size="sm" onClick={addMilestone} className="gap-2">
                <Plus className="h-4 w-4" /> Add milestone
              </Button>

              <label className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-neutral-200 p-3 dark:border-neutral-800">
                <button
                  onClick={() => setAutoTasks((v) => !v)}
                  className={cn("flex h-5 w-9 items-center rounded-full p-0.5 transition-all", autoTasks ? "bg-neutral-900 dark:bg-white" : "bg-neutral-300 dark:bg-neutral-700")}
                >
                  <span className={cn("h-4 w-4 rounded-full bg-white shadow transition-all dark:bg-neutral-900", autoTasks ? "translate-x-4" : "translate-x-0")} />
                </button>
                <div>
                  <p className="text-sm font-medium text-neutral-700 dark:text-neutral-200">Auto-generate tasks for every milestone</p>
                  <p className="text-xs text-neutral-400">Adds a planner, creator, publisher, and review task per milestone.</p>
                </div>
              </label>

              <div className="flex gap-2">
                <Button variant="outline" className="gap-1.5" onClick={() => setStep(1)}>
                  <ChevronLeft className="h-4 w-4" /> Back
                </Button>
                <Button className="flex-1 gap-2" onClick={() => setStep(3)} disabled={milestones.length === 0}>
                  Generate roadmap <Sparkles className="h-4 w-4" />
                </Button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="s3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
              <div className="flex items-center gap-3 rounded-2xl border border-neutral-200 p-4 dark:border-neutral-800">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-neutral-100 text-2xl dark:bg-neutral-800">{draft.emoji}</div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-neutral-900 dark:text-white">{draft.title}</p>
                  <p className="truncate text-xs text-neutral-400">
                    {CATEGORY_META[draft.category].label} · {PRIORITY_META[draft.priority].label}
                    {draft.target && <> · {draft.target}</>}
                    {draft.deadline && <> · by {new Date(draft.deadline).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</>}
                  </p>
                </div>
                <Target className="h-5 w-5 shrink-0 text-neutral-300 dark:text-neutral-600" />
              </div>

              <div className="max-h-60 space-y-2 overflow-y-auto pr-1">
                {milestones.map((m, i) => {
                  const due = m.dueDate || spreadDates(milestones.length, draft.deadline || undefined)[i]
                  return (
                    <div key={m.id} className="rounded-xl border border-neutral-200 p-3 dark:border-neutral-800">
                      <div className="flex items-center gap-2">
                        <span className="rounded-md bg-neutral-100 px-1.5 py-0.5 text-[10px] font-bold text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400">M{i + 1}</span>
                        <p className="flex-1 truncate text-sm font-semibold text-neutral-800 dark:text-neutral-100">{m.title}</p>
                        {due && <span className="text-[10px] text-neutral-400">{new Date(due).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</span>}
                      </div>
                      {autoTasks ? (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {TEMPLATES[draft.category].steps.map((s) => (
                            <span key={s} className="rounded-md bg-neutral-50 px-1.5 py-0.5 text-[10px] text-neutral-500 dark:bg-neutral-800/60 dark:text-neutral-400">{s}</span>
                          ))}
                        </div>
                      ) : (
                        <p className="mt-1 text-xs text-neutral-400">No auto-tasks</p>
                      )}
                    </div>
                  )
                })}
              </div>

              <div className="flex gap-2">
                <Button variant="outline" className="gap-1.5" onClick={() => setStep(2)}>
                  <ChevronLeft className="h-4 w-4" /> Back
                </Button>
                <Button className="flex-1 gap-2" onClick={create}>
                  <Check className="h-4 w-4" /> Create roadmap
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  )
}

function defaultMilestoneBrief(title: string, category: RoadmapCategory): string {
  const tmpl = TEMPLATES[category]
  const last = tmpl.milestones[tmpl.milestones.length - 1]
  if (title === tmpl.milestones[0]) return `Kick off with the first big milestone — “${title}”. Lock the plan, ship the first version, and gather early feedback.`
  if (title === last) return `The final stretch — “${title}”. Finish strong, collect results, and decide what comes next.`
  const prev = tmpl.milestones[tmpl.milestones.indexOf(title) - 1]
  if (prev) return `Push past “${prev}” and hit “${title}”. Double down on what works, fix what doesn't, and keep the momentum going.`
  return `Deliver “${title}” — plan, execute, and measure the outcome.`
}