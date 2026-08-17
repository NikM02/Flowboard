"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Star, Plus, Trash2, Pencil, Check, Image as ImageIcon,
  Calendar, Clock, Sparkles, ArrowLeft, Filter,
} from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/shadcn-utils"
import { Button } from "@/components/ui/button"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { useBucketListStore } from "@/store/use-bucket-list-store"
import type { BucketListItem } from "@/types"

const timeframes = [
  "1 month",
  "3 months",
  "6 months",
  "1 year",
  "2 years",
  "5 years",
  "Someday",
]

type FilterType = "all" | "pending" | "completed"

function WishDialog({
  open,
  onOpenChange,
  item,
  onSave,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  item?: BucketListItem
  onSave: (data: { title: string; description: string; imageUrl: string; expectedDate: string; timeframe: string }) => void
}) {
  const [title, setTitle] = useState(item?.title ?? "")
  const [description, setDescription] = useState(item?.description ?? "")
  const [imageUrl, setImageUrl] = useState(item?.imageUrl ?? "")
  const [expectedDate, setExpectedDate] = useState(item?.expectedDate ?? "")
  const [timeframe, setTimeframe] = useState(item?.timeframe ?? "6 months")

  const handleSave = () => {
    if (!title.trim()) return
    onSave({
      title: title.trim(),
      description: description.trim(),
      imageUrl: imageUrl.trim(),
      expectedDate,
      timeframe,
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{item ? "Edit Wish" : "New Wish"}</DialogTitle>
          <DialogDescription>
            {item ? "Update your bucket list wish." : "Add something you dream of experiencing."}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="wish-title">Title *</Label>
            <Input
              id="wish-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Visit Japan"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="wish-desc">Description</Label>
            <Textarea
              id="wish-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="What makes this special to you?"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="wish-image">Image URL</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <ImageIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                <Input
                  id="wish-image"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://example.com/photo.jpg"
                  className="pl-9"
                />
              </div>
            </div>
            {imageUrl && (
              <div className="mt-2 overflow-hidden rounded-xl border border-neutral-200 dark:border-neutral-800">
                <img
                  src={imageUrl}
                  alt="Preview"
                  className="h-32 w-full object-cover"
                  onError={(e) => {
                    ;(e.target as HTMLImageElement).style.display = "none"
                  }}
                />
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="wish-date">Target Date</Label>
              <Input
                id="wish-date"
                type="date"
                value={expectedDate}
                onChange={(e) => setExpectedDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Timeframe</Label>
              <Select value={timeframe} onValueChange={setTimeframe}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {timeframes.map((tf) => (
                    <SelectItem key={tf} value={tf}>{tf}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button className="w-full" onClick={handleSave} disabled={!title.trim()}>
            {item ? "Save Changes" : "Add to Bucket List"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function WishCard({
  item,
  onEdit,
}: {
  item: BucketListItem
  onEdit: () => void
}) {
  const { toggleComplete, deleteItem } = useBucketListStore()

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "group relative overflow-hidden rounded-2xl border bg-white transition-shadow hover:shadow-md dark:bg-neutral-900",
        item.completed
          ? "border-green-200/60 dark:border-green-900/40"
          : "border-neutral-200/60 dark:border-neutral-800/60"
      )}
    >
      {/* Image */}
      {item.imageUrl ? (
        <div className="relative h-44 overflow-hidden sm:h-48">
          <img
            src={item.imageUrl}
            alt={item.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            onError={(e) => {
              ;(e.target as HTMLImageElement).src = ""
              ;(e.target as HTMLImageElement).className = "h-full w-full bg-gradient-to-br from-neutral-100 to-neutral-200 dark:from-neutral-800 dark:to-neutral-700"
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
          {item.completed && (
            <div className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-green-500 shadow-lg">
              <Check className="h-4 w-4 text-white" />
            </div>
          )}
          {/* Actions overlay */}
          <div className="absolute right-3 top-3 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
            {!item.completed && (
              <>
                <button
                  onClick={onEdit}
                  className="flex h-7 w-7 items-center justify-center rounded-[10px] bg-white/90 text-neutral-600 shadow-sm backdrop-blur-sm transition-colors hover:bg-white"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => deleteItem(item.id)}
                  className="flex h-7 w-7 items-center justify-center rounded-[10px] bg-white/90 text-red-500 shadow-sm backdrop-blur-sm transition-colors hover:bg-white"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </>
            )}
          </div>
          {/* Timeframe badge */}
          <div className="absolute bottom-3 left-3">
            <span className="inline-flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-xs font-medium text-neutral-700 shadow-sm backdrop-blur-sm dark:bg-neutral-900/90 dark:text-neutral-300">
              <Clock className="h-3 w-3" />
              {item.timeframe}
            </span>
          </div>
        </div>
      ) : (
        <div className="relative flex h-32 items-center justify-center bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20">
          <Star className="h-10 w-10 text-amber-300 dark:text-amber-600" />
          {item.completed && (
            <div className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-green-500 shadow-lg">
              <Check className="h-4 w-4 text-white" />
            </div>
          )}
          <div className="absolute right-3 top-3 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
            {!item.completed && (
              <>
                <button
                  onClick={onEdit}
                  className="flex h-7 w-7 items-center justify-center rounded-[10px] bg-white/90 text-neutral-600 shadow-sm backdrop-blur-sm transition-colors hover:bg-white dark:bg-neutral-800/90 dark:text-neutral-300"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => deleteItem(item.id)}
                  className="flex h-7 w-7 items-center justify-center rounded-[10px] bg-white/90 text-red-500 shadow-sm backdrop-blur-sm transition-colors hover:bg-white dark:bg-neutral-800/90"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </>
            )}
          </div>
          <div className="absolute bottom-3 left-3">
            <span className="inline-flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-xs font-medium text-neutral-700 shadow-sm backdrop-blur-sm dark:bg-neutral-800/90 dark:text-neutral-300">
              <Clock className="h-3 w-3" />
              {item.timeframe}
            </span>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="p-4">
        <h3 className={cn(
          "text-base font-semibold tracking-tight",
          item.completed
            ? "text-neutral-400 line-through dark:text-neutral-600"
            : "text-neutral-900 dark:text-neutral-50"
        )}>
          {item.title}
        </h3>
        {item.description && (
          <p className="mt-1 text-sm leading-relaxed text-neutral-500 dark:text-neutral-400 line-clamp-2">
            {item.description}
          </p>
        )}
        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center gap-3 text-xs text-neutral-400 dark:text-neutral-500">
            {item.expectedDate && (
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {new Date(item.expectedDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
              </span>
            )}
          </div>
          <button
            onClick={() => toggleComplete(item.id)}
            className={cn(
              "flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-all",
              item.completed
                ? "bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400"
                : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-700"
            )}
          >
            {item.completed ? (
              <>
                <Check className="h-3 w-3" /> Done
              </>
            ) : (
              "Mark done"
            )}
          </button>
        </div>
      </div>
    </motion.div>
  )
}

export default function BucketListPage() {
  const { items, addItem, updateItem } = useBucketListStore()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editItem, setEditItem] = useState<BucketListItem | null>(null)
  const [filter, setFilter] = useState<FilterType>("all")

  const filtered = items.filter((item) => {
    if (filter === "pending") return !item.completed
    if (filter === "completed") return item.completed
    return true
  })

  const pendingCount = items.filter((i) => !i.completed).length
  const completedCount = items.filter((i) => i.completed).length

  return (
    <DashboardShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link
              href="/skills"
              className="mb-2 inline-flex items-center gap-1.5 text-sm text-neutral-500 transition-colors hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-50"
            >
              <ArrowLeft className="h-4 w-4" />
              Skills
            </Link>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">
              Bucket List
            </h1>
            <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
              Dreams, goals, and experiences you want to achieve
            </p>
          </div>
          <Button onClick={() => { setEditItem(null); setDialogOpen(true) }} className="gap-2 self-start">
            <Plus className="h-4 w-4" />
            Add Wish
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-2xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
            <p className="text-xs text-neutral-500">Total Wishes</p>
            <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-50">{items.length}</p>
          </div>
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/40 dark:bg-amber-950/20">
            <p className="text-xs text-amber-600 dark:text-amber-400">Pending</p>
            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{pendingCount}</p>
          </div>
          <div className="rounded-2xl border border-green-200 bg-green-50 p-4 dark:border-green-900/40 dark:bg-green-950/20">
            <p className="text-xs text-green-600 dark:text-green-400">Achieved</p>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">{completedCount}</p>
          </div>
        </div>

        {/* Filter */}
        <div className="flex gap-1 rounded-xl bg-neutral-100 p-1 dark:bg-neutral-800">
          {(["all", "pending", "completed"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium capitalize transition-all",
                filter === f
                  ? "bg-white text-neutral-900 shadow-sm dark:bg-neutral-900 dark:text-neutral-50"
                  : "text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
              )}
            >
              {f === "all" && <Filter className="h-3.5 w-3.5" />}
              {f}
              {f === "pending" && pendingCount > 0 && (
                <span className="ml-1 rounded-full bg-amber-100 px-1.5 text-[10px] font-semibold text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                  {pendingCount}
                </span>
              )}
              {f === "completed" && completedCount > 0 && (
                <span className="ml-1 rounded-full bg-green-100 px-1.5 text-[10px] font-semibold text-green-700 dark:bg-green-900/30 dark:text-green-400">
                  {completedCount}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Grid */}
        {filtered.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-neutral-200 py-20 dark:border-neutral-800"
          >
            <Sparkles className="mb-4 h-12 w-12 text-neutral-300 dark:text-neutral-600" />
            <p className="text-lg font-medium text-neutral-500 dark:text-neutral-400">
              {filter === "all" ? "No wishes yet" : `No ${filter} wishes`}
            </p>
            <p className="mt-1 text-sm text-neutral-400 dark:text-neutral-500">
              {filter === "all"
                ? "Start dreaming — add your first bucket list item"
                : "Try a different filter"}
            </p>
            {filter === "all" && (
              <Button
                variant="outline"
                className="mt-4 gap-2"
                onClick={() => { setEditItem(null); setDialogOpen(true) }}
              >
                <Plus className="h-4 w-4" /> Add first wish
              </Button>
            )}
          </motion.div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence mode="popLayout">
              {filtered.map((item) => (
                <WishCard
                  key={item.id}
                  item={item}
                  onEdit={() => { setEditItem(item); setDialogOpen(true) }}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      <WishDialog
        open={dialogOpen}
        onOpenChange={(o) => { setDialogOpen(o); if (!o) setEditItem(null) }}
        item={editItem ?? undefined}
        onSave={(data) => {
          if (editItem) {
            updateItem(editItem.id, data)
          } else {
            addItem(data)
          }
        }}
      />
    </DashboardShell>
  )
}
