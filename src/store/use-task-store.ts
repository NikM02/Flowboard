import { create } from "zustand"
import type { Task, ViewMode, FilterStatus, SortOption } from "@/types"
import { generateId, calculateProgress, isAllSubtasksComplete } from "@/lib/utils"

type TaskStore = {
  tasks: Task[]
  viewMode: ViewMode
  filterStatus: FilterStatus
  sortBy: SortOption
  searchQuery: string
  selectedTask: Task | null
  isCreateModalOpen: boolean
  isEditSheetOpen: boolean
  isDeleteDialogOpen: boolean

  setViewMode: (mode: ViewMode) => void
  setFilterStatus: (status: FilterStatus) => void
  setSortBy: (sort: SortOption) => void
  setSearchQuery: (query: string) => void
  setSelectedTask: (task: Task | null) => void
  setIsCreateModalOpen: (open: boolean) => void
  setIsEditSheetOpen: (open: boolean) => void
  setIsDeleteDialogOpen: (open: boolean) => void

  addTask: (task: Omit<Task, "id" | "completed" | "progress" | "createdAt">) => void
  updateTask: (id: string, updates: Partial<Task>) => void
  deleteTask: (id: string) => void
  toggleSubtask: (taskId: string, subtaskId: string) => void
  addSubtask: (taskId: string, title: string) => void
  removeSubtask: (taskId: string, subtaskId: string) => void

  getFilteredTasks: () => Task[]
  getStats: () => { total: number; active: number; completed: number; progress: number }
  clearCompleted: () => void
}

export const useTaskStore = create<TaskStore>((set, get) => ({
  tasks: [],
  viewMode: "card",
  filterStatus: "all",
  sortBy: "createdAt",
  searchQuery: "",
  selectedTask: null,
  isCreateModalOpen: false,
  isEditSheetOpen: false,
  isDeleteDialogOpen: false,

  setViewMode: (mode) => set({ viewMode: mode }),
  setFilterStatus: (status) => set({ filterStatus: status }),
  setSortBy: (sort) => set({ sortBy: sort }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setSelectedTask: (task) => set({ selectedTask: task }),
  setIsCreateModalOpen: (open) => set({ isCreateModalOpen: open }),
  setIsEditSheetOpen: (open) => set({ isEditSheetOpen: open }),
  setIsDeleteDialogOpen: (open) => set({ isDeleteDialogOpen: open }),

  addTask: (task) => {
    const newTask: Task = {
      ...task,
      id: generateId(),
      completed: false,
      progress: 0,
      createdAt: Date.now(),
    }
    set((state) => ({ tasks: [newTask, ...state.tasks] }))
  },

  updateTask: (id, updates) => {
    set((state) => ({
      tasks: state.tasks.map((task) =>
        task.id === id ? { ...task, ...updates } : task
      ),
    }))
  },

  deleteTask: (id) => {
    set((state) => ({
      tasks: state.tasks.filter((t) => t.id !== id),
      selectedTask: state.selectedTask?.id === id ? null : state.selectedTask,
    }))
  },

  toggleSubtask: (taskId, subtaskId) => {
    set((state) => ({
      tasks: state.tasks.map((task) => {
        if (task.id !== taskId) return task
        const newSubtasks = task.subtasks.map((s) =>
          s.id === subtaskId ? { ...s, completed: !s.completed } : s
        )
        const progress = calculateProgress(newSubtasks)
        const completed = isAllSubtasksComplete(newSubtasks)
        return { ...task, subtasks: newSubtasks, progress, completed }
      }),
    }))
  },

  addSubtask: (taskId, title) => {
    const newSubtask = { id: generateId(), title, completed: false }
    set((state) => ({
      tasks: state.tasks.map((task) => {
        if (task.id !== taskId) return task
        const newSubtasks = [...task.subtasks, newSubtask]
        const progress = calculateProgress(newSubtasks)
        return { ...task, subtasks: newSubtasks, progress }
      }),
    }))
  },

  removeSubtask: (taskId, subtaskId) => {
    set((state) => ({
      tasks: state.tasks.map((task) => {
        if (task.id !== taskId) return task
        const newSubtasks = task.subtasks.filter((s) => s.id !== subtaskId)
        const progress = calculateProgress(newSubtasks)
        const completed = isAllSubtasksComplete(newSubtasks)
        return { ...task, subtasks: newSubtasks, progress, completed }
      }),
    }))
  },

  getFilteredTasks: () => {
    const { tasks, filterStatus, searchQuery, sortBy } = get()
    let filtered = [...tasks]

    if (filterStatus === "active") {
      filtered = filtered.filter((t) => !t.completed)
    } else if (filterStatus === "completed") {
      filtered = filtered.filter((t) => t.completed)
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q)
      )
    }

    filtered.sort((a, b) => {
      switch (sortBy) {
        case "dueDate":
          return a.dueDate.localeCompare(b.dueDate)
        case "progress":
          return b.progress - a.progress
        case "priority": {
          const p = { high: 3, medium: 2, low: 1 }
          return p[b.priority] - p[a.priority]
        }
        case "createdAt":
          return b.createdAt - a.createdAt
        default:
          return 0
      }
    })

    return filtered
  },

  getStats: () => {
    const { tasks } = get()
    const total = tasks.length
    const completed = tasks.filter((t) => t.completed).length
    const active = total - completed
    const progress = total > 0 ? Math.round((completed / total) * 100) : 0
    return { total, active, completed, progress }
  },

  clearCompleted: () => {
    set((state) => ({
      tasks: state.tasks.filter((t) => !t.completed),
    }))
  },
}))
