"use client"

import { motion } from "framer-motion"
import { Search } from "lucide-react"
import Image from "next/image"
import { NotificationBell } from "./notification-panel"
import { useMediaQuery } from "@/hooks/use-media-query"

export function Header({
  onSearchOpen,
}: {
  onSearchOpen: () => void
}) {
  const isMobile = useMediaQuery("(max-width: 768px)")

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="sticky top-0 z-30 border-b border-neutral-200/60 bg-white/80 backdrop-blur-xl dark:border-neutral-800/60 dark:bg-neutral-950/80"
    >
      <div className="flex h-14 items-center gap-4 px-4 lg:px-6">
        <div className="flex items-center gap-2.5">
          <Image src="/T.png" alt="Logo" width={32} height={32} className="rounded-lg" />
          <span className="text-base font-semibold tracking-tight text-neutral-900 dark:text-neutral-50">
            FlowBoard
          </span>
        </div>

        <button
          onClick={onSearchOpen}
          className="relative ml-auto max-w-[200px] md:max-w-sm"
        >
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <div className="flex h-8 cursor-text items-center rounded-xl border border-neutral-200 bg-neutral-50 pl-9 pr-3 text-xs text-neutral-400 transition-colors hover:border-neutral-300 focus:bg-white dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-neutral-700 dark:focus:bg-neutral-950">
              <span className="hidden sm:inline">Search across all sections...</span>
              <span className="sm:hidden">Search...</span>
              <kbd className="ml-auto hidden rounded-md border border-neutral-200 bg-white px-1.5 py-0.5 text-[10px] font-medium text-neutral-400 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-500 md:inline-block">
                ⌘K
              </kbd>
            </div>
          </div>
        </button>

        <NotificationBell />
      </div>
    </motion.header>
  )
}
