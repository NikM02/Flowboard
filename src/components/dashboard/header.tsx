"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Search, LogOut, Send, X } from "lucide-react"
import Image from "next/image"
import { NotificationBell } from "./notification-panel"
import { TelegramSettings } from "./telegram-settings"
import { useMediaQuery } from "@/hooks/use-media-query"

export function Header({
  onSearchOpen,
  onLogout,
}: {
  onSearchOpen: () => void
  onLogout?: () => void
}) {
  const isMobile = useMediaQuery("(max-width: 768px)")
  const [tgOpen, setTgOpen] = useState(false)

  return (
    <>
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="sticky top-0 z-30 border-b border-neutral-200/60 bg-white/80 backdrop-blur-xl dark:border-neutral-800/60 dark:bg-neutral-950/80"
      >
        <div className="flex h-14 items-center px-4 lg:px-6">
          <div className="flex items-center gap-2.5">
            <Image src="/Nexus.png" alt="Logo" width={32} height={32} className="rounded-lg" />
            <span className="text-base font-semibold tracking-tight text-neutral-900 dark:text-neutral-50">
              Nexus
            </span>
          </div>

          <div className="ml-auto flex items-center gap-1.5">
            <button
              onClick={onSearchOpen}
              className="relative hidden max-w-[200px] sm:block md:max-w-sm"
            >
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                <div className="flex h-8 cursor-text items-center rounded-xl border border-neutral-200 bg-neutral-50 pl-9 pr-3 text-xs text-neutral-400 transition-colors hover:border-neutral-300 focus:bg-white dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-neutral-700 dark:focus:bg-neutral-950">
                  <span>Search across all sections...</span>
                  <kbd className="ml-auto hidden rounded-md border border-neutral-200 bg-white px-1.5 py-0.5 text-[10px] font-medium text-neutral-400 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-500 md:inline-block">
                    \u2318K
                  </kbd>
                </div>
              </div>
            </button>

            <button
              onClick={onSearchOpen}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 dark:hover:bg-neutral-800 sm:hidden"
            >
              <Search className="h-4 w-4" />
            </button>

            <button
              onClick={() => setTgOpen(!tgOpen)}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-400 hover:bg-neutral-100 hover:text-blue-500 dark:hover:bg-neutral-800 dark:hover:text-blue-400 transition-colors"
              title="Telegram Settings"
            >
              <Send className="h-4 w-4" />
            </button>

            <NotificationBell />

            <button
              onClick={onLogout}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 dark:hover:bg-neutral-800 dark:hover:text-neutral-300 transition-colors"
              title="Logout"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </motion.header>

      {/* Telegram settings slide-over */}
      <AnimatePresence>
        {tgOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm"
              onClick={() => setTgOpen(false)}
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed right-0 top-0 z-50 h-full w-full max-w-sm border-l border-neutral-200/60 bg-white p-5 dark:border-neutral-800/60 dark:bg-neutral-900"
            >
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Send className="h-4 w-4 text-blue-500" />
                  <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">Telegram</h2>
                </div>
                <button
                  onClick={() => setTgOpen(false)}
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <TelegramSettings variant="panel" />

              <div className="mt-4 rounded-xl bg-neutral-50 p-3 dark:bg-neutral-800/50">
                <p className="text-[11px] font-medium text-neutral-500 mb-2">How to setup:</p>
                <ol className="space-y-1.5 text-[11px] text-neutral-500">
                  <li>1. Message <a href="https://t.me/BotFather" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-600">@BotFather</a> and create a bot</li>
                  <li>2. Copy the bot token and paste above</li>
                  <li>3. Message <a href="https://t.me/userinfobot" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-600">@userinfobot</a> to get your chat ID</li>
                  <li>4. Paste chat ID and click Connect</li>
                </ol>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
