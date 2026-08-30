"use client"

import { useState, useEffect, useRef } from "react"
import { motion } from "framer-motion"
import Image from "next/image"
import { Loader2, Check, Sparkles } from "lucide-react"
import type { SupabaseClient } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase/client"

const OWNER_NAME = "Nikhil"
const OWNER_FIRST = "N"
const OWNER_LAST = "K"
const OWNER_SHORT = "NK"

const MANTRA = [
  "Small steps, every single day.",
  "Done is better than perfect.",
  "Your vault. Your rules.",
  "Consistency beats intensity.",
  "Own your day, own your life.",
]

function hourGreeting(): string {
  const h = new Date().getHours()
  if (h < 5) return "Working late?"
  if (h < 12) return "Good morning"
  if (h < 17) return "Good afternoon"
  if (h < 21) return "Good evening"
  return "Good night"
}

const FEATURES = [
  "Tasks, goals & habits — one place",
  "Finance, investments & goals",
  "Private to you — always",
]

function Monogram({ size = 24 }: { size?: number }) {
  return (
    <div
      className={`flex items-center justify-center rounded-xl bg-neutral-900 text-neutral-50 dark:bg-white dark:text-neutral-900`}
      style={{ height: size + 16, width: size + 16, fontSize: size * 0.5 }}
    >
      <span className="font-bold tracking-tight">{OWNER_FIRST}{OWNER_LAST}</span>
    </div>
  )
}

function FloatingOrbs() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <motion.div
        className="absolute -left-32 -top-32 h-[500px] w-[500px] rounded-full bg-gradient-to-br from-indigo-400/20 via-violet-500/10 to-transparent blur-3xl"
        animate={{ x: [0, 40, 0], y: [0, 30, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute -bottom-24 -right-24 h-[400px] w-[400px] rounded-full bg-gradient-to-tl from-neutral-500/15 via-zinc-400/10 to-transparent blur-3xl"
        animate={{ x: [0, -30, 0], y: [0, -40, 0] }}
        transition={{ duration: 22, repeat: Infinity, ease: "easeInOut", delay: 2 }}
      />
      <motion.div
        className="absolute left-1/2 top-1/3 h-[300px] w-[300px] -translate-x-1/2 rounded-full bg-gradient-to-b from-white/5 to-transparent blur-3xl"
        animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 4 }}
      />
    </div>
  )
}

function GridPattern() {
  return (
    <div className="pointer-events-none absolute inset-0 opacity-[0.04] dark:opacity-[0.07]">
      <div
        className="h-full w-full"
        style={{
          backgroundImage: `linear-gradient(rgba(120,120,120,1) 1px, transparent 1px), linear-gradient(90deg, rgba(120,120,120,1) 1px, transparent 1px)`,
          backgroundSize: "64px 64px",
        }}
      />
    </div>
  )
}

export function LoginScreen({ onAuth }: { onAuth: () => void }) {
  const supabaseRef = useRef<SupabaseClient | null>(null)
  const [ready, setReady] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [mantra, setMantra] = useState(MANTRA[0])

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

  useEffect(() => {
    setMantra(MANTRA[Math.floor(Math.random() * MANTRA.length)])
  }, [])

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
    <div className="fixed inset-0 z-[200] flex flex-col bg-neutral-950 lg:flex-row">
      {/* Left — atmosphere panel (desktop) */}
      <div className="relative hidden overflow-hidden bg-neutral-950 lg:flex lg:w-1/2">
        <GridPattern />
        <FloatingOrbs />

        <div className="relative z-10 flex flex-1 flex-col justify-between p-14">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="flex items-center gap-2.5"
          >
            <Monogram size={20} />
            <span className="text-sm font-semibold tracking-wider text-white/70">VAULT</span>
          </motion.div>

          <div>
            <motion.h2
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              className="text-4xl font-bold leading-tight tracking-tight text-white xl:text-5xl"
            >
              <span className="text-white/50">{hourGreeting()},</span>
              <br />
              {OWNER_NAME}.
              <br />
              <span className="bg-gradient-to-r from-white via-white/80 to-white/40 bg-clip-text text-transparent">
                This one&apos;s all yours.
              </span>
            </motion.h2>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.6 }}
              className="mt-8 space-y-3.5"
            >
              {FEATURES.map((f, i) => (
                <motion.div
                  key={f}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.85 + i * 0.12, duration: 0.5 }}
                  className="flex items-center gap-3 text-sm text-white/50"
                >
                  <Check className="h-3.5 w-3.5 text-white/30" />
                  <span>{f}</span>
                </motion.div>
              ))}
            </motion.div>
          </div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.6, duration: 0.8 }}
            className="text-sm italic text-white/25"
          >
            “{mantra}”
          </motion.p>
        </div>
      </div>

      {/* Right — form panel (desktop + mobile) */}
      <div className="relative flex min-h-full flex-1 flex-col items-center justify-center overflow-y-auto bg-neutral-50 px-6 py-10 dark:bg-neutral-950 lg:w-1/2 lg:py-0" style={{ paddingBottom: "max(2.5rem, env(safe-area-inset-bottom))" }}>
        {/* Mobile orb */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden lg:hidden">
          <motion.div
            className="absolute -right-20 -top-20 h-[350px] w-[350px] rounded-full bg-gradient-to-br from-indigo-400/15 to-transparent blur-3xl"
            animate={{ x: [0, 20, 0], y: [0, 15, 0] }}
            transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>

        {/* Mobile personal header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="relative z-10 mb-8 flex w-full max-w-sm flex-col items-center text-center lg:hidden"
        >
          <Image src="/Vault.png" alt="Vault" width={56} height={56} className="rounded-2xl" />
          <p className="mt-3 text-[10px] font-semibold uppercase tracking-widest text-neutral-400 dark:text-neutral-500">
            {hourGreeting()}
          </p>
          <p className="text-lg font-bold leading-tight tracking-tight text-neutral-900 dark:text-white">
            {OWNER_NAME}&apos;s Vault
          </p>
          <p className="text-[11px] text-neutral-400 dark:text-neutral-500">Your space. Sign in to open it.</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-10 w-full max-w-sm"
        >
          {/* Desktop logo mark */}
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, type: "spring", damping: 14, stiffness: 160 }}
            className="mb-8 hidden lg:flex"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-neutral-200 bg-white shadow-lg shadow-neutral-200/40 dark:border-neutral-800 dark:bg-neutral-900 dark:shadow-none">
              <Image src="/Vault.png" alt="Vault" width={28} height={28} className="rounded-md" />
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.5 }}
            className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white lg:text-left lg:text-2xl text-center"
          >
            {hourGreeting()}, {OWNER_NAME}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.5 }}
            className="mt-1.5 text-sm text-neutral-500 dark:text-neutral-400 text-center lg:text-left"
          >
            Your dashboard is waiting for you.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.5 }}
            className="mt-7"
          >
            <button
              onClick={handleGoogleLogin}
              disabled={loading || !ready}
              className="group relative w-full overflow-hidden rounded-xl border border-neutral-200 bg-white px-5 py-3.5 text-sm font-medium text-neutral-700 shadow-sm transition-all hover:shadow-lg hover:shadow-neutral-200/50 active:scale-[0.985] disabled:opacity-60 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:shadow-neutral-950/60"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-neutral-50 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 dark:via-neutral-800" />
              <div className="relative flex items-center justify-center gap-3">
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
              </div>
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

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="mt-7 flex items-center justify-center gap-1.5 text-center text-[11px] text-neutral-400 dark:text-neutral-500"
          >
            <Sparkles className="h-3 w-3" />
            Built just for you — no one else gets in.
          </motion.p>
        </motion.div>
      </div>
    </div>
  )
}