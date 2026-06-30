"use client"

import { ListTodo, Flame, GraduationCap, Wallet, Sparkles } from "lucide-react"
import { cn } from "@/lib/shadcn-utils"
import type { DashboardSection } from "@/types"

const navItems: { key: DashboardSection; label: string; icon: typeof ListTodo }[] = [
  { key: "tasks", label: "Tasks", icon: ListTodo },
  { key: "habits", label: "Habits", icon: Flame },
  { key: "skills", label: "Skills", icon: GraduationCap },
  { key: "finance", label: "Finance", icon: Wallet },
  { key: "future", label: "Future", icon: Sparkles },
]

export function BottomNav({
  activeSection,
  onSectionChange,
}: {
  activeSection: DashboardSection
  onSectionChange?: (s: DashboardSection) => void
}) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-neutral-200/60 bg-white/80 backdrop-blur-xl md:hidden dark:border-neutral-800/60 dark:bg-neutral-950/80">
      <div className="flex items-center justify-around px-2 py-1">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = activeSection === item.key
          return (
            <button
              key={item.key}
              onClick={() => onSectionChange?.(item.key)}
              className={cn(
                "flex flex-col items-center gap-0.5 rounded-xl px-3 py-1.5 text-[10px] font-medium transition-all duration-200",
                isActive
                  ? "text-neutral-900 dark:text-neutral-50"
                  : "text-neutral-400 hover:text-neutral-600 dark:text-neutral-500 dark:hover:text-neutral-300"
              )}
            >
              <Icon className={cn(
                "h-5 w-5 transition-colors duration-200",
                isActive
                  ? "text-neutral-900 dark:text-neutral-50"
                  : "text-neutral-400 group-hover:text-neutral-600 dark:text-neutral-500 dark:group-hover:text-neutral-300"
              )} />
              <span>{item.label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
