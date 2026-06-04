"use client"

import { motion } from "framer-motion"
import { Search, Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useMediaQuery } from "@/hooks/use-media-query"
import { NotificationBell } from "./notification-panel"

export function Header({
  onMenuClick,
  onSearchOpen,
}: {
  onMenuClick: () => void
  onSearchOpen: () => void
}) {
  const isMobile = useMediaQuery("(max-width: 768px)")

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="sticky top-0 z-30 border-b border-neutral-200/60 bg-white/80 backdrop-blur-xl dark:border-neutral-800/60 dark:bg-neutral-950/80"
    >
      <div className="flex h-16 items-center gap-4 px-4 lg:px-6">
        {isMobile && (
          <Button variant="ghost" size="icon" onClick={onMenuClick}>
            <Menu className="h-5 w-5" />
          </Button>
        )}

        <button
          onClick={onSearchOpen}
          className="relative flex-1 md:max-w-sm"
        >
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <div className="flex h-9 cursor-text items-center rounded-xl border border-neutral-200 bg-neutral-50 pl-9 pr-3 text-sm text-neutral-400 transition-colors hover:border-neutral-300 focus:bg-white dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-neutral-700 dark:focus:bg-neutral-950">
              <span>Search across all sections...</span>
              <kbd className="ml-auto hidden rounded-md border border-neutral-200 bg-white px-1.5 py-0.5 text-[10px] font-medium text-neutral-400 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-500 md:inline-block">
                ⌘K
              </kbd>
            </div>
          </div>
        </button>

        <div className="ml-auto flex items-center gap-2">
          <NotificationBell />

          <Avatar className="h-8 w-8 cursor-pointer ring-2 ring-neutral-200 transition-shadow hover:ring-neutral-300 dark:ring-neutral-700 dark:hover:ring-neutral-500">
            <AvatarImage src="https://api.dicebear.com/9.x/notionists/svg?seed=Alex" />
            <AvatarFallback>JD</AvatarFallback>
          </Avatar>
        </div>
      </div>

    </motion.header>
  )
}
