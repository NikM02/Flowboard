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
  ChevronsLeft,
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
  collapsed,
  onToggleCollapse,
}: {
  open: boolean
  onClose: () => void
  onLogout: () => void
  collapsed: boolean
  onToggleCollapse: () => void
}) {
  const isMobile = useMediaQuery("(max-width: 768px)")
  const pathname = usePathname()

  const isCollapsed = !isMobile && collapsed

  const navLinkClass = (href: string) =>
    cn(
      "group relative flex w-full items-center rounded-xl text-sm font-medium transition-all duration-200",
      isCollapsed ? "justify-center px-0 py-3" : "gap-3 px-3 py-2.5",
      pathname === href
        ? "bg-gradient-to-r from-indigo-500/15 to-violet-500/10 text-indigo-600 dark:text-indigo-300"
        : "text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800/50 dark:hover:text-neutral-50"
    )

  const labelClass = cn(
    "truncate",
    isCollapsed && "sr-only"
  )

  const content = (
    <>
      <Link
        href="/dashboard"
        className={cn(
          "flex items-center px-3 pb-6 pt-2",
          isCollapsed ? "justify-center px-0" : "gap-3"
        )}
      >
        <Image src="/Nexus.png" alt="Logo" width={32} height={32} className="rounded-lg" />
        <span
          className={cn(
            "flex items-baseline gap-1.5 whitespace-nowrap",
            isCollapsed && "hidden"
          )}
        >
          <span className="text-lg font-bold tracking-tight">Nexus</span>
          <span className="bg-gradient-to-r from-indigo-400 to-fuchsia-400 bg-clip-text text-[10px] font-semibold uppercase tracking-widest text-transparent">My Journey</span>
        </span>
      </Link>

      <div className="space-y-1">
        <Link href="/dashboard" className={navLinkClass("/dashboard")} title="Dashboard">
          <LayoutDashboard className="h-4 w-4 shrink-0" />
          <span className={labelClass}>Dashboard</span>
        </Link>

        <Link href="/north-star" className={navLinkClass("/north-star")} title="North Star">
          <Compass className="h-4 w-4 shrink-0" />
          <span className={labelClass}>North Star</span>
        </Link>

        {navItems.map((item) => (
          <Link key={item.href} href={item.href} className={navLinkClass(item.href)} title={item.label}>
            <item.icon className="h-4 w-4 shrink-0" />
            <span className={labelClass}>{item.label}</span>
          </Link>
        ))}

        <Link href="/content-hub" className={navLinkClass("/content-hub")} title="Content Hub">
          <BookOpen className="h-4 w-4 shrink-0" />
          <span className={labelClass}>Content Hub</span>
        </Link>
      </div>
    </>
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
              className="fixed inset-0 z-40 bg-neutral-950/50"
              onClick={onClose}
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed inset-y-0 left-0 z-50 w-72 glass shadow-2xl shadow-indigo-950/30"
            >
              <button
                onClick={onClose}
                className="absolute right-4 top-4 rounded-lg p-1 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
              >
                <X className="h-5 w-5" />
              </button>
              <div className="flex h-full flex-col gap-1 p-4">{content}</div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    )
  }

  return (
    <aside
      className={cn(
        "glass sticky top-0 hidden h-screen shrink-0 overflow-y-auto border-r border-neutral-200/60 transition-[width] duration-300 ease-in-out md:block dark:border-neutral-800/60",
        isCollapsed ? "w-[76px]" : "w-64"
      )}
    >
      <div className={cn("flex h-full flex-col gap-1", isCollapsed ? "p-3" : "p-4")}>
        {content}

        <div className="mt-auto border-t border-neutral-200/60 pt-2 dark:border-neutral-800/60">
          <button
            onClick={onToggleCollapse}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className={cn(
              "flex w-full items-center rounded-xl text-sm font-medium text-neutral-500 transition-all hover:bg-neutral-50 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800/50 dark:hover:text-neutral-50",
              isCollapsed ? "justify-center px-0 py-3" : "gap-3 px-3 py-2.5"
            )}
          >
            <ChevronsLeft className={cn("h-4 w-4 shrink-0 transition-transform duration-300", isCollapsed && "rotate-180")} />
            <span className={labelClass}>Collapse</span>
          </button>
        </div>
      </div>
    </aside>
  )
}
