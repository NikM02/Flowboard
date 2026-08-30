import { create } from "zustand"
import { generateId } from "@/lib/utils"
import type { ContentItem, ContentStatus } from "@/types"

type ContentStore = {
  items: ContentItem[]
  addItem: (data: { emoji: string; title: string; description: string; deadline: string; status: ContentStatus; reminder?: string }) => void
  updateItem: (id: string, data: Partial<ContentItem>) => void
  moveItem: (id: string, status: ContentStatus) => void
  reorderItems: (status: ContentStatus, ids: string[]) => void
  addSubtask: (itemId: string, title: string) => void
  toggleSubtask: (itemId: string, subId: string) => void
  deleteSubtask: (itemId: string, subId: string) => void
  deleteItem: (id: string) => void
  archiveItem: (id: string) => void
  unarchiveItem: (id: string) => void
  clearArchived: () => void
  autoArchivePastDeadline: () => number
}

export const useContentStore = create<ContentStore>((set) => ({
  items: [],

  addItem: (data) =>
    set((s) => ({
      items: [{ id: generateId(), ...data, subtasks: [], createdAt: Date.now() }, ...s.items],
    })),
  updateItem: (id, data) =>
    set((s) => ({
      items: s.items.map((item) => (item.id === id ? { ...item, ...data } : item)),
    })),
  moveItem: (id, status) =>
    set((s) => ({
      items: s.items.map((item) => (item.id === id ? { ...item, status } : item)),
    })),
  reorderItems: (status, ids) =>
    set((s) => {
      const others = s.items.filter((i) => i.status !== status)
      const reordered = ids
        .map((id) => s.items.find((i) => i.id === id))
        .filter(Boolean) as ContentItem[]
      const before = s.items.filter((i) => i.status === status && !ids.includes(i.id))
      return { items: [...before, ...reordered, ...others] }
    }),
  addSubtask: (itemId, title) =>
    set((s) => ({
      items: s.items.map((item) =>
        item.id === itemId
          ? { ...item, subtasks: [...item.subtasks, { id: generateId(), title, completed: false }] }
          : item
      ),
    })),
  toggleSubtask: (itemId, subId) =>
    set((s) => ({
      items: s.items.map((item) =>
        item.id === itemId
          ? {
              ...item,
              subtasks: item.subtasks.map((st) =>
                st.id === subId ? { ...st, completed: !st.completed } : st
              ),
            }
          : item
      ),
    })),
  deleteSubtask: (itemId, subId) =>
    set((s) => ({
      items: s.items.map((item) =>
        item.id === itemId
          ? { ...item, subtasks: item.subtasks.filter((st) => st.id !== subId) }
          : item
      ),
    })),
  deleteItem: (id) =>
    set((s) => ({ items: s.items.filter((item) => item.id !== id) })),
  archiveItem: (id) =>
    set((s) => ({
      items: s.items.map((item) =>
        item.id === id ? { ...item, status: "published" as ContentStatus } : item
      ),
    })),
  unarchiveItem: (id) =>
    set((s) => ({
      items: s.items.map((item) =>
        item.id === id ? { ...item, status: "ideas" as ContentStatus } : item
      ),
    })),
  clearArchived: () =>
    set((s) => ({ items: s.items.filter((i) => i.status !== "published") })),

  autoArchivePastDeadline: () => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    let archivedCount = 0

    set((s) => ({
      items: s.items.map((item) => {
        if (item.status === "published" && item.deadline) {
          const deadline = new Date(item.deadline)
          deadline.setDate(deadline.getDate() + 1)
          deadline.setHours(0, 0, 0, 0)
          if (today >= deadline) {
            archivedCount++
            return { ...item, status: "published" as ContentStatus, archivedAt: Date.now() }
          }
        }
        return item
      }),
    }))

    return archivedCount
  },
}))
