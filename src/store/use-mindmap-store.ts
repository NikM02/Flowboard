import { create } from "zustand"
import type { MindmapBoard, MindmapNode, MindmapEdge } from "@/types"
import { generateId } from "@/lib/utils"

type MindmapStore = {
  boards: MindmapBoard[]
  activeBoardId: string | null

  setActiveBoard: (id: string | null) => void
  createBoard: (title?: string) => MindmapBoard
  renameBoard: (id: string, title: string) => void
  archiveBoard: (id: string) => void
  restoreBoard: (id: string) => void
  deleteBoard: (id: string) => void

  addNode: (boardId: string, node: Omit<MindmapNode, "id" | "w" | "h">) => MindmapNode
  updateNode: (boardId: string, nodeId: string, updates: Partial<MindmapNode>) => void
  deleteNode: (boardId: string, nodeId: string) => void

  addEdge: (boardId: string, from: string, to: string, label?: string) => MindmapEdge | null
  updateEdge: (boardId: string, edgeId: string, updates: Partial<MindmapEdge>) => void
  deleteEdge: (boardId: string, edgeId: string) => void

  getBoard: (id: string | null) => MindmapBoard | undefined
}

const EMPTY_NODE_GEOMETRY = { w: 168, h: 64 }

export const useMindmapStore = create<MindmapStore>((set, get) => ({
  boards: [],
  activeBoardId: null,

  setActiveBoard: (id) => set({ activeBoardId: id }),

  createBoard: (title = "Untitled board") => {
    const board: MindmapBoard = {
      id: generateId(),
      title,
      archived: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      nodes: [],
      edges: [],
    }
    set((state) => ({
      boards: [board, ...state.boards],
      activeBoardId: board.id,
    }))
    return board
  },

  renameBoard: (id, title) => {
    set((state) => ({
      boards: state.boards.map((b) =>
        b.id === id ? { ...b, title: title.trim() || b.title, updatedAt: Date.now() } : b
      ),
    }))
  },

  archiveBoard: (id) => {
    set((state) => ({
      boards: state.boards.map((b) =>
        b.id === id ? { ...b, archived: true, updatedAt: Date.now() } : b
      ),
      activeBoardId: state.activeBoardId === id ? null : state.activeBoardId,
    }))
  },

  restoreBoard: (id) => {
    set((state) => ({
      boards: state.boards.map((b) =>
        b.id === id ? { ...b, archived: false, updatedAt: Date.now() } : b
      ),
    }))
  },

  deleteBoard: (id) => {
    set((state) => ({
      boards: state.boards.filter((b) => b.id !== id),
      activeBoardId: state.activeBoardId === id ? null : state.activeBoardId,
    }))
  },

  addNode: (boardId, node) => {
    const newNode: MindmapNode = {
      ...EMPTY_NODE_GEOMETRY,
      ...node,
      id: generateId(),
    }
    set((state) => ({
      boards: state.boards.map((b) =>
        b.id === boardId
          ? { ...b, nodes: [...b.nodes, newNode], updatedAt: Date.now() }
          : b
      ),
    }))
    return newNode
  },

  updateNode: (boardId, nodeId, updates) => {
    set((state) => ({
      boards: state.boards.map((b) =>
        b.id === boardId
          ? {
              ...b,
              nodes: b.nodes.map((n) => (n.id === nodeId ? { ...n, ...updates } : n)),
              updatedAt: Date.now(),
            }
          : b
      ),
    }))
  },

  deleteNode: (boardId, nodeId) => {
    set((state) => ({
      boards: state.boards.map((b) =>
        b.id === boardId
          ? {
              ...b,
              nodes: b.nodes.filter((n) => n.id !== nodeId),
              edges: b.edges.filter((e) => e.from !== nodeId && e.to !== nodeId),
              updatedAt: Date.now(),
            }
          : b
      ),
    }))
  },

  addEdge: (boardId, from, to, label = "") => {
    if (from === to) return null
    const board = get().boards.find((b) => b.id === boardId)
    if (!board) return null
    if (board.edges.some((e) => e.from === from && e.to === to)) return null
    const edge: MindmapEdge = { id: generateId(), from, to, label }
    set((state) => ({
      boards: state.boards.map((b) =>
        b.id === boardId
          ? { ...b, edges: [...b.edges, edge], updatedAt: Date.now() }
          : b
      ),
    }))
    return edge
  },

  updateEdge: (boardId, edgeId, updates) => {
    set((state) => ({
      boards: state.boards.map((b) =>
        b.id === boardId
          ? {
              ...b,
              edges: b.edges.map((e) => (e.id === edgeId ? { ...e, ...updates } : e)),
              updatedAt: Date.now(),
            }
          : b
      ),
    }))
  },

  deleteEdge: (boardId, edgeId) => {
    set((state) => ({
      boards: state.boards.map((b) =>
        b.id === boardId
          ? { ...b, edges: b.edges.filter((e) => e.id !== edgeId), updatedAt: Date.now() }
          : b
      ),
    }))
  },

  getBoard: (id) => get().boards.find((b) => b.id === id),
}))
