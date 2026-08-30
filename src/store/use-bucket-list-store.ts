import { create } from "zustand"
import { generateId } from "@/lib/utils"
import type { BucketListItem } from "@/types"

type BucketListStore = {
  items: BucketListItem[]
  addItem: (data: { title: string; description: string; imageUrl: string; expectedDate: string; timeframe: string; reminder?: string }) => void
  updateItem: (id: string, data: Partial<BucketListItem>) => void
  toggleComplete: (id: string) => void
  deleteItem: (id: string) => void
  clearAll: () => void
}

export const useBucketListStore = create<BucketListStore>((set) => ({
  items: [],

  addItem: (data) =>
    set((s) => ({
      items: [{ id: generateId(), ...data, completed: false, createdAt: Date.now() }, ...s.items],
    })),
  updateItem: (id, data) =>
    set((s) => ({
      items: s.items.map((item) => (item.id === id ? { ...item, ...data } : item)),
    })),
  toggleComplete: (id) =>
    set((s) => ({
      items: s.items.map((item) => (item.id === id ? { ...item, completed: !item.completed } : item)),
    })),
  deleteItem: (id) =>
    set((s) => ({ items: s.items.filter((item) => item.id !== id) })),
  clearAll: () => set({ items: [] }),
}))
