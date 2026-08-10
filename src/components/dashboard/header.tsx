"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Search, LogOut, Send, X } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
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
        className="sticky top-0 z-30 border-b border-neutral-200/60 bg-white/70 backdrop-blur-2xl dark:border-neutral-800/60 dark:bg-neutral-950/60"
      >
        <div className="flex h-14 items-center px-4 lg:px-6">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <Image src="/Nexus.png" alt="Logo" width={32} height={32} className="rounded-xl shadow-sm" />
            <span className="bg-gradient-to-r from-neutral-900 to-neutral-600 bg-clip-text text-base font-bold tracking-tight text-transparent dark:from-white dark:to-neutral-400">
              Nexus
            </span>
          </Link>

          <div className="ml-auto flex items-center gap-1.5">
            <button
              onClick={onSearchOpen}
              className="relative hidden max-w-[200px] sm:block md:max-w-sm"
            >
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                <div className="flex h-8 cursor-text items-center rounded-xl border border-neutral-200/80 bg-white/70 pl-9 pr-3 text-xs text-neutral-400 shadow-sm backdrop-blur transition-colors hover:border-neutral-300 focus:bg-white dark:border-neutral-800 dark:bg-neutral-900/70 dark:hover:border-neutral-700 dark:focus:bg-neutral-950">
                  <span>Search across all sections...</span>
                  <kbd className="ml-auto hidden rounded-md border border-neutral-200/80 bg-white px-1.5 py-0.5 text-[10px] font-medium text-neutral-400 shadow-sm dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-500 md:inline-block">
                    {"\u2318K"}
                  </kbd>
                </div>
              </div>
            </button>

            <button
              onClick={onSearchOpen}
              className="flex h-8 w-8 items-center justify-center rounded-xl text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-600 dark:hover:bg-neutral-800 sm:hidden"
            >
              <Search className="h-4 w-4" />
            </button>

            <button
              onClick={() => setTgOpen(!tgOpen)}
              className="flex h-8 w-8 items-center justify-center rounded-xl text-neutral-400 transition-colors hover:bg-blue-50 hover:text-blue-500 dark:hover:bg-neutral-800 dark:hover:text-blue-400"
              title="Telegram Settings"
            >
              <Send className="h-4 w-4" />
            </button>

            <NotificationBell />

            <button
              onClick={onLogout}
              className="flex h-8 w-8 items-center justify-center rounded-xl text-neutral-400 transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-neutral-800 dark:hover:text-red-400"
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
              className="fixed inset-0 z-50 bg-neutral-950/50 backdrop-blur-md"
              onClick={() => setTgOpen(false)}
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed right-0 top-0 z-50 h-full w-full max-w-sm border-l border-white/40 bg-white/90 p-5 shadow-2xl shadow-indigo-950/20 backdrop-blur-2xl dark:border-white/10 dark:bg-neutral-900/90"
            >
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/10">
                    <Send className="h-3.5 w-3.5 text-blue-500" />
                  </div>
                  <h2 className="text-sm font-bold tracking-tight text-neutral-900 dark:text-neutral-50">Telegram</h2>
                </div>
                <button
                  onClick={() => setTgOpen(false)}
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-neutral-400 transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-800"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <TelegramSettings variant="panel" />

              <div className="mt-4 rounded-xl border border-neutral-200/60 bg-white/60 p-3 backdrop-blur dark:border-neutral-800/60 dark:bg-white/5">
                <p className="mb-2 text-[11px] font-medium text-neutral-500">How to setup:</p>
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
