import { create } from "zustand"
import type { AdvanceTodo } from "@/types"
import { generateId } from "@/lib/utils"

type AdvanceTodoStore = {
  todos: AdvanceTodo[]
  addTodo: (title: string, reminder?: string) => void
  toggleTodo: (id: string) => void
  updateTodo: (id: string, data: string | { title?: string; reminder?: string }) => void
  deleteTodo: (id: string) => void
  getTodayTodos: () => AdvanceTodo[]
}

function getTodayKey(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

export const useAdvanceTodoStore = create<AdvanceTodoStore>((set, get) => ({
  todos: [],

  addTodo: (title, reminder) => {
    const todo: AdvanceTodo = {
      id: generateId(),
      title,
      completed: false,
      date: getTodayKey(),
      reminder,
      createdAt: Date.now(),
    }
    set((s) => ({ todos: [todo, ...s.todos] }))
  },

  toggleTodo: (id) => {
    set((s) => ({
      todos: s.todos.map((t) =>
        t.id === id ? { ...t, completed: !t.completed } : t
      ),
    }))
  },

  updateTodo: (id, data) => {
    set((s) => ({
      todos: s.todos.map((t) =>
        t.id === id ? { ...t, ...(typeof data === "string" ? { title: data } : data) } : t
      ),
    }))
  },

  deleteTodo: (id) => {
    set((s) => ({ todos: s.todos.filter((t) => t.id !== id) }))
  },

  getTodayTodos: () => {
    const today = getTodayKey()
    return get().todos.filter((t) => t.date === today)
  },
}))
