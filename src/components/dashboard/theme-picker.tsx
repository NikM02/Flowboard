"use client"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Sun, Moon, Droplets, Sparkles, Flame, Check, X } from "lucide-react"
import { useThemeStore, type ColorTheme } from "@/store/use-theme-store"
import { cn } from "@/lib/shadcn-utils"

const themes: { key: ColorTheme; label: string; icon: typeof Sun; gradient: string }[] = [
  { key: "dark", label: "Midnight", icon: Moon, gradient: "linear-gradient(135deg, #171717, #0a0a0a)" },
  { key: "light", label: "Cloud", icon: Sun, gradient: "linear-gradient(135deg, #ffffff, #f5f5f5)" },
  { key: "ocean", label: "Ocean", icon: Droplets, gradient: "linear-gradient(135deg, #061828, #0a2848, #0d3060)" },
  { key: "aurora", label: "Aurora", icon: Sparkles, gradient: "linear-gradient(135deg, #e8e0f8, #d8e8f8, #e0f0ee, #f8e8f0)" },
  { key: "sunset", label: "Sunset", icon: Flame, gradient: "linear-gradient(135deg, #1e0e08, #2a1810, #3a2018)" },
]

export function ThemePicker({ variant = "desktop" }: { variant?: "desktop" | "mobile" }) {
  const [open, setOpen] = useState(false)
  const { colorTheme, setColorTheme } = useThemeStore()
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [open])

  if (variant === "mobile") {
    return (
      <div ref={ref} className="relative">
        <button
          onClick={() => setOpen(!open)}
          className={cn(
            "flex flex-col items-center gap-0.5 rounded-xl px-3 py-1.5 text-[10px] font-medium transition-all duration-200",
            open
              ? "text-neutral-900 dark:text-neutral-50"
              : "text-neutral-400 hover:text-neutral-600 dark:text-neutral-500 dark:hover:text-neutral-300"
          )}
        >
          <div
            className="h-5 w-5 rounded-full shadow-sm ring-1 ring-white/20"
            style={{ background: themes.find((t) => t.key === colorTheme)?.gradient }}
          />
          <span>Theme</span>
        </button>

        <AnimatePresence>
          {open && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm md:hidden"
                onClick={() => setOpen(false)}
              />
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.9 }}
                transition={{ type: "spring", damping: 25, stiffness: 350 }}
                className="fixed bottom-20 left-4 right-4 z-50 rounded-2xl border border-neutral-200/60 bg-white p-4 shadow-2xl dark:border-neutral-800/60 dark:bg-neutral-900 md:hidden"
              >
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">Theme</span>
                  <button onClick={() => setOpen(false)} className="text-neutral-400 hover:text-neutral-600">
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="grid grid-cols-5 gap-2">
                  {themes.map((t) => {
                    const Icon = t.icon
                    const isActive = colorTheme === t.key
                    return (
                      <button
                        key={t.key}
                        onClick={() => { setColorTheme(t.key); setOpen(false) }}
                        className="flex flex-col items-center gap-1.5"
                      >
                        <div
                          className={cn(
                            "relative h-10 w-10 rounded-xl shadow-md transition-all",
                            isActive && "ring-2 ring-emerald-500 ring-offset-2 ring-offset-white dark:ring-offset-neutral-900"
                          )}
                          style={{ background: t.gradient }}
                        >
                          <Icon className="absolute inset-0 m-auto h-4 w-4 text-white drop-shadow-sm" />
                          {isActive && (
                            <div className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500">
                              <Check className="h-2.5 w-2.5 text-white" />
                            </div>
                          )}
                        </div>
                        <span className="text-[9px] font-medium text-neutral-600 dark:text-neutral-400">{t.label}</span>
                      </button>
                    )
                  })}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    )
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-lg border border-neutral-200 text-neutral-600 transition-all hover:shadow-xl dark:bg-neutral-800 dark:border-neutral-700 dark:text-neutral-300"
        title="Change theme"
      >
        <div
          className="h-5 w-5 rounded-full shadow-inner"
          style={{ background: themes.find((t) => t.key === colorTheme)?.gradient }}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 8 }}
            transition={{ type: "spring", damping: 25, stiffness: 350 }}
            className="absolute bottom-14 right-0 z-50 w-52 rounded-2xl border border-neutral-200/60 bg-white p-2.5 shadow-2xl dark:border-neutral-800/60 dark:bg-neutral-900"
          >
            <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-neutral-400">Theme</p>
            <div className="mt-1 space-y-0.5">
              {themes.map((t) => {
                const Icon = t.icon
                const isActive = colorTheme === t.key
                return (
                  <button
                    key={t.key}
                    onClick={() => { setColorTheme(t.key); setOpen(false) }}
                    className={cn(
                      "flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left transition-all",
                      isActive
                        ? "bg-neutral-100 dark:bg-neutral-800"
                        : "hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
                    )}
                  >
                    <div
                      className={cn(
                        "h-7 w-7 shrink-0 rounded-lg shadow-md transition-all",
                        isActive && "ring-2 ring-emerald-500 ring-offset-1 ring-offset-white dark:ring-offset-neutral-900"
                      )}
                      style={{ background: t.gradient }}
                    >
                      <div className="flex h-full w-full items-center justify-center">
                        <Icon className="h-3.5 w-3.5 text-white drop-shadow-sm" />
                      </div>
                    </div>
                    <span className="text-xs font-medium text-neutral-900 dark:text-neutral-50">{t.label}</span>
                    {isActive && <Check className="ml-auto h-3.5 w-3.5 text-emerald-500" />}
                  </button>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
