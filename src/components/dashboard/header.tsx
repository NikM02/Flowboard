"use client"

import { useState } from "react"
import { usePathname } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Search, Menu, Sun, Moon, LogOut, MoreVertical } from "lucide-react"
import { cn } from "@/lib/shadcn-utils"
import { NotificationBell } from "./notification-panel"
import { useMediaQuery } from "@/hooks/use-media-query"
import { useThemeStore } from "@/store/use-theme-store"
import { usePageTitleStore } from "@/store/use-page-title-store"

const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/tasks": "Tasks",
  "/habits": "Health",
  "/north-star": "North Star",
  "/future": "Future Self",
  "/finance": "Finance",
  "/investments": "Investments",
  "/skills": "Skills",
  "/skills/bucket-list": "Bucket List",
  "/content-hub": "Content Hub",
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { colorTheme, setColorTheme } = useThemeStore()
  const pathname = usePathname()
  const { override } = usePageTitleStore()
  const pageTitle = override ?? PAGE_TITLES[pathname] ?? ""

  return (
    <>
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="sticky top-0 z-[60] border-b border-neutral-100 bg-white/80 backdrop-blur-xl dark:border-neutral-800/50 dark:bg-neutral-950/80"
      >
        <div className="flex min-h-14 items-center px-safe pt-safe lg:px-6">
          {isMobile && (
            <button
              onClick={onMenuToggle}
              className="mr-3 flex h-10 w-10 items-center justify-center rounded-[10px] bg-neutral-100 text-neutral-500 transition-colors hover:bg-neutral-200 hover:text-neutral-900 dark:bg-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-700 dark:hover:text-neutral-50"
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
                className="text-base font-bold tracking-tight text-neutral-900 dark:text-white sm:text-lg"
              >
                {pageTitle}
              </motion.h1>
            )}
          </AnimatePresence>

          <div className="ml-auto flex items-center gap-1">
            <button
              onClick={onSearchOpen}
              className="relative hidden sm:flex h-10 items-center gap-2 rounded-[10px] border border-neutral-200 bg-neutral-50 pl-3 pr-2.5 text-xs text-neutral-400 transition-all hover:border-neutral-300 hover:bg-white hover:text-neutral-600 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-neutral-700 dark:hover:bg-neutral-800 dark:hover:text-neutral-300"
            >
              <Search className="h-3.5 w-3.5" />
              <span>Search...</span>
              <kbd className="ml-2 hidden rounded-md border border-neutral-200 bg-white px-1.5 py-0.5 text-[10px] font-semibold text-neutral-400 shadow-sm dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-500 md:inline-block">
                {"\u2318K"}
              </kbd>
            </button>

            <button
              onClick={onSearchOpen}
              className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-neutral-100 text-neutral-400 transition-colors hover:bg-neutral-200 hover:text-neutral-900 sm:hidden dark:bg-neutral-800 dark:text-neutral-500 dark:hover:bg-neutral-700 dark:hover:text-neutral-50"
            >
              <Search className="h-4 w-4" />
            </button>

            {/* Mobile: Theme toggle in a dropdown */}
            {isMobile && (
              <div className="relative">
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-[10px] transition-colors",
                    mobileMenuOpen
                      ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
                      : "bg-neutral-100 text-neutral-400 hover:bg-neutral-200 hover:text-neutral-900 dark:bg-neutral-800 dark:text-neutral-500 dark:hover:bg-neutral-700 dark:hover:text-neutral-50"
                  )}
                  title="More options"
                >
                  <MoreVertical className="h-4 w-4" />
                </button>
                <AnimatePresence>
                  {mobileMenuOpen && (
                    <>
                      <div className="fixed inset-0 z-[65]" onClick={() => setMobileMenuOpen(false)} />
                      <motion.div
                        initial={{ opacity: 0, y: -6, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -6, scale: 0.97 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 top-full z-[66] mt-2 w-52 overflow-hidden rounded-xl border border-neutral-200 bg-white p-1 shadow-xl dark:border-neutral-800 dark:bg-neutral-900"
                      >
                        <button
                          onClick={() => {
                            setMobileMenuOpen(false)
                            setColorTheme(colorTheme === "dark" ? "light" : "dark")
                          }}
                          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-neutral-800"
                        >
                          {colorTheme === "dark" ? (
                            <Sun className="h-4 w-4 shrink-0 text-amber-400" />
                          ) : (
                            <Moon className="h-4 w-4 shrink-0 text-indigo-400" />
                          )}
                          {colorTheme === "dark" ? "Light mode" : "Dark mode"}
                        </button>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            )}

            <NotificationBell />

            <button
              onClick={() => setColorTheme(colorTheme === "dark" ? "light" : "dark")}
              className="hidden md:flex h-10 w-10 items-center justify-center rounded-[10px] bg-neutral-100 text-neutral-400 transition-colors hover:bg-neutral-200 hover:text-neutral-900 dark:bg-neutral-800 dark:text-neutral-500 dark:hover:bg-neutral-700 dark:hover:text-neutral-50"
              title="Toggle theme"
            >
              {colorTheme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>

            <button
              onClick={onLogout}
              className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-neutral-100 text-neutral-400 transition-colors hover:bg-neutral-200 hover:text-neutral-900 dark:bg-neutral-800 dark:text-neutral-500 dark:hover:bg-neutral-700 dark:hover:text-neutral-50"
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
