"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Lock, Sparkles, Eye, EyeOff } from "lucide-react"

const PASSWORD = "Flow2368$"

export function LoginScreen({ onAuth }: { onAuth: () => void }) {
  const [password, setPassword] = useState("")
  const [error, setError] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const authed = localStorage.getItem("arise-auth") === "true"
    if (authed) onAuth()
  }, [onAuth])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (password === PASSWORD) {
      setLoading(true)
      localStorage.setItem("arise-auth", "true")
      setTimeout(() => onAuth(), 400)
    } else {
      setError(true)
      setPassword("")
      setTimeout(() => setError(false), 1500)
    }
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-neutral-50 dark:bg-neutral-950">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-sm px-6"
      >
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", damping: 15 }}
            className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-neutral-900 dark:bg-neutral-50"
          >
            <Sparkles className="h-6 w-6 text-white dark:text-neutral-900" />
          </motion.div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">
            FlowBoard
          </h1>
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
            Enter password to continue
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                autoFocus
                className="w-full h-11 rounded-xl border border-neutral-200 bg-white pl-10 pr-10 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-400 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-100 dark:placeholder:text-neutral-500 dark:focus:ring-neutral-600"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <AnimatePresence>
              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mt-1.5 text-xs text-red-500"
                >
                  Incorrect password
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          <button
            type="submit"
            disabled={!password || loading}
            className="w-full h-11 rounded-xl bg-neutral-900 text-sm font-semibold text-white transition-all hover:bg-neutral-800 disabled:opacity-40 dark:bg-neutral-50 dark:text-neutral-900 dark:hover:bg-neutral-200"
          >
            {loading ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="mx-auto h-4 w-4 rounded-full border-2 border-white border-t-transparent dark:border-neutral-900 dark:border-t-transparent"
              />
            ) : (
              "Unlock"
            )}
          </button>
        </form>
      </motion.div>
    </div>
  )
}
