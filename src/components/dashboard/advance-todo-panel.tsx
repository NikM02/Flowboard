"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Check, Plus, Pencil, Trash2, X, ListTodo } from "lucide-react"
import { useAdvanceTodoStore } from "@/store/use-advance-todo-store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export function AdvanceTodoPanel() {
  const { todos, addTodo, toggleTodo, updateTodo, deleteTodo } = useAdvanceTodoStore()
  const todayKey = new Date().toISOString().slice(0, 10)
  const todayTodos = todos.filter((t) => t.date === todayKey)
  const total = todayTodos.length
  const completedCount = todayTodos.filter((t) => t.completed).length
  const progressPct = total > 0 ? Math.floor((completedCount / total) / 0.25) * 25 : 0

  const [newTitle, setNewTitle] = useState("")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState("")

  const handleAdd = () => {
    const trimmed = newTitle.trim()
    if (!trimmed) return
    addTodo(trimmed)
    setNewTitle("")
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleAdd()
  }

  const startEdit = (id: string, title: string) => {
    setEditingId(id)
    setEditTitle(title)
  }

  const saveEdit = (id: string) => {
    const trimmed = editTitle.trim()
    if (!trimmed) return
    updateTodo(id, trimmed)
    setEditingId(null)
    setEditTitle("")
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditTitle("")
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Progress bar */}
      {total > 0 && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400">
            <span>{completedCount}/{total} done</span>
            <span>{progressPct}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-700">
            <motion.div
              layout
              className="h-full rounded-full bg-neutral-900 dark:bg-neutral-100"
              style={{ width: `${progressPct}%` }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
            />
          </div>
        </div>
      )}

      {/* Add input */}
      <div className="flex gap-2">
        <Input
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Add an advance todo..."
          className="flex-1 h-9 text-sm"
        />
        <Button onClick={handleAdd} size="sm" className="gap-1 h-9">
          <Plus className="h-4 w-4" />
          Add
        </Button>
      </div>

      {/* List */}
      {total === 0 ? (
        <div className="flex flex-col items-center gap-2 py-12 text-neutral-400 dark:text-neutral-500">
          <ListTodo className="h-10 w-10" />
          <p className="text-sm">No advance todos for today</p>
        </div>
      ) : (
        <div className="space-y-1">
          <AnimatePresence mode="popLayout">
            {todayTodos.map((todo) => (
              <motion.div
                key={todo.id}
                layout
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="group flex items-center gap-3 rounded-lg border border-neutral-200 bg-white px-3 py-2.5 transition-colors dark:border-neutral-700 dark:bg-neutral-800/50"
              >
                {/* Checkbox */}
                <button
                  onClick={() => toggleTodo(todo.id)}
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-all ${
                    todo.completed
                      ? "border-neutral-900 bg-neutral-900 text-white dark:border-neutral-100 dark:bg-neutral-100 dark:text-neutral-900"
                      : "border-neutral-300 hover:border-neutral-500 dark:border-neutral-600 dark:hover:border-neutral-400"
                  }`}
                >
                  {todo.completed && <Check className="h-3 w-3" />}
                </button>

                {/* Title */}
                {editingId === todo.id ? (
                  <div className="flex flex-1 gap-1">
                    <Input
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") saveEdit(todo.id)
                        if (e.key === "Escape") cancelEdit()
                      }}
                      className="flex-1 h-8 text-sm"
                      autoFocus
                    />
                    <Button size="icon" variant="ghost" onClick={() => saveEdit(todo.id)} className="h-8 w-8">
                      <Check className="h-4 w-4 text-green-500" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={cancelEdit} className="h-8 w-8">
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <span
                    className={`flex-1 text-sm transition-all ${
                      todo.completed
                        ? "text-neutral-400 line-through dark:text-neutral-500"
                        : "text-neutral-800 dark:text-neutral-200"
                    }`}
                  >
                    {todo.title}
                  </span>
                )}

                {/* Actions */}
                {editingId !== todo.id && (
                  <div className="flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => startEdit(todo.id, todo.title)}
                      className="h-7 w-7"
                    >
                      <Pencil className="h-3.5 w-3.5 text-neutral-400" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => deleteTodo(todo.id)}
                      className="h-7 w-7"
                    >
                      <Trash2 className="h-3.5 w-3.5 text-red-400" />
                    </Button>
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  )
}
