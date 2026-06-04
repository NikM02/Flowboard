"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Search, ListTodo, Flame, GraduationCap, Wallet, Sparkles, X, ArrowRight } from "lucide-react"
import { useTaskStore } from "@/store/use-task-store"
import { useHabitStore } from "@/store/use-habit-store"
import { useChallengeStore } from "@/store/use-challenge-store"
import { useSkillStore } from "@/store/use-skill-store"
import { useFinanceStore } from "@/store/use-finance-store"
import type { DashboardSection } from "@/types"

type SearchResult = {
  id: string
  label: string
  sublabel: string
  section: DashboardSection
  icon: typeof ListTodo
}

const sectionLabels: Record<DashboardSection, string> = {
  tasks: "Tasks",
  habits: "Habits & Challenges",
  skills: "Skills",
  finance: "Finance",
  future: "Future Self",
}

export function GlobalSearch({
  open,
  onClose,
  onNavigate,
}: {
  open: boolean
  onClose: () => void
  onNavigate: (section: DashboardSection) => void
}) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const tasks = useTaskStore((s) => s.tasks)
  const habits = useHabitStore((s) => s.habits)
  const challenges = useChallengeStore((s) => s.challenges)
  const skills = useSkillStore((s) => s.skills)
  const { incomes, expenses, sips, stocks, mutualFunds } = useFinanceStore()

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
      }
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("keydown", handler)
    return () => document.removeEventListener("keydown", handler)
  }, [onClose])

  useEffect(() => {
    if (open) {
      setQuery("")
      setResults([])
      setSelectedIndex(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  const doSearch = useCallback((q: string) => {
    setQuery(q)
    if (!q.trim()) {
      setResults([])
      return
    }
    const needle = q.toLowerCase()
    const found: SearchResult[] = []

    for (const t of tasks) {
      if (t.title.toLowerCase().includes(needle) || t.description.toLowerCase().includes(needle)) {
        found.push({ id: t.id, label: t.title, sublabel: t.description || t.priority, section: "tasks", icon: ListTodo })
      }
    }
    for (const h of habits) {
      if (h.name.toLowerCase().includes(needle) || h.description.toLowerCase().includes(needle)) {
        found.push({ id: h.id, label: h.name, sublabel: h.description || h.category, section: "habits", icon: Flame })
      }
    }
    for (const c of challenges) {
      if (c.title.toLowerCase().includes(needle) || c.description.toLowerCase().includes(needle)) {
        found.push({ id: c.id, label: c.title, sublabel: c.description || "Challenge", section: "habits", icon: Flame })
      }
    }
    for (const s of skills) {
      if (s.name.toLowerCase().includes(needle) || s.sourceDetail.toLowerCase().includes(needle) || s.notes.toLowerCase().includes(needle)) {
        found.push({ id: s.id, label: s.name, sublabel: s.sourceDetail || s.source, section: "skills", icon: GraduationCap })
      }
    }
    for (const inc of incomes) {
      if (inc.description.toLowerCase().includes(needle) || inc.source.toLowerCase().includes(needle)) {
        found.push({ id: inc.id, label: `₹${inc.amount} - ${inc.description}`, sublabel: inc.source, section: "finance", icon: Wallet })
      }
    }
    for (const exp of expenses) {
      if (exp.description.toLowerCase().includes(needle) || exp.category.toLowerCase().includes(needle)) {
        found.push({ id: exp.id, label: `₹${exp.amount} - ${exp.description}`, sublabel: exp.category, section: "finance", icon: Wallet })
      }
    }
    for (const sip of sips) {
      if (sip.name.toLowerCase().includes(needle)) {
        found.push({ id: sip.id, label: sip.name, sublabel: `₹${sip.amount}/mo`, section: "finance", icon: Wallet })
      }
    }
    for (const st of stocks) {
      if (st.name.toLowerCase().includes(needle) || st.ticker.toLowerCase().includes(needle)) {
        found.push({ id: st.id, label: st.name, sublabel: st.ticker, section: "finance", icon: Wallet })
      }
    }
    for (const mf of mutualFunds) {
      if (mf.name.toLowerCase().includes(needle) || mf.fundHouse.toLowerCase().includes(needle)) {
        found.push({ id: mf.id, label: mf.name, sublabel: mf.fundHouse, section: "finance", icon: Wallet })
      }
    }

    setResults(found.slice(0, 20))
    setSelectedIndex(0)
  }, [tasks, habits, challenges, skills, incomes, expenses, sips, stocks, mutualFunds])

  const handleSelect = (r: SearchResult) => {
    onClose()
    onNavigate(r.section)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setSelectedIndex((i) => Math.min(i + 1, results.length - 1))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setSelectedIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === "Enter" && results[selectedIndex]) {
      e.preventDefault()
      handleSelect(results[selectedIndex])
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -20 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-x-4 top-1/2 z-50 mx-auto max-w-lg -translate-y-1/2 overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-2xl dark:border-neutral-800 dark:bg-neutral-900"
          >
            <div className="flex items-center gap-3 border-b border-neutral-200 px-4 dark:border-neutral-800">
              <Search className="h-4 w-4 shrink-0 text-neutral-400" />
              <input
                ref={inputRef}
                aria-label="Search across all sections"
                value={query}
                onChange={(e) => doSearch(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search tasks, habits, skills, finance..."
                className="flex-1 bg-transparent py-4 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none dark:text-neutral-100"
              />
              <button
                onClick={onClose}
                className="rounded-lg p-1 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="max-h-80 overflow-y-auto p-2">
              {query && results.length === 0 && (
                <p className="py-8 text-center text-sm text-neutral-400">No results found</p>
              )}
              {results.length > 0 && (
                <div className="space-y-0.5">
                  {results.map((r, i) => (
                    <button
                      key={`${r.section}-${r.id}`}
                      onClick={() => handleSelect(r)}
                      onMouseEnter={() => setSelectedIndex(i)}
                      className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-all ${
                        i === selectedIndex
                          ? "bg-neutral-100 dark:bg-neutral-800"
                          : "hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
                      }`}
                    >
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-neutral-100 dark:bg-neutral-800">
                        <r.icon className="h-3.5 w-3.5 text-neutral-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-neutral-900 truncate dark:text-neutral-100">
                          {r.label}
                        </div>
                        <div className="text-xs text-neutral-400 truncate">
                          {r.sublabel} · {sectionLabels[r.section]}
                        </div>
                      </div>
                      <ArrowRight className="h-3.5 w-3.5 shrink-0 text-neutral-300" />
                    </button>
                  ))}
                </div>
              )}
              {!query && (
                <div className="py-8 text-center">
                  <Search className="mx-auto h-6 w-6 text-neutral-300 dark:text-neutral-600" />
                  <p className="mt-2 text-sm text-neutral-400">Start typing to search across all sections</p>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
