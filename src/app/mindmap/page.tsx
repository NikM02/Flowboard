"use client"

import { useEffect, useMemo, useReducer, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { motion, AnimatePresence } from "framer-motion"
import {
  MousePointer2, Hand, Type, StickyNote, ListChecks, Workflow,
  Undo2, Redo2, Trash2, ZoomIn, ZoomOut, Maximize2, Share2, Plus,
  ArchiveRestore, ClipboardCopy, Check, X, Archive, FileDown, Sparkles, Pencil,
} from "lucide-react"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useMindmapStore } from "@/store/use-mindmap-store"
import { cn } from "@/lib/shadcn-utils"
import type { MindmapBoard, MindmapNode, MindmapNodeType, MindmapEdge } from "@/types"

const WORLD = 6000
const PAD = 80
const MIN_ZOOM = 0.25
const MAX_ZOOM = 2.5

const COLORS = [
  "#FDE047", "#F87171", "#FB923C", "#4ADE80", "#22D3EE", "#60A5FA",
  "#818CF8", "#A78BFA", "#F472B6", "#94A3B8", "#6366F1", "#0EA5E9", "#10B981",
]

const TYPE_CONFIG: Record<MindmapNodeType, { w: number; h: number; color: string; label: string }> = {
  idea: { w: 168, h: 64, color: "#6366F1", label: "Text" },
  sticky: { w: 184, h: 96, color: "#FDE047", label: "Sticky" },
  task: { w: 208, h: 56, color: "#10B981", label: "Task" },
  title: { w: 280, h: 56, color: "#6366F1", label: "Title" },
}

type Tool = "select" | "hand" | "text" | "sticky" | "task" | "connector"

function getTextColor(hex: string) {
  const c = hex.replace("#", "")
  if (c.length !== 6) return "#1f2937"
  const r = parseInt(c.slice(0, 2), 16)
  const g = parseInt(c.slice(2, 4), 16)
  const b = parseInt(c.slice(4, 6), 16)
  const lum = 0.299 * r + 0.587 * g + 0.114 * b
  return lum > 160 ? "#1f2937" : "#ffffff"
}

function snapshot(b: MindmapBoard): MindmapBoard {
  return JSON.parse(JSON.stringify(b))
}

function nodeCenter(n: MindmapNode) {
  return { x: n.x + n.w / 2, y: n.y + n.h / 2 }
}

function boardBounds(board: MindmapBoard) {
  if (!board.nodes.length) return { x: 0, y: 0, w: 0, h: 0 }
  const xs = board.nodes.map((n) => n.x)
  const ys = board.nodes.map((n) => n.y)
  const xe = board.nodes.map((n) => n.x + n.w)
  const ye = board.nodes.map((n) => n.y + n.h)
  return { x: Math.min(...xs), y: Math.min(...ys), w: Math.max(...xe) - Math.min(...xs), h: Math.max(...ye) - Math.min(...ys) }
}

function ToolButton({
  active, onClick, title, children,
}: { active?: boolean; onClick: () => void; title: string; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={cn(
        "flex h-8 w-8 items-center justify-center rounded-lg text-neutral-500 transition-all",
        active
          ? "bg-indigo-500 text-white shadow-sm"
          : "hover:bg-neutral-100 hover:text-neutral-900 dark:hover:bg-neutral-800 dark:hover:text-neutral-100"
      )}
    >
      {children}
    </button>
  )
}

/* ── Node Editor (inline) ───────────────────────────── */
function NodeEditor({
  node, onCommit, onCancel,
}: { node: MindmapNode; onCommit: (v: string) => void; onCancel: () => void }) {
  const [v, setV] = useState(node.title)
  const ref = useRef<HTMLTextAreaElement>(null)
  useEffect(() => {
    ref.current?.focus()
    ref.current?.select()
  }, [])
  return (
    <textarea
      ref={ref}
      value={v}
      onChange={(e) => setV(e.target.value)}
      onBlur={() => onCommit(v)}
      onKeyDown={(e) => {
        if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onCommit(v) }
        if (e.key === "Escape") { e.preventDefault(); onCancel() }
      }}
      className="h-full w-full resize-none rounded-lg bg-white/90 p-2 text-sm font-medium text-neutral-900 outline-none ring-2 ring-indigo-400"
      style={{ color: undefined }}
    />
  )
}

/* ── Node view on canvas ────────────────────────────── */
function NodeView({
  node, selected, editing, zoom,
  onPointerDown, onDoubleClick, onEditCommit, onEditCancel,
  onAddChild, onAddSibling, onToggleCheck,
}: {
  node: MindmapNode
  selected: boolean
  editing: boolean
  zoom: number
  onPointerDown: (e: React.PointerEvent, id: string) => void
  onDoubleClick: (id: string) => void
  onEditCommit: (v: string) => void
  onEditCancel: () => void
  onAddChild: (id: string) => void
  onAddSibling: (id: string) => void
  onToggleCheck: (id: string) => void
}) {
  const isSticky = node.type === "sticky"
  const isTitle = node.type === "title"
  const isTask = node.type === "task"
  const bg = isTitle ? "transparent" : node.color
  const fg = getTextColor(node.color)

  return (
    <div
      className={cn(
        "absolute select-none",
        isSticky && "rotate-1 shadow-md",
        !isTitle && "rounded-2xl border-2 shadow-sm",
        selected && "ring-2 ring-indigo-400 ring-offset-2 ring-offset-white dark:ring-offset-neutral-950",
        node.type === "idea" && "p-3",
        node.type === "title" && "p-2",
      )}
      style={{
        left: node.x, top: node.y, width: node.w, height: node.h,
        background: bg,
        borderColor: isTitle ? "transparent" : isTask ? node.color : "transparent",
        color: isTitle ? undefined : fg,
        cursor: "grab",
      }}
      onPointerDown={(e) => onPointerDown(e, node.id)}
      onDoubleClick={(e) => { e.stopPropagation(); onDoubleClick(node.id) }}
    >
      {editing ? (
        <NodeEditor node={node} onCommit={onEditCommit} onCancel={onEditCancel} />
      ) : (
        <div className={cn("flex h-full w-full items-start gap-2", isTitle && "items-center")}>
          {isTask && (
            <button
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => { e.stopPropagation(); onToggleCheck(node.id) }}
              className={cn(
                "mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-md border-2 transition-colors",
                node.checked ? "border-transparent" : "border-neutral-300"
              )}
              style={{ backgroundColor: node.checked ? node.color : "transparent" }}
            >
              {node.checked && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
            </button>
          )}
          <div className="flex min-w-0 flex-1 flex-col justify-center gap-0.5">
            <span className={cn(
              "break-words leading-snug",
              isTitle ? "text-lg font-bold tracking-tight" : "text-sm font-semibold",
              isTask && "font-medium"
            )}>
              {node.title}
            </span>
            {node.notes && !isTask && node.type !== "title" && (
              <span className={cn("line-clamp-2 text-[11px] leading-snug", isSticky ? "text-amber-900/70" : "opacity-70")}>
                {node.notes}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Add handles */}
      {selected && !editing && !isTitle && (
        <>
          <button
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => { e.stopPropagation(); onAddChild(node.id) }}
            title="Add child"
            className="absolute -bottom-3.5 left-1/2 flex h-6 w-6 -translate-x-1/2 items-center justify-center rounded-full border border-indigo-200 bg-white text-indigo-500 shadow-md transition-transform hover:scale-110 dark:border-neutral-700 dark:bg-neutral-900"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
          {node.type !== "sticky" && (
            <button
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => { e.stopPropagation(); onAddSibling(node.id) }}
              title="Add sibling"
              className="absolute -right-3.5 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full border border-indigo-200 bg-white text-indigo-500 shadow-md transition-transform hover:scale-110 dark:border-neutral-700 dark:bg-neutral-900"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          )}
        </>
      )}
      <span className="sr-only">{zoom}</span>
    </div>
  )
}

/* ── Inspector ──────────────────────────────────────── */
function Inspector({
  board, node, edge, zoom,
  onApplyColor, onAddChild, onAddSibling, onDuplicate, onDelete, onClose,
  onUpdateNode, onUpdateEdge, onDeleteEdge,
}: {
  board: MindmapBoard
  node: MindmapNode | null
  edge: MindmapEdge | null
  zoom: number
  onApplyColor: (c: string) => void
  onAddChild: () => void
  onAddSibling: () => void
  onDuplicate: () => void
  onDelete: () => void
  onClose: () => void
  onUpdateNode: (updates: Partial<MindmapNode>) => void
  onUpdateEdge: (updates: Partial<MindmapEdge>) => void
  onDeleteEdge: () => void
}) {
  if (!node && !edge) return null
  const hide = !node && !edge
  return (
    <motion.aside
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: hide ? 0 : 1, x: hide ? 20 : 0 }}
      className={cn(
        "absolute bottom-3 right-3 top-3 z-20 w-64 shrink-0 overflow-y-auto rounded-2xl border border-neutral-200 bg-white p-3 shadow-xl shadow-neutral-900/10 dark:border-neutral-800 dark:bg-neutral-900",
        hide && "pointer-events-none"
      )}
    >
      <span className="sr-only">{zoom}</span>
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
          {node ? "Node" : "Connection"}
        </p>
        <button onClick={onClose} className="rounded-lg p-1 text-neutral-400 hover:text-neutral-600">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {node && (
        <div className="mt-3 space-y-3">
          <Input
            value={node.title}
            onChange={(e) => onUpdateNode({ title: e.target.value })}
            className="h-9 rounded-xl text-sm font-semibold"
            placeholder="Title"
          />
          {node.type !== "task" && node.type !== "title" && (
            <Textarea
              value={node.notes}
              onChange={(e) => onUpdateNode({ notes: e.target.value })}
              rows={3}
              className="rounded-xl text-xs"
              placeholder="Add notes…"
            />
          )}

          <div>
            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-neutral-400">Color</p>
            <div className="flex flex-wrap gap-1.5">
              {COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => onApplyColor(c)}
                  className={cn(
                    "h-5 w-5 rounded-full border border-black/10 transition-transform hover:scale-110",
                    node.color === c && "ring-2 ring-indigo-400 ring-offset-1 ring-offset-white dark:ring-offset-neutral-900"
                  )}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <Button size="sm" onClick={onAddChild} className="rounded-xl"><Plus className="h-3.5 w-3.5" /> Child</Button>
            <Button size="sm" variant="outline" onClick={onAddSibling} className="rounded-xl"><Plus className="h-3.5 w-3.5" /> Sibling</Button>
            <Button size="sm" variant="outline" onClick={onDuplicate} className="rounded-xl">Duplicate</Button>
            <Button size="sm" variant="outline" onClick={onDelete} className="rounded-xl text-red-500 hover:text-red-600"><Trash2 className="h-3.5 w-3.5" /> Delete</Button>
          </div>
        </div>
      )}

      {edge && (
        <div className="mt-3 space-y-3">
          <Input
            value={edge.label}
            onChange={(e) => onUpdateEdge({ label: e.target.value })}
            className="h-9 rounded-xl text-sm"
            placeholder="Label (optional)"
          />
          <Button size="sm" variant="outline" onClick={onDeleteEdge} className="w-full rounded-xl text-red-500 hover:text-red-600">
            <Trash2 className="h-3.5 w-3.5" /> Delete connection
          </Button>
        </div>
      )}
    </motion.aside>
  )
}

/* ── Canvas ─────────────────────────────────────────── */
function Canvas({
  board, tool, selected, selectedEdge, editingId,
  setTool, setSelected, setSelectedEdge, setEditingId,
  onCommit, onUndo, onRedo,
  linkSource, setLinkSource,
}: {
  board: MindmapBoard
  tool: Tool
  selected: string | null
  selectedEdge: string | null
  editingId: string | null
  setTool: (t: Tool) => void
  setSelected: (id: string | null) => void
  setSelectedEdge: (id: string | null) => void
  setEditingId: (id: string | null) => void
  onCommit: () => void
  onUndo: () => void
  onRedo: () => void
  linkSource: string | null
  setLinkSource: (id: string | null) => void
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const panRef = useRef(pan)
  const zoomRef = useRef(zoom)
  const dragRef = useRef<null | {
    mode: "pan" | "node"
    startClientX: number
    startClientY: number
    startPan: { x: number; y: number }
    nodeId?: string
    startX?: number
    startY?: number
    committed?: boolean
  }>(null)

  useEffect(() => { panRef.current = pan }, [pan])
  useEffect(() => { zoomRef.current = zoom }, [zoom])

  const store = useMindmapStore

  const fitView = () => {
    const el = containerRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const b = boardBounds(board)
    let z = 1
    if (b.w > 0 && b.h > 0) {
      z = Math.min((rect.width - 60) / (b.w + PAD), (rect.height - 60) / (b.h + PAD), 1.2)
    }
    z = Math.max(Math.min(z, MAX_ZOOM), 0.35)
    const cx = b.x + b.w / 2
    const cy = b.y + b.h / 2
    setZoom(z)
    setPan({ x: rect.width / 2 - cx * z, y: rect.height / 2 - cy * z })
  }

  useEffect(() => {
    fitView()
    setSelected(null)
    setSelectedEdge(null)
    setEditingId(null)
    setLinkSource(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [board.id])

  const zoomAt = (clientX: number, clientY: number, factor: number) => {
    const el = containerRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const next = Math.min(Math.max(zoomRef.current * factor, MIN_ZOOM), MAX_ZOOM)
    const worldX = (clientX - rect.left - panRef.current.x) / zoomRef.current
    const worldY = (clientY - rect.top - panRef.current.y) / zoomRef.current
    setZoom(next)
    setPan({ x: clientX - rect.left - worldX * next, y: clientY - rect.top - worldY * next })
  }

  // Wheel: pan, or zoom on ctrl/cmd (trackpad pinch)
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      if (e.ctrlKey || e.metaKey) {
        const factor = e.deltaY < 0 ? 1.12 : 1 / 1.12
        zoomAt(e.clientX, e.clientY, factor)
      } else {
        setPan((p) => ({ x: p.x - e.deltaX, y: p.y - e.deltaY }))
      }
    }
    el.addEventListener("wheel", onWheel, { passive: false })
    return () => el.removeEventListener("wheel", onWheel)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [board.id])

  const worldFromEvent = (e: React.PointerEvent) => {
    const rect = containerRef.current!.getBoundingClientRect()
    return {
      x: (e.clientX - rect.left - panRef.current.x) / zoomRef.current,
      y: (e.clientY - rect.top - panRef.current.y) / zoomRef.current,
    }
  }

  const placeNode = (e: React.PointerEvent, t: Tool) => {
    const type: MindmapNodeType = t === "text" ? "idea" : t === "sticky" ? "sticky" : "task"
    const cfg = TYPE_CONFIG[type]
    const wpt = worldFromEvent(e)
    onCommit()
    store.getState().addNode(board.id, {
      type,
      title: type === "task" ? "New task" : type === "sticky" ? "Sticky note" : "Idea",
      notes: "",
      x: wpt.x - cfg.w / 2,
      y: wpt.y - cfg.h / 2,
      color: cfg.color,
    })
    setTool("select")
  }

  const handleConnectorClick = (id: string) => {
    if (!linkSource) { setLinkSource(id); return }
    if (linkSource === id) { setLinkSource(null); return }
    onCommit()
    store.getState().addEdge(board.id, linkSource, id)
    setLinkSource(null)
  }

  const onBackgroundDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return
    if (tool === "connector") { setLinkSource(null); setSelected(null); setSelectedEdge(null); return }
    if (tool !== "select" && tool !== "hand") {
      placeNode(e, tool)
      return
    }
    setSelected(null)
    setSelectedEdge(null)
    dragRef.current = {
      mode: "pan",
      startClientX: e.clientX,
      startClientY: e.clientY,
      startPan: { x: panRef.current.x, y: panRef.current.y },
    }
    containerRef.current!.setPointerCapture(e.pointerId)
  }

  const onNodeDown = (e: React.PointerEvent, id: string) => {
    e.stopPropagation()
    if (tool === "connector") { handleConnectorClick(id); return }
    setSelected(id)
    setSelectedEdge(null)
    setEditingId(null)
    if (tool === "select") {
      const n = board.nodes.find((x) => x.id === id)
      if (!n) return
      dragRef.current = {
        mode: "node",
        startClientX: e.clientX,
        startClientY: e.clientY,
        startPan: { x: panRef.current.x, y: panRef.current.y },
        nodeId: id,
        startX: n.x,
        startY: n.y,
        committed: false,
      }
      containerRef.current!.setPointerCapture(e.pointerId)
    }
  }

  const onPointerMove = (e: React.PointerEvent) => {
    const d = dragRef.current
    if (!d) return
    if (d.mode === "pan") {
      setPan({ x: d.startPan.x + (e.clientX - d.startClientX), y: d.startPan.y + (e.clientY - d.startClientY) })
    } else if (d.mode === "node" && d.nodeId && d.startX !== undefined && d.startY !== undefined) {
      const dx = (e.clientX - d.startClientX) / zoomRef.current
      const dy = (e.clientY - d.startClientY) / zoomRef.current
      if (!d.committed) {
        d.committed = true
        onCommit()
      }
      store.getState().updateNode(board.id, d.nodeId, { x: d.startX + dx, y: d.startY + dy })
    }
  }

  const onPointerUp = () => {
    dragRef.current = null
  }

  const nodeById = useMemo(() => new Map(board.nodes.map((n) => [n.id, n])), [board.nodes])
  const nodeOf = (id: string) => nodeById.get(id)

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative h-[calc(100dvh-300px)] min-h-[440px] w-full select-none overflow-hidden rounded-2xl border border-neutral-200 bg-[#fafafa] dark:border-neutral-800 dark:bg-[#0a0a0a]",
        tool === "hand" ? "cursor-grab active:cursor-grabbing" : tool !== "select" && "cursor-crosshair"
      )}
      style={{ touchAction: "none" }}
      onPointerDown={onBackgroundDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    >
      {/* Dot grid */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          backgroundImage: "radial-gradient(circle, rgba(0,0,0,0.08) 1px, transparent 1px)",
          backgroundSize: "26px 26px",
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 dark:hidden"
        style={{ background: "linear-gradient(180deg, transparent 40%, rgba(255,255,255,0.6))" }}
      />

      {/* World layer */}
      <div
        className="absolute left-0 top-0"
        style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, transformOrigin: "0 0" }}
      >
        <svg
          className="absolute"
          width={WORLD}
          height={WORLD}
          style={{ left: -WORLD / 2, top: -WORLD / 2 }}
        >
          <defs>
            <marker id="arrowhead" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#94a3b8" />
            </marker>
          </defs>
          {board.edges.map((edge) => {
            const a = nodeOf(edge.from)
            const b = nodeOf(edge.to)
            if (!a || !b) return null
            const c1 = nodeCenter(a)
            const c2 = nodeCenter(b)
            const mx = (c1.x + c2.x) / 2
            const my = (c1.y + c2.y) / 2
            const isSelected = selectedEdge === edge.id
            const x1 = c1.x + Math.sign(c2.x - c1.x || 1) * a.w / 2
            const y1 = c1.y + Math.sign(c2.y - c1.y || 1) * a.h / 2
            const x2 = c2.x - Math.sign(c2.x - c1.x || 1) * b.w / 2
            const y2 = c2.y - Math.sign(c2.y - c1.y || 1) * b.h / 2
            return (
              <g
                key={edge.id}
                onPointerDown={(e) => { e.stopPropagation(); setSelectedEdge(edge.id); setSelected(null) }}
                className="cursor-pointer"
              >
                <path
                  d={`M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`}
                  fill="none"
                  stroke="transparent"
                  strokeWidth={14}
                />
                <path
                  d={`M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`}
                  fill="none"
                  stroke={isSelected ? "#818cf8" : "#94a3b8"}
                  strokeWidth={isSelected ? 2.5 : 2}
                  markerEnd="url(#arrowhead)"
                />
                {edge.label && (
                  <text x={mx} y={my - 6} textAnchor="middle" fontSize={12} fill="#737373"
                    style={{ paintOrder: "stroke", stroke: "#fff", strokeWidth: 3 }}
                    onPointerDown={(e) => { e.stopPropagation(); setSelectedEdge(edge.id) }}
                  >
                    {edge.label}
                  </text>
                )}
              </g>
            )
          })}
        </svg>

        {board.nodes.map((n) => (
          <NodeView
            key={n.id}
            node={n}
            selected={selected === n.id}
            editing={editingId === n.id}
            zoom={zoom}
            onPointerDown={onNodeDown}
            onDoubleClick={(id) => { setEditingId(id) }}
            onEditCommit={(v) => { store.getState().updateNode(board.id, n.id, { title: v }); setEditingId(null) }}
            onEditCancel={() => setEditingId(null)}
            onAddChild={(id) => {
              const p = nodeOf(id); if (!p) return
              onCommit()
              const child = store.getState().addNode(board.id, {
                type: p.type === "title" ? "idea" : p.type,
                title: "New idea",
                notes: "",
                x: p.x + p.w / 2 - 84 + (Math.random() * 40 - 20),
                y: p.y + p.h + 70,
                color: p.type === "sticky" ? p.color : p.color,
              })
              store.getState().addEdge(board.id, id, child.id)
              setSelected(child.id)
            }}
            onAddSibling={(id) => {
              const p = nodeOf(id); if (!p) return
              onCommit()
              const parent = board.edges.find((e) => e.to === id)?.from ?? id
              const sib = store.getState().addNode(board.id, {
                type: p.type === "title" ? "idea" : p.type,
                title: "New idea",
                notes: "",
                x: p.x + p.w + 90,
                y: p.y + (Math.random() * 40 - 20),
                color: p.type === "sticky" ? p.color : p.color,
              })
              store.getState().addEdge(board.id, parent, sib.id)
              setSelected(sib.id)
            }}
            onToggleCheck={(id) => {
              const target = nodeOf(id); if (!target) return
              onCommit()
              store.getState().updateNode(board.id, id, { checked: !target.checked })
            }}
          />
        ))}

        {linkSource && nodeOf(linkSource) && (
          <div
            className="absolute z-10 flex h-5 items-center gap-1 rounded-full border border-indigo-300 bg-indigo-50 px-2 text-[10px] font-semibold text-indigo-600 shadow-sm"
            style={{
              left: nodeOf(linkSource)!.x + nodeOf(linkSource)!.w / 2 - 30,
              top: nodeOf(linkSource)!.y - 22,
            }}
          >
            <Workflow className="h-3 w-3" /> click target
          </div>
        )}
      </div>

      {/* Zoom controls */}
      <div className="absolute bottom-3 left-3 z-20 flex items-center gap-0.5 rounded-xl border border-neutral-200 bg-white p-1 shadow-lg dark:border-neutral-800 dark:bg-neutral-900">
        <ToolButton title="Zoom out" onClick={() => zoomAt(containerRef.current?.getBoundingClientRect().left ?? 0 + 400, containerRef.current?.getBoundingClientRect().top ?? 0 + 300, 1 / 1.2)}>
          <ZoomOut className="h-4 w-4" />
        </ToolButton>
        <span className="w-10 text-center text-[11px] font-semibold tabular-nums text-neutral-500">{Math.round(zoom * 100)}%</span>
        <ToolButton title="Zoom in" onClick={() => zoomAt(containerRef.current?.getBoundingClientRect().left ?? 0 + 400, containerRef.current?.getBoundingClientRect().top ?? 0 + 300, 1.2)}>
          <ZoomIn className="h-4 w-4" />
        </ToolButton>
        <div className="mx-0.5 h-5 w-px bg-neutral-200 dark:bg-neutral-700" />
        <ToolButton title="Fit to view" onClick={fitView}>
          <Maximize2 className="h-4 w-4" />
        </ToolButton>
      </div>
    </div>
  )
}

/* ── Archive ────────────────────────────────────────── */
function ArchiveView({
  boards, onRestore, onDelete, onExport,
}: {
  boards: MindmapBoard[]
  onRestore: (id: string) => void
  onDelete: (id: string) => void
  onExport: (b: MindmapBoard) => void
}) {
  if (boards.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-neutral-300 py-16 text-neutral-400 dark:border-neutral-700">
        <Archive className="h-10 w-10 text-neutral-300 dark:text-neutral-600" />
        <p className="text-sm">No archived boards.</p>
      </div>
    )
  }
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {boards.map((b) => (
        <div key={b.id} className="card-modern card-hover rounded-2xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-neutral-100 text-neutral-500 dark:bg-neutral-800">
                <Workflow className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <h3 className="truncate text-sm font-bold tracking-tight text-neutral-900 dark:text-neutral-50">{b.title}</h3>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                  {b.nodes.length} nodes · {b.edges.length} connections
                </p>
              </div>
            </div>
            <div className="flex shrink-0 gap-1">
              <button onClick={() => onRestore(b.id)} title="Restore" className="rounded-lg p-1.5 text-neutral-400 hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-950/40">
                <ArchiveRestore className="h-3.5 w-3.5" />
              </button>
              <button onClick={() => onDelete(b.id)} title="Delete permanently" className="rounded-lg p-1.5 text-neutral-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/40">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
          <Button size="sm" variant="outline" onClick={() => onExport(b)} className="mt-3 w-full gap-2 rounded-xl">
            <FileDown className="h-3.5 w-3.5" /> Export PDF
          </Button>
        </div>
      ))}
    </div>
  )
}

/* ── Print / PDF view (portal to body) ──────────────── */
function PrintView({ board }: { board: MindmapBoard | null }) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  if (!mounted || !board) return null

  const b = boardBounds(board)
  const offX = b.x - PAD
  const offY = b.y - PAD
  const W = Math.max(b.w + PAD * 2, 300)
  const H = Math.max(b.h + PAD * 2, 200)

  return createPortal(
    <div className="print-only">
      <div className="pb-6 text-center">
        <h1 className="text-xl font-bold tracking-tight text-neutral-900">{board.title}</h1>
        <p className="text-xs text-neutral-400">Generated by Nexus · {new Date().toLocaleDateString()}</p>
      </div>
      <div className="relative" style={{ width: W, height: H }}>
        <svg className="absolute left-0 top-0" width={W} height={H} style={{ overflow: "visible" }}>
          {board.edges.map((edge) => {
            const a = board.nodes.find((n) => n.id === edge.from)
            const b2 = board.nodes.find((n) => n.id === edge.to)
            if (!a || !b2) return null
            const c1 = { x: a.x - offX + a.w / 2, y: a.y - offY + a.h / 2 }
            const c2 = { x: b2.x - offX + b2.w / 2, y: b2.y - offY + b2.h / 2 }
            const mx = (c1.x + c2.x) / 2
            const my = (c1.y + c2.y) / 2
            return (
              <g key={edge.id}>
                <path
                  d={`M ${c1.x} ${c1.y} C ${mx} ${c1.y}, ${mx} ${c2.y}, ${c2.x} ${c2.y}`}
                  fill="none"
                  stroke="#94a3b8"
                  strokeWidth={1.5}
                  markerEnd="url(#print-arrow)"
                />
                {edge.label && (
                  <text x={mx} y={my - 5} textAnchor="middle" fontSize={10} fill="#525252">{edge.label}</text>
                )}
              </g>
            )
          })}
          <defs>
            <marker id="print-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#94a3b8" />
            </marker>
          </defs>
        </svg>

        {board.nodes.map((n) => {
          const isSticky = n.type === "sticky"
          const isTitle = n.type === "title"
          const bg = isTitle ? "transparent" : n.color
          return (
            <div
              key={n.id}
              className={cn(
                "absolute flex flex-col justify-center rounded-xl border-2 p-3",
                isSticky && "rotate-1 shadow-sm"
              )}
              style={{
                left: n.x - offX, top: n.y - offY, width: n.w, height: n.h,
                background: bg,
                borderColor: isTitle ? "transparent" : n.type === "task" ? n.color : "transparent",
                color: isTitle ? "#171717" : getTextColor(n.color),
                breakInside: "avoid",
                pageBreakInside: "avoid",
              }}
            >
              <div className={cn("flex items-center gap-1.5", isTitle && "text-base")}>
                {n.type === "task" && (
                  <span
                    className={cn("flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-sm border-2 text-[8px] font-bold", n.checked ? "" : "border-current opacity-40")}
                    style={n.checked ? { backgroundColor: n.color, borderColor: n.color, color: "#fff" } : undefined}
                  >
                    {n.checked && "✓"}
                  </span>
                )}
                <span className={cn(isTitle ? "text-base font-bold" : "text-[11px] font-semibold", isSticky && "text-sm")}>
                  {n.title}
                </span>
              </div>
              {n.notes && !isTitle && (
                <span className="mt-0.5 line-clamp-3 text-[9px] leading-snug opacity-70">{n.notes}</span>
              )}
            </div>
          )
        })}
      </div>
    </div>,
    document.body
  )
}

/* ── Page ───────────────────────────────────────────── */
export default function MindmapPage() {
  const boards = useMindmapStore((s) => s.boards)
  const activeBoardId = useMindmapStore((s) => s.activeBoardId)
  const [tab, setTab] = useState<"canvas" | "archive">("canvas")
  const [tool, setTool] = useState<Tool>("select")
  const [selected, setSelected] = useState<string | null>(null)
  const [selectedEdge, setSelectedEdge] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [linkSource, setLinkSource] = useState<string | null>(null)
  const [printBoardId, setPrintBoardId] = useState<string | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const histRef = useRef<{ past: MindmapBoard[]; future: MindmapBoard[] }>({ past: [], future: [] })
  const [, force] = useReducer((x: number) => x + 1, 0)

  const active = boards.find((b) => b.id === activeBoardId) ?? boards.find((b) => !b.archived) ?? null
  const archived = boards.filter((b) => b.archived)
  const printBoard = printBoardId ? boards.find((b) => b.id === printBoardId) ?? active : active

  const commit = (board: MindmapBoard) => {
    histRef.current = { past: [...histRef.current.past.slice(-39), snapshot(board)], future: [] }
  }

  const undo = () => {
    const h = histRef.current
    if (!h.past.length) return
    const cur = useMindmapStore.getState().getBoard(printBoard?.id ?? null) ?? null
    const prev = h.past[h.past.length - 1]
    histRef.current = { past: h.past.slice(0, -1), future: cur ? [snapshot(cur), ...h.future].slice(0, 40) : h.future }
    useMindmapStore.setState((s) => ({ boards: s.boards.map((x) => (x.id === prev.id ? prev : x)) }))
    setSelected((sel) => (prev.nodes.some((n) => n.id === sel) ? sel : null))
    setSelectedEdge(null)
    force()
  }

  const redo = () => {
    const h = histRef.current
    if (!h.future.length) return
    const next = h.future[0]
    histRef.current = { past: [...h.past, snapshot(next)], future: h.future.slice(1) }
    useMindmapStore.setState((s) => ({ boards: s.boards.map((x) => (x.id === next.id ? next : x)) }))
    setSelected(null)
    setSelectedEdge(null)
    force()
  }

  // Seed a first board when nothing exists
  useEffect(() => {
    const st = useMindmapStore.getState()
    if (st.boards.length === 0) {
      const b = st.createBoard("Launch week")
      st.addNode(b.id, {
        type: "idea", title: "Central idea", notes: "Break it down, add branches with the + handles.",
        x: -90, y: -40, color: "#6366F1",
      })
      setSelected(null)
    }
  }, [])

  // Click-outside for export menu
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    window.addEventListener("mousedown", onClick)
    return () => window.removeEventListener("mousedown", onClick)
  }, [])

  const node = selected ? active?.nodes.find((n) => n.id === selected) ?? null : null
  const edge = selectedEdge ? active?.edges.find((e) => e.id === selectedEdge) ?? null : null

  const deleteSelected = () => {
    if (!active) return
    if (selected) {
      commit(active)
      useMindmapStore.getState().deleteNode(active.id, selected)
      setSelected(null)
    } else if (selectedEdge) {
      commit(active)
      useMindmapStore.getState().deleteEdge(active.id, selectedEdge)
      setSelectedEdge(null)
    }
  }

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = document.activeElement?.tagName ?? ""
      if (t === "INPUT" || t === "TEXTAREA" || (document.activeElement as HTMLElement | null)?.isContentEditable) return
      if (e.key === "Delete" || e.key === "Backspace") { deleteSelected() }
      else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "z") { e.shiftKey ? redo() : undo() }
      else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "y") { redo() }
      else if (e.key === "Escape") { setSelected(null); setSelectedEdge(null); setLinkSource(null); setEditingId(null) }
      else if (e.key === "Enter" && selected && active?.nodes.some((n) => n.id === selected)) { setEditingId(selected) }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, selectedEdge, active])

  const boardToText = (b: MindmapBoard) => {
    const lines: string[] = [b.title, "=".repeat(Math.max(b.title.length, 1)), ""]
    const visited = new Set<string>()
    const roots = b.nodes.filter((n) => !b.edges.some((e) => e.to === n.id))
    const walk = (id: string, depth: number) => {
      const n = b.nodes.find((x) => x.id === id)
      if (!n || visited.has(id)) return
      visited.add(id)
      lines.push("  ".repeat(depth) + (n.type === "task" ? (n.checked ? "[x] " : "[ ] ") : "") + n.title)
      b.edges.filter((e) => e.from === id).forEach((e) => walk(e.to, depth + 1))
    }
    ;[...roots, ...b.nodes.filter((n) => !visited.has(n.id))].forEach((r) => walk(r.id, 0))
    return lines.join("\n")
  }

  const exportPdf = (b: MindmapBoard) => {
    setPrintBoardId(b.id)
    setTimeout(() => {
      window.print()
      setTimeout(() => setPrintBoardId(null), 1500)
    }, 120)
  }

  const copyText = async (b: MindmapBoard) => {
    try {
      await navigator.clipboard.writeText(boardToText(b))
      setMenuOpen(false)
    } catch {}
  }

  const tools: { key: Tool; icon: typeof MousePointer2; label: string }[] = [
    { key: "select", icon: MousePointer2, label: "Select (V)" },
    { key: "hand", icon: Hand, label: "Hand — pan (H)" },
    { key: "text", icon: Type, label: "Text — click canvas to place (T)" },
    { key: "sticky", icon: StickyNote, label: "Sticky note (S)" },
    { key: "task", icon: ListChecks, label: "Task checkbox" },
    { key: "connector", icon: Workflow, label: "Connector — click source, then target (C)" },
  ]

  return (
    <DashboardShell>
      <PrintView board={printBoard} />

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="space-y-4"
      >
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">
              {tab === "archive" ? "Archive" : "Brainstorm"}
            </h1>
            <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
              {tab === "archive"
                ? "Archived mind maps"
                : "Infinite canvas for ideas, sticky notes and mind maps"}
            </p>
          </div>

          {tab === "canvas" && active && (
            <div className="flex items-center gap-2 self-start">
              <div className="relative" ref={menuRef}>
                <Button onClick={() => setMenuOpen((o) => !o)} className="gap-2 rounded-xl">
                  <Share2 className="h-4 w-4" /> Export PDF
                </Button>
                <AnimatePresence>
                  {menuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 6, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 6, scale: 0.96 }}
                      className="absolute right-0 top-11 z-30 w-44 overflow-hidden rounded-xl border border-neutral-200 bg-white p-1 shadow-xl dark:border-neutral-800 dark:bg-neutral-900"
                    >
                      <button
                        onClick={() => { setMenuOpen(false); exportPdf(active) }}
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-medium text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
                      >
                        <FileDown className="h-3.5 w-3.5 text-indigo-500" /> Save as PDF
                      </button>
                      <button
                        onClick={() => copyText(active)}
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-medium text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
                      >
                        <ClipboardCopy className="h-3.5 w-3.5 text-emerald-500" /> Copy outline text
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 rounded-xl bg-neutral-100 p-1 dark:bg-neutral-800">
          <button
            onClick={() => setTab("canvas")}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-all",
              tab === "canvas" ? "bg-white text-neutral-900 shadow-sm dark:bg-neutral-900 dark:text-neutral-50" : "text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
            )}
          >
            <Sparkles className="h-4 w-4" /> Canvas
          </button>
          <button
            onClick={() => setTab("archive")}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-all",
              tab === "archive" ? "bg-white text-neutral-900 shadow-sm dark:bg-neutral-900 dark:text-neutral-50" : "text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
            )}
          >
            <Archive className="h-4 w-4" /> Archive
            {archived.length > 0 && (
              <span className="rounded-full bg-neutral-200 px-1.5 py-0.5 text-[10px] font-bold text-neutral-600 dark:bg-neutral-700 dark:text-neutral-300">
                {archived.length}
              </span>
            )}
          </button>
        </div>

        {tab === "archive" ? (
          <ArchiveView
            boards={archived}
            onRestore={(id) => useMindmapStore.getState().restoreBoard(id)}
            onDelete={(id) => { if (window.confirm("Delete this board permanently?")) useMindmapStore.getState().deleteBoard(id) }}
            onExport={(b) => exportPdf(b)}
          />
        ) : (
          <div className="space-y-3">
            {/* Board chips */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {boards.filter((b) => !b.archived).map((b) => (
                <div
                  key={b.id}
                  className={cn(
                    "group flex shrink-0 cursor-pointer items-center gap-2 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all",
                    b.id === active?.id
                      ? "border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-500/40 dark:bg-indigo-500/10 dark:text-indigo-300"
                      : "border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300"
                  )}
                  onClick={() => useMindmapStore.getState().setActiveBoard(b.id)}
                >
                  <Workflow className={cn("h-3.5 w-3.5", b.id === active?.id ? "text-indigo-500" : "text-neutral-400")} />
                  <span className="max-w-[140px] truncate">{b.title}</span>
                  <button
                    onClick={(e) => { e.stopPropagation(); useMindmapStore.getState().archiveBoard(b.id) }}
                    title="Archive board"
                    className="rounded-md p-0.5 text-neutral-400 opacity-0 transition-opacity hover:text-red-500 group-hover:opacity-100"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              <button
                onClick={() => useMindmapStore.getState().createBoard(`Board ${boards.filter((b) => !b.archived).length + 1}`)}
                className="flex shrink-0 items-center gap-1.5 rounded-xl border border-dashed border-neutral-300 px-3 py-1.5 text-xs font-semibold text-neutral-500 transition-colors hover:border-indigo-300 hover:text-indigo-500 dark:border-neutral-700 dark:hover:border-indigo-500/40"
              >
                <Plus className="h-3.5 w-3.5" /> New board
              </button>
            </div>

            {/* Toolbar */}
            {active && (
              <div className="flex flex-wrap items-center gap-1 rounded-2xl border border-neutral-200 bg-white p-1.5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                <div className="flex items-center gap-0.5">
                  {tools.map((t) => (
                    <ToolButton key={t.key} active={tool === t.key} title={t.label} onClick={() => setTool(t.key)}>
                      <t.icon className="h-4 w-4" />
                    </ToolButton>
                  ))}
                </div>

                <div className="mx-1 h-6 w-px bg-neutral-200 dark:bg-neutral-700" />

                <div className="flex items-center gap-1">
                  {COLORS.slice(0, 8).map((c) => (
                    <button
                      key={c}
                      onClick={() => {
                        if (!selected || !active) return
                        commit(active)
                        useMindmapStore.getState().updateNode(active.id, selected, { color: c })
                      }}
                      title={node ? "Apply color" : "Select a node first"}
                      className="h-5 w-5 rounded-full border border-black/10 transition-transform hover:scale-110"
                      style={{ backgroundColor: c, opacity: node ? 1 : 0.4 }}
                    />
                  ))}
                </div>

                <div className="mx-1 h-6 w-px bg-neutral-200 dark:bg-neutral-700" />

                <ToolButton title="Undo (⌘Z)" onClick={undo}>
                  <Undo2 className="h-4 w-4" />
                </ToolButton>
                <ToolButton title="Redo (⌘⇧Z)" onClick={redo}>
                  <Redo2 className="h-4 w-4" />
                </ToolButton>
                <ToolButton title="Delete selected (Del)" onClick={deleteSelected}>
                  <Trash2 className="h-4 w-4" />
                </ToolButton>

                <div className="ml-auto flex items-center gap-1 pr-1">
                  <span className="hidden items-center gap-1 rounded-lg bg-neutral-50 px-2 py-1 text-[10px] font-medium text-neutral-400 sm:flex dark:bg-neutral-800">
                    <Pencil className="h-3 w-3" /> Double-click to edit
                  </span>
                </div>
              </div>
            )}

            {/* Canvas + inspector */}
            {active ? (
              <div className="relative">
                <Canvas
                  board={active}
                  tool={tool}
                  selected={selected}
                  selectedEdge={selectedEdge}
                  editingId={editingId}
                  setTool={setTool}
                  setSelected={setSelected}
                  setSelectedEdge={setSelectedEdge}
                  setEditingId={setEditingId}
                  onCommit={() => commit(active)}
                  onUndo={undo}
                  onRedo={redo}
                  linkSource={linkSource}
                  setLinkSource={setLinkSource}
                />
                <Inspector
                  board={active}
                  node={node}
                  edge={edge}
                  zoom={0}
                  onApplyColor={(c) => {
                    if (!selected) return
                    commit(active)
                    useMindmapStore.getState().updateNode(active.id, selected, { color: c })
                  }}
                  onAddChild={() => {
                    if (!selected) return
                    const p = active.nodes.find((n) => n.id === selected)
                    if (!p) return
                    commit(active)
                    const child = useMindmapStore.getState().addNode(active.id, {
                      type: p.type === "title" ? "idea" : p.type,
                      title: "New idea", notes: "",
                      x: p.x + p.w / 2 - 84 + (Math.random() * 40 - 20),
                      y: p.y + p.h + 70,
                      color: p.color,
                    })
                    useMindmapStore.getState().addEdge(active.id, selected, child.id)
                    setSelected(child.id)
                  }}
                  onAddSibling={() => {
                    if (!selected) return
                    const p = active.nodes.find((n) => n.id === selected)
                    if (!p) return
                    commit(active)
                    const parent = active.edges.find((e) => e.to === selected)?.from ?? selected
                    const sib = useMindmapStore.getState().addNode(active.id, {
                      type: p.type === "title" ? "idea" : p.type,
                      title: "New idea", notes: "",
                      x: p.x + p.w + 90,
                      y: p.y + (Math.random() * 40 - 20),
                      color: p.color,
                    })
                    useMindmapStore.getState().addEdge(active.id, parent, sib.id)
                    setSelected(sib.id)
                  }}
                  onDuplicate={() => {
                    if (!selected || !node) return
                    commit(active)
                    useMindmapStore.getState().addNode(active.id, {
                      type: node.type, title: node.title, notes: node.notes,
                      x: node.x + 30, y: node.y + 30, color: node.color, checked: node.checked,
                    })
                  }}
                  onDelete={deleteSelected}
                  onClose={() => { setSelected(null); setSelectedEdge(null) }}
                  onUpdateNode={(updates) => {
                    if (!selected) return
                    useMindmapStore.getState().updateNode(active.id, selected, updates)
                  }}
                  onUpdateEdge={(updates) => {
                    if (!selectedEdge) return
                    useMindmapStore.getState().updateEdge(active.id, selectedEdge, updates)
                  }}
                  onDeleteEdge={() => {
                    if (!selectedEdge) return
                    commit(active)
                    useMindmapStore.getState().deleteEdge(active.id, selectedEdge)
                    setSelectedEdge(null)
                  }}
                />
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-neutral-300 py-16 text-neutral-400 dark:border-neutral-700">
                <Workflow className="h-10 w-10 text-neutral-300 dark:text-neutral-600" />
                <p className="text-sm">No boards yet — create one to start brainstorming.</p>
                <Button onClick={() => useMindmapStore.getState().createBoard("Board 1")} className="gap-2 rounded-xl">
                  <Plus className="h-4 w-4" /> New board
                </Button>
              </div>
            )}
          </div>
        )}
      </motion.div>
    </DashboardShell>
  )
}
