"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Pencil, Plus, Trash2, Check, X,
  Compass, Target, Shield, Gem, Star, Heart, Zap,
  Mountain, Flame, Eye, Lightbulb, Users, Rocket, Crown, Swords,
} from "lucide-react"
import { cn } from "@/lib/shadcn-utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useNorthStarStore } from "@/store/use-north-star-store"
import type { Pillar } from "@/store/use-north-star-store"

const iconMap: Record<string, typeof Star> = {
  Star, Heart, Zap, Mountain, Flame, Eye, Lightbulb,
  Users, Rocket, Crown, Swords, Gem, Target, Shield, Compass,
}
const iconOptions = Object.keys(iconMap)

function IconDisplay({ name, className }: { name: string; className?: string }) {
  const Icon = iconMap[name] || Star
  return <Icon className={className} />
}

function InlineEditText({
  value,
  onSave,
  multiline,
  placeholder,
}: {
  value: string
  onSave: (v: string) => void
  multiline?: boolean
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
        className="group/edit cursor-pointer rounded-lg px-3 py-2 transition-colors hover:bg-black/[0.03] dark:hover:bg-white/[0.03]"
      >
        {value ? (
          <p className={cn(
            "whitespace-pre-wrap leading-relaxed text-neutral-800 dark:text-neutral-200",
            multiline ? "text-sm" : "text-sm"
          )}>
            {value}
          </p>
        ) : (
          <p className="text-sm italic text-neutral-400 dark:text-neutral-600">
            {placeholder || "Click to add..."}
          </p>
        )}
        <Pencil className="mt-1 h-3 w-3 text-neutral-300 opacity-0 transition-opacity group-hover/edit:opacity-100 dark:text-neutral-600" />
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {multiline ? (
        <Textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={4}
          className="text-sm"
          placeholder={placeholder}
          autoFocus
        />
      ) : (
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          className="text-sm"
          placeholder={placeholder}
          autoFocus
        />
      )}
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

function PillarCard({
  pillar,
  onEdit,
  onDelete,
}: {
  pillar: Pillar
  onEdit: () => void
  onDelete: () => void
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="card-modern card-hover glass group relative rounded-2xl p-5"
    >
      <div className="absolute right-3 top-3 flex gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
        <button onClick={onEdit} className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 dark:hover:bg-neutral-800 dark:hover:text-neutral-300">
          <Pencil className="h-3.5 w-3.5" />
        </button>
        <button onClick={onDelete} className="rounded-lg p-1.5 text-neutral-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/50">
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500/15 to-violet-500/10 shadow-inner">
        <IconDisplay name={pillar.icon} className="h-5 w-5 text-indigo-500 dark:text-indigo-300" />
      </div>
      <h3 className="mt-3.5 text-[15px] font-bold tracking-tight text-neutral-900 dark:text-neutral-50">{pillar.title}</h3>
      {pillar.description && (
        <p className="mt-1.5 text-xs leading-relaxed text-neutral-500 dark:text-neutral-400 line-clamp-3">{pillar.description}</p>
      )}
    </motion.div>
  )
}

function PillarDialog({
  open,
  onOpenChange,
  pillar,
  onSave,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  pillar?: Pillar
  onSave: (data: { title: string; description: string; icon: string }) => void
}) {
  const [title, setTitle] = useState(pillar?.title ?? "")
  const [description, setDescription] = useState(pillar?.description ?? "")
  const [icon, setIcon] = useState(pillar?.icon ?? "Star")

  const save = () => {
    if (!title.trim()) return
    onSave({ title: title.trim(), description: description.trim(), icon })
    onOpenChange(false)
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
          onClick={() => onOpenChange(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ duration: 0.15 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-6 shadow-xl dark:border-neutral-800 dark:bg-neutral-900"
          >
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">
              {pillar ? "Edit Pillar" : "New Pillar"}
            </h3>
            <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
              {pillar ? "Update this core pillar." : "Define a core pillar that guides you."}
            </p>
            <div className="mt-5 space-y-4">
              <div>
                <label className="mb-2 block text-xs font-medium text-neutral-600 dark:text-neutral-400">Icon</label>
                <div className="flex flex-wrap gap-1.5">
                  {iconOptions.map((key) => (
                    <button
                      key={key}
                      onClick={() => setIcon(key)}
                      className={cn(
                        "flex h-9 w-9 items-center justify-center rounded-xl border transition-all",
                        icon === key
                          ? "border-neutral-900 bg-neutral-900 text-white shadow-sm dark:border-neutral-50 dark:bg-neutral-50 dark:text-neutral-900"
                          : "border-neutral-200 text-neutral-500 hover:border-neutral-300 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-400 dark:hover:border-neutral-600 dark:hover:bg-neutral-800"
                      )}
                    >
                      <IconDisplay name={key} className="h-4 w-4" />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="mb-2 block text-xs font-medium text-neutral-600 dark:text-neutral-400">Title</label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Integrity"
                  autoFocus
                />
              </div>
              <div>
                <label className="mb-2 block text-xs font-medium text-neutral-600 dark:text-neutral-400">Description</label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  placeholder="What does this mean to you?"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button size="sm" disabled={!title.trim()} onClick={save}>
                {pillar ? "Update" : "Add Pillar"}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export function NorthStarPanel() {
  const {
    vision, mission, identity, pillars,
    setVision, setMission, setIdentity,
    addPillar, updatePillar, deletePillar,
  } = useNorthStarStore()

  const [pillarDialog, setPillarDialog] = useState<{ open: boolean; pillar?: Pillar }>({ open: false })

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">
          North Star
        </h1>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          Your guiding principles and foundational identity
        </p>
      </div>

      {/* Vision — full-width hero */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
        <div className="relative overflow-hidden rounded-3xl border border-neutral-200/60 bg-gradient-to-br from-neutral-50 via-white to-neutral-100/50 p-6 sm:p-8 dark:border-neutral-800/60 dark:from-neutral-900 dark:via-neutral-900 dark:to-neutral-900/80">
          {/* decorative dot grid */}
          <div className="pointer-events-none absolute inset-0 opacity-[0.035] dark:opacity-[0.05]" style={{ backgroundImage: "radial-gradient(circle, currentColor 1px, transparent 1px)", backgroundSize: "24px 24px" }} />
          <div className="relative">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-neutral-900 shadow-sm dark:bg-neutral-50">
                <Eye className="h-5 w-5 text-white dark:text-neutral-900" />
              </div>
              <div>
                <h2 className="text-[11px] font-bold uppercase tracking-widest text-neutral-400 dark:text-neutral-500">Vision</h2>
                <p className="text-[11px] text-neutral-400/70 dark:text-neutral-500/70">Where you&apos;re headed</p>
              </div>
            </div>
            <div className="mt-5">
              <InlineEditText
                value={vision}
                onSave={setVision}
                multiline
                placeholder="Write your vision — the future you're building toward..."
              />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Mission & Identity — side by side */}
      <div className="grid gap-4 sm:grid-cols-2 sm:gap-5">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.08 }}>
          <div className="flex h-full flex-col rounded-3xl border border-blue-200/50 bg-gradient-to-br from-blue-50/50 via-white to-white p-6 dark:border-blue-900/30 dark:from-blue-950/20 dark:via-neutral-900 dark:to-neutral-900">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-500 shadow-sm dark:bg-blue-600">
                <Target className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-[11px] font-bold uppercase tracking-widest text-blue-600/80 dark:text-blue-400/80">Mission</h2>
                <p className="text-[11px] text-neutral-400/70 dark:text-neutral-500/70">Your purpose</p>
              </div>
            </div>
            <div className="mt-5 flex-1">
              <InlineEditText
                value={mission}
                onSave={setMission}
                multiline
                placeholder="How you bring your vision to life..."
              />
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.14 }}>
          <div className="flex h-full flex-col rounded-3xl border border-purple-200/50 bg-gradient-to-br from-purple-50/50 via-white to-white p-6 dark:border-purple-900/30 dark:from-purple-950/20 dark:via-neutral-900 dark:to-neutral-900">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-purple-500 shadow-sm dark:bg-purple-600">
                <Shield className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-[11px] font-bold uppercase tracking-widest text-purple-600/80 dark:text-purple-400/80">Identity</h2>
                <p className="text-[11px] text-neutral-400/70 dark:text-neutral-500/70">Who you are</p>
              </div>
            </div>
            <div className="mt-5 flex-1">
              <InlineEditText
                value={identity}
                onSave={setIdentity}
                multiline
                placeholder="Who you are at your core..."
              />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Core Pillars */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.2 }}>
        <div className="rounded-3xl border border-neutral-200/60 bg-white p-6 sm:p-8 dark:border-neutral-800/60 dark:bg-neutral-900">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-400 shadow-sm">
                <Gem className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-[11px] font-bold uppercase tracking-widest text-neutral-500 dark:text-neutral-400">Core Pillars</h2>
                <p className="text-[11px] text-neutral-400/70 dark:text-neutral-500/70">What guides you</p>
              </div>
            </div>
            <Button size="sm" className="gap-1.5 rounded-xl" onClick={() => setPillarDialog({ open: true })}>
              <Plus className="h-3.5 w-3.5" /> Add
            </Button>
          </div>

          {pillars.length === 0 ? (
            <div className="mt-8 flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-neutral-200 py-12 dark:border-neutral-800">
              <Gem className="mb-3 h-9 w-9 text-neutral-300 dark:text-neutral-600" />
              <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">No pillars yet</p>
              <p className="mt-1 text-xs text-neutral-400 dark:text-neutral-500">Add the core principles that guide everything</p>
              <Button variant="outline" size="sm" className="mt-4 gap-1.5" onClick={() => setPillarDialog({ open: true })}>
                <Plus className="h-3.5 w-3.5" /> Add first pillar
              </Button>
            </div>
          ) : (
            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <AnimatePresence mode="popLayout">
                {pillars.map((pillar) => (
                  <PillarCard
                    key={pillar.id}
                    pillar={pillar}
                    onEdit={() => setPillarDialog({ open: true, pillar })}
                    onDelete={() => deletePillar(pillar.id)}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </motion.div>

      {/* Pillar dialog */}
      <PillarDialog
        open={pillarDialog.open}
        onOpenChange={(o) => setPillarDialog({ open: o })}
        pillar={pillarDialog.pillar}
        onSave={(data) => {
          if (pillarDialog.pillar) {
            updatePillar(pillarDialog.pillar.id, data)
          } else {
            addPillar(data)
          }
        }}
      />
    </div>
  )
}
