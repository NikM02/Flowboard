"use client"

import { useState } from "react"
import { createPortal } from "react-dom"
import { motion, AnimatePresence } from "framer-motion"
import { Search, Send, X, Menu, Sun, Moon, LogOut } from "lucide-react"
import { NotificationBell } from "./notification-panel"
import { TelegramSettings } from "./telegram-settings"
import { IntegrationsPanel } from "./integrations-panel"
import { useMediaQuery } from "@/hooks/use-media-query"
import { useThemeStore } from "@/store/use-theme-store"

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
  const [tgOpen, setTgOpen] = useState(false)
  const { colorTheme, setColorTheme } = useThemeStore()

  return (
    <>
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="sticky top-0 z-[60] border-b border-neutral-100 bg-white/80 backdrop-blur-xl dark:border-neutral-800/50 dark:bg-neutral-950/80"
      >
        <div className="flex h-14 items-center px-4 lg:px-6">
          {isMobile && (
            <button
              onClick={onMenuToggle}
              className="mr-3 flex h-10 w-10 items-center justify-center rounded-[10px] bg-neutral-100 text-neutral-500 transition-colors hover:bg-neutral-200 hover:text-neutral-900 dark:bg-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-700 dark:hover:text-neutral-50"
            >
              <Menu className="h-4 w-4" />
            </button>
          )}

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

            <button
              onClick={() => setTgOpen(!tgOpen)}
              className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-neutral-100 text-neutral-400 transition-colors hover:bg-neutral-200 hover:text-neutral-900 dark:bg-neutral-800 dark:text-neutral-500 dark:hover:bg-neutral-700 dark:hover:text-neutral-50"
              title="Telegram Settings"
            >
              <Send className="h-4 w-4" />
            </button>

            <IntegrationsPanel />

            <NotificationBell />

            <button
              onClick={() => setColorTheme(colorTheme === "dark" ? "light" : "dark")}
              className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-neutral-100 text-neutral-400 transition-colors hover:bg-neutral-200 hover:text-neutral-900 dark:bg-neutral-800 dark:text-neutral-500 dark:hover:bg-neutral-700 dark:hover:text-neutral-50"
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

      {createPortal(
      <AnimatePresence>
        {tgOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[80] bg-neutral-950/60 backdrop-blur-sm"
              onClick={() => setTgOpen(false)}
            />
            <motion.div
              initial={{ x: "100%", opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed right-0 top-0 z-[90] h-full w-full max-w-sm border-l border-neutral-200/50 bg-white/95 backdrop-blur-xl p-5 shadow-2xl dark:border-neutral-800/50 dark:bg-neutral-900/95"
            >
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-neutral-100 dark:bg-neutral-800">
                    <Send className="h-4 w-4 text-neutral-600 dark:text-neutral-400" />
                  </div>
                  <h2 className="text-sm font-bold tracking-tight text-neutral-900 dark:text-white">Telegram</h2>
                </div>
                <button
                  onClick={() => setTgOpen(false)}
                  className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-neutral-100 text-neutral-400 transition-colors hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <TelegramSettings variant="panel" />

              <div className="mt-4 rounded-[10px] border border-neutral-200 bg-neutral-50 p-3 dark:border-neutral-800 dark:bg-neutral-900">
                <p className="mb-2 text-[11px] font-medium text-neutral-500">How to setup:</p>
                <ol className="space-y-1.5 text-[11px] text-neutral-500">
                  <li>1. Message <a href="https://t.me/BotFather" target="_blank" rel="noopener noreferrer" className="text-neutral-900 hover:underline dark:text-white">@BotFather</a> and create a bot</li>
                  <li>2. Copy the bot token and paste above</li>
                  <li>3. Message <a href="https://t.me/userinfobot" target="_blank" rel="noopener noreferrer" className="text-neutral-900 hover:underline dark:text-white">@userinfobot</a> to get your chat ID</li>
                  <li>4. Paste chat ID and click Connect</li>
                </ol>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>,
      document.body
      )}
    </>
  )
}
