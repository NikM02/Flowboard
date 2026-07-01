import { create } from "zustand"
import type { AdvanceTodo } from "@/types"
import { generateId } from "@/lib/utils"

type AdvanceTodoStore = {
  todos: AdvanceTodo[]
  addTodo: (title: string) => void
  toggleTodo: (id: string) => void
  updateTodo: (id: string, title: string) => void
  deleteTodo: (id: string) => void
  getTodayTodos: () => AdvanceTodo[]
}

function getTodayKey(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

export const useAdvanceTodoStore = create<AdvanceTodoStore>((set, get) => ({
  todos: [],

  addTodo: (title) => {
    const todo: AdvanceTodo = {
      id: generateId(),
      title,
      completed: false,
      date: getTodayKey(),
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

  updateTodo: (id, title) => {
    set((s) => ({
      todos: s.todos.map((t) =>
        t.id === id ? { ...t, title } : t
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
