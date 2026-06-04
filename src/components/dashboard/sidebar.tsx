"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  ListTodo,
  CheckCircle2,
  Circle,
  X,
  ChevronDown,
  ChevronRight,
  Flame,
  GraduationCap,
  Wallet,
  Sparkles,
  LogOut,
} from "lucide-react"
import { useTaskStore } from "@/store/use-task-store"
import { useMediaQuery } from "@/hooks/use-media-query"
import { cn } from "@/lib/shadcn-utils"
import type { DashboardSection } from "@/types"

const subItems = [
  { id: "active", label: "Active Tasks", icon: Circle },
  { id: "completed", label: "Completed", icon: CheckCircle2 },
] as const

export function Sidebar({
  open,
  onClose,
  activeSection,
  onSectionChange,
  onLogout,
}: {
  open: boolean
  onClose: () => void
  activeSection: DashboardSection
  onSectionChange: (s: DashboardSection) => void
  onLogout: () => void
}) {
  const { filterStatus, setFilterStatus } = useTaskStore()
  const isMobile = useMediaQuery("(max-width: 768px)")
  const [tasksExpanded, setTasksExpanded] = useState(true)

  const isTaskGroupActive =
    activeSection === "tasks"

  const handleNav = (section: DashboardSection) => {
    onSectionChange(section)
    if (isMobile) onClose()
  }

  const content = (
    <div className="flex h-full flex-col gap-1 p-4">
        <div className="flex items-center gap-3 px-3 pb-6 pt-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-900 dark:bg-neutral-50">
            <Sparkles className="h-4 w-4 text-white dark:text-neutral-900" />
          </div>
          <span className="text-lg font-semibold tracking-tight">FlowBoard</span>
        </div>

      <div className="space-y-1">
        <div className="space-y-0.5">
          <button
            onClick={() => {
              if (activeSection !== "tasks") {
                handleNav("tasks")
              }
              setTasksExpanded(!tasksExpanded)
            }}
            className={cn(
              "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
              isTaskGroupActive
                ? "bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-neutral-50"
                : "text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800/50 dark:hover:text-neutral-50"
            )}
          >
            <ListTodo className="h-4 w-4" />
            <span className="flex-1 text-left">All Tasks</span>
            {tasksExpanded ? (
              <ChevronDown className="h-3.5 w-3.5 text-neutral-400" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5 text-neutral-400" />
            )}
          </button>

          <AnimatePresence>
            {tasksExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="ml-2 space-y-0.5 border-l-2 border-neutral-200 pl-2 dark:border-neutral-700">
                  {subItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        handleNav("tasks")
                        setFilterStatus(item.id as typeof filterStatus)
                      }}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200",
                        activeSection === "tasks" && filterStatus === item.id
                          ? "bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-neutral-50"
                          : "text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800/50 dark:hover:text-neutral-50"
                      )}
                    >
                      <item.icon className="h-3.5 w-3.5" />
                      {item.label}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <button
          onClick={() => handleNav("habits")}
          className={cn(
            "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
            activeSection === "habits"
              ? "bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-neutral-50"
              : "text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800/50 dark:hover:text-neutral-50"
          )}
        >
          <Flame className="h-4 w-4" />
          Habits & Challenges
        </button>

        <button
          onClick={() => handleNav("skills")}
          className={cn(
            "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
            activeSection === "skills"
              ? "bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-neutral-50"
              : "text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800/50 dark:hover:text-neutral-50"
          )}
        >
          <GraduationCap className="h-4 w-4" />
          Skill Enhancement
        </button>

        <button
          onClick={() => handleNav("finance")}
          className={cn(
            "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
            activeSection === "finance"
              ? "bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-neutral-50"
              : "text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800/50 dark:hover:text-neutral-50"
          )}
        >
          <Wallet className="h-4 w-4" />
          Finance
        </button>

        <button
          onClick={() => handleNav("future")}
          className={cn(
            "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
            activeSection === "future"
              ? "bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-neutral-50"
              : "text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800/50 dark:hover:text-neutral-50"
          )}
        >
          <Sparkles className="h-4 w-4" />
          Future Self
        </button>
      </div>

      <div className="mt-auto pt-4">
        <button
          onClick={onLogout}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-neutral-500 transition-all duration-200 hover:bg-red-50 hover:text-red-500 dark:text-neutral-400 dark:hover:bg-red-950/30 dark:hover:text-red-400"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    </div>
  )

  if (isMobile) {
    return (
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
              onClick={onClose}
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed inset-y-0 left-0 z-50 w-72 bg-white shadow-xl dark:bg-neutral-950"
            >
              <button
                onClick={onClose}
                className="absolute right-4 top-4 rounded-lg p-1 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
              >
                <X className="h-5 w-5" />
              </button>
              {content}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    )
  }

  return (
    <motion.aside
      initial={{ width: 256 }}
      animate={{ width: 256 }}
      className="hidden border-r border-neutral-200/60 bg-white md:block dark:border-neutral-800/60 dark:bg-neutral-950"
    >
      {content}
    </motion.aside>
  )
}
