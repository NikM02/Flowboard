"use client"

import { motion, AnimatePresence } from "framer-motion"
import { usePathname } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import {
  ListTodo,
  X,
  Heart,
  GraduationCap,
  Wallet,
  Sparkles,
  TrendingUp,
  LayoutDashboard,
  BookOpen,
  Compass,
} from "lucide-react"
import { useMediaQuery } from "@/hooks/use-media-query"
import { cn } from "@/lib/shadcn-utils"

const navItems = [
  { href: "/tasks", label: "Tasks", icon: ListTodo },
  { href: "/habits", label: "Health", icon: Heart },
  { href: "/skills", label: "Skill Enhancement", icon: GraduationCap },
  { href: "/finance", label: "Finance", icon: Wallet },
  { href: "/investments", label: "Investments", icon: TrendingUp },
  { href: "/future", label: "Future Self", icon: Sparkles },
]

export function Sidebar({
  open,
  onClose,
  onLogout,
}: {
  open: boolean
  onClose: () => void
  onLogout: () => void
}) {
  const isMobile = useMediaQuery("(max-width: 768px)")
  const pathname = usePathname()

  const content = (
    <div className="flex h-full flex-col gap-1 p-4">
      <div className="flex items-center gap-3 px-3 pb-6 pt-2">
        <Image src="/Nexus.png" alt="Logo" width={32} height={32} className="rounded-lg" />
        <span className="text-lg font-semibold tracking-tight">Nexus</span>
      </div>

      <div className="space-y-1">
        <Link
          href="/dashboard"
          className={cn(
            "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
            pathname === "/dashboard"
              ? "bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-neutral-50"
              : "text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800/50 dark:hover:text-neutral-50"
          )}
        >
          <LayoutDashboard className="h-4 w-4" />
          Dashboard
        </Link>

        <Link
          href="/north-star"
          className={cn(
            "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
            pathname === "/north-star"
              ? "bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-neutral-50"
              : "text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800/50 dark:hover:text-neutral-50"
          )}
        >
          <Compass className="h-4 w-4" />
          North Star
        </Link>

        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
              pathname === item.href
                ? "bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-neutral-50"
                : "text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800/50 dark:hover:text-neutral-50"
            )}
          >
            <item.icon className="h-4 w-4 shrink-0" />
            {item.label}
          </Link>
        ))}

        <Link
          href="/content-hub"
          className={cn(
            "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
            pathname === "/content-hub"
              ? "bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-neutral-50"
              : "text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800/50 dark:hover:text-neutral-50"
          )}
        >
          <BookOpen className="h-4 w-4" />
          Content Hub
        </Link>
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
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 overflow-y-auto border-r border-neutral-200/60 bg-white md:block dark:border-neutral-800/60 dark:bg-neutral-950">
      {content}
    </aside>
  )
}
