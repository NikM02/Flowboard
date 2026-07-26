"use client"

import { useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import {
  LayoutDashboard, ListTodo, Wallet, Plus, X,
  Compass, Heart, GraduationCap, TrendingUp, Sparkles, BookOpen,
} from "lucide-react"
import { ThemePicker } from "@/components/dashboard/theme-picker"
import { cn } from "@/lib/shadcn-utils"

const primaryItems = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/tasks", label: "Tasks", icon: ListTodo },
  { href: "/finance", label: "Finance", icon: Wallet },
]

const moreItems = [
  { href: "/north-star", label: "North Star", icon: Compass },
  { href: "/habits", label: "Health", icon: Heart },
  { href: "/skills", label: "Skills", icon: GraduationCap },
  { href: "/investments", label: "Investments", icon: TrendingUp },
  { href: "/future", label: "Future", icon: Sparkles },
  { href: "/content-hub", label: "Content", icon: BookOpen },
]

export function BottomNav() {
  const pathname = usePathname()
  const router = useRouter()
  const [open, setOpen] = useState(false)

  const navigate = (href: string) => {
    router.push(href)
    setOpen(false)
  }

  return (
    <>
      {/* Floating menu overlay */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm md:hidden"
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.9 }}
              transition={{ type: "spring", damping: 25, stiffness: 350 }}
              className="fixed bottom-20 left-4 right-4 z-50 rounded-2xl border border-neutral-200/60 bg-white p-3 shadow-2xl dark:border-neutral-800/60 dark:bg-neutral-900 md:hidden"
            >
              <div className="grid grid-cols-3 gap-2">
                {moreItems.map((item) => {
                  const Icon = item.icon
                  const isActive = pathname === item.href
                  return (
                    <button
                      key={item.href}
                      onClick={() => navigate(item.href)}
                      className={cn(
                        "flex flex-col items-center gap-1.5 rounded-xl px-2 py-3 transition-all",
                        isActive
                          ? "bg-neutral-900 text-white dark:bg-neutral-50 dark:text-neutral-900"
                          : "bg-neutral-50 text-neutral-600 hover:bg-neutral-100 dark:bg-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-700"
                      )}
                    >
                      <Icon className="h-5 w-5" />
                      <span className="text-[10px] font-medium">{item.label}</span>
                    </button>
                  )
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Bottom bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-neutral-200/60 bg-white/80 backdrop-blur-xl md:hidden dark:border-neutral-800/60 dark:bg-neutral-950/80">
        <div className="flex items-center justify-around px-1 py-1.5">
          {primaryItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <button
                key={item.href}
                onClick={() => router.push(item.href)}
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
                    : "text-neutral-400 dark:text-neutral-500"
                )} />
                <span>{item.label}</span>
              </button>
            )
          })}

          {/* Theme picker - mobile */}
          <ThemePicker variant="mobile" />

          {/* More button */}
          <button
            onClick={() => setOpen(!open)}
            className={cn(
              "flex flex-col items-center gap-0.5 rounded-xl px-3 py-1.5 text-[10px] font-medium transition-all duration-200",
              open
                ? "text-neutral-900 dark:text-neutral-50"
                : "text-neutral-400 hover:text-neutral-600 dark:text-neutral-500 dark:hover:text-neutral-300"
            )}
          >
            <div className={cn(
              "flex h-5 w-5 items-center justify-center rounded-full transition-all",
              open
                ? "bg-neutral-900 text-white dark:bg-neutral-50 dark:text-neutral-900"
                : "bg-neutral-200 text-neutral-500 dark:bg-neutral-700 dark:text-neutral-400"
            )}>
              {open ? <X className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
            </div>
            <span>More</span>
          </button>
        </div>
      </nav>
    </>
  )
}
