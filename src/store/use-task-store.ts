import { create } from "zustand"
import type { Task, ViewMode, FilterStatus, SortOption } from "@/types"
import { generateId, calculateProgress, isAllSubtasksComplete } from "@/lib/utils"

type TaskStore = {
  tasks: Task[]
  projects: string[]
  viewMode: ViewMode
  filterStatus: FilterStatus
  sortBy: SortOption
  searchQuery: string
  projectFilter: string
  selectedTask: Task | null
  isCreateModalOpen: boolean
  isEditSheetOpen: boolean
  isDeleteDialogOpen: boolean

  setViewMode: (mode: ViewMode) => void
  setFilterStatus: (status: FilterStatus) => void
  setSortBy: (sort: SortOption) => void
  setSearchQuery: (query: string) => void
  setProjectFilter: (project: string) => void
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
  addProject: (name: string) => void
  deleteProject: (name: string) => void

  getFilteredTasks: () => Task[]
  getProjects: () => string[]
  getStats: () => { total: number; active: number; completed: number; progress: number }
  getProjectStats: () => Record<string, { total: number; completed: number; active: number; avgProgress: number }>
  getPriorityStats: () => Record<string, number>
  clearCompleted: () => void
}

export const useTaskStore = create<TaskStore>((set, get) => ({
  tasks: [],
  projects: [],
  viewMode: "card",
  filterStatus: "all",
  sortBy: "createdAt",
  searchQuery: "",
  projectFilter: "all",
  selectedTask: null,
  isCreateModalOpen: false,
  isEditSheetOpen: false,
  isDeleteDialogOpen: false,

  setViewMode: (mode) => set({ viewMode: mode }),
  setFilterStatus: (status) => set({ filterStatus: status }),
  setSortBy: (sort) => set({ sortBy: sort }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setProjectFilter: (project) => set({ projectFilter: project }),
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

  addProject: (name) => {
    const clean = name.trim()
    if (!clean) return
    const { projects } = get()
    if (projects.includes(clean)) return
    set({ projects: [...projects, clean] })
  },

  deleteProject: (name) => {
    const { projects } = get()
    if (projects.includes(name)) {
      set({ projects: projects.filter((p) => p !== name) })
    }
  },

  getFilteredTasks: () => {
    const { tasks, filterStatus, searchQuery, sortBy, projectFilter } = get()
    let filtered = [...tasks]

    if (filterStatus === "active") {
      filtered = filtered.filter((t) => !t.completed)
    } else if (filterStatus === "completed") {
      filtered = filtered.filter((t) => t.completed)
    }

    if (projectFilter !== "all") {
      filtered = filtered.filter((t) => t.project === projectFilter)
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q) ||
          t.project.toLowerCase().includes(q)
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

  getProjects: () => {
    const { tasks, projects } = get()
    const derived = tasks.map((t) => t.project).filter(Boolean)
    return [...new Set([...projects, ...derived])].sort()
  },

  getStats: () => {
    const { tasks } = get()
    const total = tasks.length
    const completed = tasks.filter((t) => t.completed).length
    const active = total - completed
    const progress = total > 0 ? Math.round((completed / total) * 100) : 0
    return { total, active, completed, progress }
  },

  getProjectStats: () => {
    const { tasks } = get()
    const stats: Record<string, { total: number; completed: number; active: number; avgProgress: number }> = {}
    for (const task of tasks) {
      const p = task.project || "Uncategorized"
      if (!stats[p]) stats[p] = { total: 0, completed: 0, active: 0, avgProgress: 0 }
      stats[p].total++
      if (task.completed) stats[p].completed++
      else stats[p].active++
    }
    for (const key of Object.keys(stats)) {
      const projectTasks = tasks.filter((t) => (t.project || "Uncategorized") === key)
      stats[key].avgProgress = projectTasks.length > 0
        ? Math.round(projectTasks.reduce((sum, t) => sum + t.progress, 0) / projectTasks.length)
        : 0
    }
    return stats
  },

  getPriorityStats: () => {
    const { tasks } = get()
    return tasks.reduce(
      (acc, t) => {
        acc[t.priority] = (acc[t.priority] || 0) + 1
        return acc
      },
      {} as Record<string, number>
    )
  },

  clearCompleted: () => {
    set((state) => ({
      tasks: state.tasks.filter((t) => !t.completed),
    }))
  },
}))
