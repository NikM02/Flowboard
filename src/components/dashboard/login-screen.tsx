"use client"

import { useState, useEffect, useRef } from "react"
import { motion } from "framer-motion"
import { Sparkles, Loader2 } from "lucide-react"
import type { SupabaseClient } from "@supabase/supabase-js"

export function LoginScreen({ onAuth }: { onAuth: () => void }) {
  const supabaseRef = useRef<SupabaseClient | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      setError("Supabase not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.")
      return
    }
    import("@/lib/supabase/client").then(({ createClient }) => {
      supabaseRef.current = createClient()
      supabaseRef.current.auth.getSession().then(({ data: { session } }) => {
        if (session) onAuth()
      })
    })
  }, [onAuth])

  const handleGoogleLogin = async () => {
    if (!supabaseRef.current) return
    setLoading(true)
    setError("")
    const { error } = await supabaseRef.current.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
    if (error) setError(error.message)
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-neutral-50 dark:bg-neutral-950">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-sm px-6"
      >
        <div className="text-center mb-10">
          <motion.div
            initial={{ scale: 0, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.2, type: "spring", damping: 18, stiffness: 200 }}
            className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-neutral-900 to-neutral-700 shadow-lg shadow-neutral-900/10 dark:from-neutral-50 dark:to-neutral-300"
          >
            <Sparkles className="h-7 w-7 text-white dark:text-neutral-900" />
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50"
          >
            FlowBoard
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="mt-2 text-sm text-neutral-500 dark:text-neutral-400"
          >
            Sign in to your dashboard
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          <button
            onClick={handleGoogleLogin}
            disabled={loading || !supabaseRef.current}
            className="group relative w-full overflow-hidden rounded-2xl border border-neutral-200 bg-white px-6 py-3.5 text-sm font-medium text-neutral-700 shadow-sm transition-all hover:border-neutral-300 hover:shadow-md hover:shadow-neutral-200/50 active:scale-[0.98] disabled:opacity-60 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:border-neutral-700 dark:hover:shadow-neutral-950/50"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-neutral-50 to-white opacity-0 transition-opacity group-hover:opacity-100 dark:from-neutral-800 dark:to-neutral-900" />
            <div className="relative flex items-center justify-center gap-3">
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin text-neutral-400" />
              ) : (
                <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
              )}
              <span className="font-semibold">{loading ? "Signing in..." : "Continue with Google"}</span>
            </div>
          </button>
        </motion.div>

        {error && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 text-center text-xs text-red-500"
          >
            {error}
          </motion.p>
        )}

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.5 }}
          className="mt-8 text-center text-[11px] text-neutral-400 dark:text-neutral-500"
        >
          Secured with Google authentication
        </motion.p>
      </motion.div>
    </div>
  )
}
