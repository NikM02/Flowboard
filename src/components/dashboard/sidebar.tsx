"use client"

import { motion, AnimatePresence } from "framer-motion"
import { usePathname } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import {
  ListTodo, X, Heart, GraduationCap, Wallet, Sparkles,
  TrendingUp, LayoutDashboard, BookOpen, Compass, ChevronsLeft,
  Settings, CalendarClock,
} from "lucide-react"
import { useMediaQuery } from "@/hooks/use-media-query"
import { cn } from "@/lib/shadcn-utils"

const navItems = [
  { href: "/tasks", label: "Tasks", icon: ListTodo },
  { href: "/habits", label: "Health", icon: Heart },
  { href: "/skills", label: "Skills", icon: GraduationCap },
  { href: "/finance", label: "Finance", icon: Wallet },
  { href: "/investments", label: "Investments", icon: TrendingUp },
  { href: "/future", label: "Future", icon: Sparkles },
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
      "group relative flex w-full items-center rounded-[10px] text-sm font-medium transition-all duration-200",
      isCollapsed ? "justify-center px-0 py-3" : "gap-3 px-3 py-2.5",
      pathname === href
        ? "bg-neutral-100 font-semibold text-neutral-900 dark:bg-neutral-800 dark:text-white"
        : "text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-50"
    )

  const labelClass = cn("truncate", isCollapsed && "sr-only")

  const content = (
    <>
      <Link
        href="/dashboard"
        className={cn(
          "flex items-center pb-6 pt-1",
          isCollapsed ? "justify-center px-0" : "gap-3 px-1"
        )}
      >
        <Image src="/Vault.png" alt="Vault logo" width={28} height={28} className="rounded-[10px]" />
        <span
          className={cn(
            "text-base font-extrabold tracking-tight text-neutral-900 dark:text-white whitespace-nowrap transition-all",
            isCollapsed && "hidden"
          )}
        >
          Vault
        </span>
      </Link>

      <div className="space-y-0.5">
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
              className="fixed inset-0 z-40 bg-neutral-950/60 backdrop-blur-sm"
              onClick={onClose}
            />
            <motion.aside
              initial={{ x: "-100%", opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: "-100%", opacity: 0 }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed inset-y-0 left-0 z-50 w-72 border-r border-neutral-200/50 bg-white/95 backdrop-blur-xl dark:border-neutral-800/50 dark:bg-neutral-900/95"
            >
              <div className="flex h-full flex-col gap-1 p-4 pt-safe">
                <button
                  onClick={onClose}
                  className="absolute right-4 top-4 rounded-[10px] p-1.5 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-600 dark:hover:bg-neutral-800 dark:hover:text-neutral-300"
                >
                  <X className="h-4 w-4" />
                </button>
                {content}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    )
  }

  return (
    <motion.aside
      initial={false}
      animate={{ width: isCollapsed ? 72 : 256 }}
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
      className="hidden md:flex h-screen shrink-0 flex-col border-r border-neutral-200/50 bg-white dark:border-neutral-800/50 dark:bg-neutral-950"
    >
      <div className={cn("flex h-full flex-col gap-1", isCollapsed ? "p-3" : "p-4")}>
        {content}

        <div className="mt-auto space-y-0.5 border-t border-neutral-100 pt-2 dark:border-neutral-800">
          <button
            onClick={onToggleCollapse}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className={cn(
              "flex w-full items-center rounded-[10px] text-sm font-medium text-neutral-400 transition-all hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-500 dark:hover:bg-neutral-800 dark:hover:text-neutral-50",
              isCollapsed ? "justify-center px-0 py-3" : "gap-3 px-3 py-2.5"
            )}
          >
            <ChevronsLeft className={cn("h-4 w-4 shrink-0 transition-transform duration-300", isCollapsed && "rotate-180")} />
            <span className={labelClass}>Collapse</span>
          </button>
        </div>
      </div>
    </motion.aside>
  )
}
