"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Plug, Mail, CalendarDays, CheckCircle2, XCircle, Loader2,
  Unlink, ExternalLink, ShieldCheck,
} from "lucide-react"
import { useEmailStore } from "@/store/use-email-store"
import { useCalendarStore } from "@/store/use-calendar-store"
import { cn } from "@/lib/shadcn-utils"

function Toggle({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label: string
  description: string
}) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between gap-2 rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-left transition-colors hover:bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:bg-neutral-800"
    >
      <div className="min-w-0">
        <p className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">{label}</p>
        <p className="text-[10px] text-neutral-500 dark:text-neutral-400">{description}</p>
      </div>
      <span
        className={cn(
          "relative h-5 w-9 shrink-0 rounded-full transition-colors",
          checked ? "bg-indigo-500" : "bg-neutral-300 dark:bg-neutral-700"
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all",
            checked ? "left-[18px]" : "left-0.5"
          )}
        />
      </span>
    </button>
  )
}

function Step({ children }: { children: React.ReactNode }) {
  return <li className="flex gap-2 text-[11px] leading-relaxed text-neutral-500 dark:text-neutral-400">{children}</li>
}

export function IntegrationsPanel() {
  const email = useEmailStore()
  const calendar = useCalendarStore()
  const [open, setOpen] = useState(false)
  const [notice, setNotice] = useState("")

  useEffect(() => {
    if (open) {
      email.load()
      calendar.load()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const handleEmailSave = async () => {
    const ok = await email.save()
    if (ok) {
      setNotice("Email connected — test message sent. Check your inbox.")
      setTimeout(() => setNotice(""), 6000)
    }
  }

  const handleEmailTest = async () => {
    const res = await fetch("/api/email/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subject: "Test from Nexus", bodyHtml: "This is a test email from Nexus. All working!", category: "test" }),
    })
    setNotice(res.ok ? "Test email sent!" : "Test failed — check your app password.")
    setTimeout(() => setNotice(""), 6000)
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-neutral-100 text-neutral-500 transition-colors hover:bg-neutral-200 hover:text-neutral-900 dark:bg-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-700 dark:hover:text-neutral-50"
        title="Integrations"
      >
        <Plug className="h-4 w-4" />
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-neutral-950/50"
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed right-0 top-0 z-50 h-full w-full max-w-sm overflow-y-auto border-l border-neutral-200 bg-white p-5 shadow-2xl dark:border-neutral-800 dark:bg-neutral-900"
            >
              <div className="mb-5 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-neutral-100 dark:bg-neutral-800">
                    <Plug className="h-4 w-4 text-indigo-500" />
                  </div>
                  <h2 className="text-sm font-bold tracking-tight text-neutral-900 dark:text-neutral-50">Integrations</h2>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-neutral-100 text-neutral-400 transition-colors hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700"
                >
                  <XCircle className="h-4 w-4" />
                </button>
              </div>

              {notice && (
                <div className="mb-4 flex items-center gap-1.5 rounded-xl bg-indigo-50 px-3 py-2 text-xs text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300">
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                  {notice}
                </div>
              )}

              <div className="space-y-4">
                {/* ── Email ── */}
                <section className="rounded-2xl border border-neutral-200/60 bg-white p-4 dark:border-neutral-800/60 dark:bg-neutral-900">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px]",
                      email.configured ? "bg-emerald-100 dark:bg-emerald-900/30" : "bg-neutral-100 dark:bg-neutral-800"
                    )}>
                      <Mail className={cn("h-4 w-4", email.configured ? "text-emerald-600 dark:text-emerald-400" : "text-neutral-500")} />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">Email notifications</p>
                      <p className="text-[11px] text-neutral-400">
                        {email.configured ? `To ${email.recipient}` : "Mail me on new & due items"}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 space-y-3">
                    {email.configured ? (
                      <>
                        <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2 dark:bg-emerald-900/20">
                          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                          <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
                            Connected — {email.smtpUser}
                          </span>
                        </div>

                        <Toggle
                          checked={email.notifyNew}
                          onChange={(v) => email.set({ notifyNew: v })}
                          label="New items"
                          description="When a task, habit or finance entry is added"
                        />
                        <Toggle
                          checked={email.notifyUpdates}
                          onChange={(v) => email.set({ notifyUpdates: v })}
                          label="Updates"
                          description="When something is completed or changes"
                        />
                        <Toggle
                          checked={email.notifyDue}
                          onChange={(v) => email.set({ notifyDue: v })}
                          label="Due reminders"
                          description="When a task is due soon or overdue"
                        />

                        <div className="flex gap-2 pt-1">
                          <button
                            onClick={handleEmailTest}
                            className="flex h-8 flex-1 items-center justify-center gap-1.5 rounded-lg border border-neutral-200 bg-white text-xs font-medium text-neutral-900 hover:bg-neutral-900 hover:text-white hover:border-neutral-900 dark:border-neutral-800 dark:bg-neutral-950 dark:text-white dark:hover:bg-white dark:hover:text-neutral-900 dark:hover:border-neutral-200"
                          >
                            <Mail className="h-3 w-3" /> Test email
                          </button>
                          <button
                            onClick={async () => { await email.disconnect(); setNotice("Email disconnected") }}
                            className="flex h-8 items-center gap-1.5 rounded-lg px-3 text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                          >
                            <Unlink className="h-3 w-3" /> Disconnect
                          </button>
                        </div>
                        <button
                          onClick={handleEmailSave}
                          className="flex h-8 w-full items-center justify-center rounded-lg bg-indigo-500 text-xs font-medium text-white hover:bg-indigo-600"
                        >
                          Save changes
                        </button>
                      </>
                    ) : (
                      <>
                        <div>
                          <label className="mb-1 block text-[11px] font-medium text-neutral-500">Gmail address</label>
                          <input
                            value={email.smtpUser}
                            onChange={(e) => email.set({ smtpUser: e.target.value })}
                            placeholder="you@gmail.com"
                            className="h-8 w-full rounded-lg border border-neutral-200 bg-neutral-50 px-2.5 text-xs dark:border-neutral-700 dark:bg-neutral-800"
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-[11px] font-medium text-neutral-500">App password</label>
                          <input
                            type="password"
                            value={email.appPassword}
                            onChange={(e) => email.set({ appPassword: e.target.value })}
                            placeholder="16-character app password"
                            className="h-8 w-full rounded-lg border border-neutral-200 bg-neutral-50 px-2.5 text-xs font-mono dark:border-neutral-700 dark:bg-neutral-800"
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-[11px] font-medium text-neutral-500">Send to (optional)</label>
                          <input
                            value={email.recipient}
                            onChange={(e) => email.set({ recipient: e.target.value })}
                            placeholder="you@gmail.com"
                            className="h-8 w-full rounded-lg border border-neutral-200 bg-neutral-50 px-2.5 text-xs dark:border-neutral-700 dark:bg-neutral-800"
                          />
                        </div>

                        <details className="rounded-xl bg-neutral-50 p-3 dark:bg-neutral-900">
                          <summary className="flex cursor-pointer items-center gap-1.5 text-[11px] font-medium text-neutral-500">
                            <ShieldCheck className="h-3 w-3" /> How to get an app password (2 mins)
                          </summary>
                          <ol className="mt-2 space-y-1.5">
                            <Step>1. Turn on 2-Step Verification at myaccount.google.com/security</Step>
                            <Step>2. Go to myaccount.google.com → Security → App passwords</Step>
                            <Step>3. Create a password for &quot;Mail&quot; — copy the 16-character code</Step>
                            <Step>4. Paste it above. Your normal Gmail password won&apos;t work.</Step>
                          </ol>
                        </details>

                        {email.error && (
                          <div className="flex items-center gap-1.5 rounded-lg bg-red-50 px-2.5 py-1.5 text-xs text-red-600 dark:bg-red-900/20 dark:text-red-400">
                            <XCircle className="h-3.5 w-3.5 shrink-0" />
                            {email.error}
                          </div>
                        )}

                        <button
                          onClick={handleEmailSave}
                          disabled={email.connecting || !email.smtpUser || !email.appPassword}
                          className="flex h-8 w-full items-center justify-center gap-1.5 rounded-lg bg-indigo-500 text-xs font-medium text-white hover:bg-indigo-600 disabled:opacity-50"
                        >
                          {email.connecting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Mail className="h-3.5 w-3.5" />}
                          Connect email
                        </button>
                      </>
                    )}
                  </div>
                </section>

                {/* ── Google Calendar ── */}
                <section className="rounded-2xl border border-neutral-200/60 bg-white p-4 dark:border-neutral-800/60 dark:bg-neutral-900">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px]",
                      calendar.connected ? "bg-emerald-100 dark:bg-emerald-900/30" : "bg-neutral-100 dark:bg-neutral-800"
                    )}>
                      <CalendarDays className={cn("h-4 w-4", calendar.connected ? "text-emerald-600 dark:text-emerald-400" : "text-neutral-500")} />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">Google Calendar</p>
                      <p className="text-[11px] text-neutral-400">
                        {calendar.connected ? `Synced as ${calendar.email}` : "Tasks with due dates appear there"}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 space-y-3">
                    {calendar.connected ? (
                      <>
                        <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2 dark:bg-emerald-900/20">
                          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                          <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
                            Connected — {calendar.email}
                          </span>
                        </div>
                        <p className="text-[11px] text-neutral-400">
                          Tasks with a due date are kept in sync automatically. Completing a task removes its event.
                        </p>
                        <button
                          onClick={async () => { await calendar.disconnect(); setNotice("Calendar disconnected") }}
                          className="flex h-8 w-full items-center justify-center gap-1.5 rounded-lg border border-red-200 text-xs text-red-500 hover:bg-red-50 dark:border-red-900/30 dark:hover:bg-red-900/20"
                        >
                          <Unlink className="h-3 w-3" /> Disconnect
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={calendar.connect}
                          disabled={calendar.checking}
                          className="flex h-8 w-full items-center justify-center gap-1.5 rounded-lg bg-indigo-500 text-xs font-medium text-white hover:bg-indigo-600 disabled:opacity-50"
                        >
                          {calendar.checking ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CalendarDays className="h-3.5 w-3.5" />}
                          Connect Google Calendar
                        </button>
                        {calendar.error && (
                          <div className="flex items-center gap-1.5 rounded-lg bg-amber-50 px-2.5 py-1.5 text-xs text-amber-700 dark:bg-amber-900/20 dark:text-amber-400">
                            <XCircle className="h-3.5 w-3.5 shrink-0" />
                            {calendar.error}
                          </div>
                        )}
                        <details className="rounded-xl bg-neutral-50 p-3 dark:bg-neutral-900">
                          <summary className="flex cursor-pointer items-center gap-1.5 text-[11px] font-medium text-neutral-500">
                            <ExternalLink className="h-3 w-3" /> One-time setup: Google Cloud (free)
                          </summary>
                          <ol className="mt-2 space-y-1.5">
                            <Step>1. Go to console.cloud.google.com → create a project</Step>
                            <Step>2. Enable &quot;Google Calendar API&quot;</Step>
                            <Step>3. Create OAuth client ID &rarr; &quot;Web application&quot;</Step>
                            <Step>4. Add redirect URI: <span className="font-mono text-neutral-700 dark:text-neutral-300">{`${typeof window !== "undefined" ? window.location.origin : ""}/api/calendar/oauth/callback`}</span></Step>
                            <Step>5. Copy the Client ID & Secret into your server env as GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET</Step>
                          </ol>
                        </details>
                      </>
                    )}
                  </div>
                </section>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
