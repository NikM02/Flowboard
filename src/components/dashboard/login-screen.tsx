"use client"

import { useState, useEffect, useRef } from "react"
import { motion } from "framer-motion"
import Image from "next/image"
import { Loader2 } from "lucide-react"
import type { SupabaseClient } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase/client"

const QUOTE = "Small steps, every single day."

export function LoginScreen({ onAuth }: { onAuth: () => void }) {
  const supabaseRef = useRef<SupabaseClient | null>(null)
  const [ready, setReady] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const oauthError = params.get("error_description") || params.get("error")
    if (oauthError) {
      setError(oauthError.replace(/\+/g, " "))
      window.history.replaceState({}, "", window.location.pathname)
    }

    try {
      const client = createClient()
      supabaseRef.current = client
      setReady(true)
      client.auth.getSession().then(({ data: { session } }) => {
        if (session) onAuth()
      })
    } catch {
      setError("Supabase configuration missing.")
    }
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
    <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center overflow-y-auto bg-neutral-950 px-6 py-12" style={{ paddingBottom: "max(2.5rem, env(safe-area-inset-bottom))" }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="flex w-full max-w-sm flex-col items-center text-center"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", damping: 14, stiffness: 160 }}
          className="flex h-20 w-20 items-center justify-center rounded-3xl border border-white/10 bg-white/5 shadow-2xl shadow-black/40"
        >
          <Image src="/Vault.png" alt="Vault" width={44} height={44} className="rounded-xl" />
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25, duration: 0.6 }}
          className="mt-8 max-w-xs text-xl font-semibold italic leading-relaxed text-white/85"
        >
          “{QUOTE}”
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="mt-10 w-full"
        >
          <button
            onClick={handleGoogleLogin}
            disabled={loading || !ready}
            className="group flex w-full items-center justify-center gap-3 rounded-2xl bg-white px-5 py-3.5 text-sm font-semibold text-neutral-800 shadow-lg shadow-black/30 transition-all hover:bg-neutral-100 active:scale-[0.985] disabled:opacity-60"
          >
            {loading ? (
              <Loader2 className="h-4.5 w-4.5 animate-spin text-neutral-400" />
            ) : (
              <svg className="h-4.5 w-4.5 shrink-0" viewBox="0 0 24 24" aria-hidden>
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
            )}
            <span>{loading ? "Signing in..." : "Continue with Google"}</span>
          </button>
        </motion.div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-600 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-400"
          >
            {error}
          </motion.div>
        )}
      </motion.div>
    </div>
  )
}