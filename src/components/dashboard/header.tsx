"use client"

import { usePathname } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Search, Menu, LogOut } from "lucide-react"
import { useMediaQuery } from "@/hooks/use-media-query"
import { usePageTitleStore } from "@/store/use-page-title-store"

const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/tasks": "Tasks",
  "/roadmap": "Roadmap",
  "/habits": "Health",
  "/north-star": "North Star",
  "/future": "Future Self",
  "/finance": "Finance",
  "/investments": "Investments",
  "/skills": "Skills",
  "/skills/bucket-list": "Bucket List",
}

export function Header({
  onSearchOpen,
  onLogout,
  onMenuToggle,
  sidebarCollapsed,
}: {
  onSearchOpen: () => void
  onLogout?: () => void
  onMenuToggle?: () => void
  sidebarCollapsed?: boolean
}) {
  const isMobile = useMediaQuery("(max-width: 768px)")
  const pathname = usePathname()
  const { override } = usePageTitleStore()
  const pageTitle = override ?? PAGE_TITLES[pathname] ?? ""

  return (
    <>
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="sticky top-[calc(env(safe-area-inset-top,0px)+0.75rem)] z-[60] mx-3 rounded-[10px] border border-neutral-200 bg-white/80 shadow-sm shadow-neutral-900/5 backdrop-blur-xl"
      >
        <div className="flex min-h-14 items-center px-4 lg:px-6">
          {isMobile && (
            <button
              onClick={onMenuToggle}
              className="mr-3 flex h-10 w-10 items-center justify-center rounded-[10px] bg-neutral-100 text-neutral-500 transition-colors hover:bg-neutral-200 hover:text-neutral-900 "
            >
              <Menu className="h-4 w-4" />
            </button>
          )}

          <AnimatePresence mode="wait" initial={false}>
            {pageTitle && (
              <motion.h1
                key={pageTitle}
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 6 }}
                transition={{ duration: 0.18 }}
                className="text-base font-bold tracking-tight text-neutral-900 sm:text-lg"
              >
                {pageTitle}
              </motion.h1>
            )}
          </AnimatePresence>

          <div className="ml-auto flex items-center gap-1">
            <button
              onClick={onSearchOpen}
              className="relative hidden sm:flex h-10 items-center gap-2 rounded-[10px] border border-neutral-200 bg-neutral-50 pl-3 pr-2.5 text-xs text-neutral-400 transition-all hover:border-neutral-300 hover:bg-white hover:text-neutral-600 "
            >
              <Search className="h-3.5 w-3.5" />
              <span>Search...</span>
              <kbd className="ml-2 hidden rounded-[10px] border border-neutral-200 bg-white px-1.5 py-0.5 text-[10px] font-semibold text-neutral-400 shadow-sm md:inline-block">
                {"\u2318K"}
              </kbd>
            </button>

            <button
              onClick={onSearchOpen}
              className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-neutral-100 text-neutral-400 transition-colors hover:bg-neutral-200 hover:text-neutral-900 sm:hidden "
            >
              <Search className="h-4 w-4" />
            </button>




            <button
              onClick={onLogout}
              className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-neutral-100 text-neutral-400 transition-colors hover:bg-neutral-200 hover:text-neutral-900 "
              title="Logout"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </motion.header>
    </>
  )
}
