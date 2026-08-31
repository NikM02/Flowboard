"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Share, Smartphone, Home, BellRing, Download, X } from "lucide-react"

type Props = {
  open: boolean
  onClose: () => void
  isIOS: boolean
  canPrompt: boolean
  onPrompt: () => void
  onEnablePush: () => void
}

export function PwaInstallSheet({ open, onClose, isIOS, canPrompt, onPrompt, onEnablePush }: Props) {
  const [standalone, setStandalone] = useState(false)

  useEffect(() => {
    const mql = window.matchMedia("(display-mode: standalone)")
    setStandalone(mql.matches || (navigator as Navigator & { standalone?: boolean }).standalone === true)
    const onChange = (e: MediaQueryListEvent) => setStandalone(e.matches)
    mql.addEventListener("change", onChange)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  const isDark = true // app is dark-only today

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[180] bg-neutral-950/70 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ type: "spring", damping: 30, stiffness: 340 }}
            className="fixed inset-x-0 bottom-0 z-[190] mx-auto max-w-lg rounded-t-3xl border border-b-0 border-neutral-200/60 bg-white p-5 pb-safe dark:border-neutral-800/60 dark:bg-neutral-900 md:bottom-6 md:rounded-3xl md:border"
          >
            <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-neutral-200 dark:bg-neutral-700" />
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-base font-bold text-neutral-900 dark:text-white">
                  {standalone ? "Alerts are about to work" : "Install Vault"}
                </h3>
                <p className="mt-0.5 text-sm text-neutral-500 dark:text-neutral-400">
                  {standalone
                    ? "Turn on notifications so reminders reach you like a normal app."
                    : "Get reminders and badge alerts even when the app is closed."}
                </p>
              </div>
              <button
                onClick={onClose}
                className="rounded-xl p-2 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-700 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {!standalone && (
              <div className="mt-5 space-y-3">
                {isIOS ? (
                  <>
                    <Step
                      icon={<Share className="h-4 w-4" />}
                      title="Tap the Share button"
                      subtitle={`In Safari's toolbar at the bottom${isDark ? ", below your open tab" : ""}.`}
                    />
                    <Step
                      icon={<Home className="h-4 w-4" />}
                      title="Choose Add to Home Screen"
                      subtitle='Scroll down the share sheet and tap "Add to Home Screen".'
                    />
                    <Step
                      icon={<BellRing className="h-4 w-4" />}
                      title="Open Vault, then allow alerts"
                      subtitle="It moves to your Home Screen like a real app — open it and we'll handle the rest."
                    />
                  </>
                ) : (
                  <>
                    <Step
                      icon={<Download className="h-4 w-4" />}
                      title="Tap the install button below"
                      subtitle="Chrome / Edge / Samsung Internet will add Vault to your Home Screen."
                    />
                    <Step
                      icon={<BellRing className="h-4 w-4" />}
                      title="Allow notifications"
                      subtitle="Once installed you'll get reminders exactly like a native app."
                    />
                  </>
                )}
              </div>
            )}

            <div className="mt-6 grid grid-cols-2 gap-3">
              {!standalone &&
                (isIOS ? (
                  <button
                    onClick={onClose}
                    className="col-span-1 flex items-center justify-center gap-2 rounded-2xl border border-neutral-200 px-4 py-3.5 text-sm font-semibold text-neutral-700 transition-colors hover:bg-neutral-100 dark:border-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-800"
                  >
                    <Smartphone className="h-4 w-4" /> I've installed it
                  </button>
                ) : (
                  <button
                    onClick={canPrompt ? onPrompt : undefined}
                    className="col-span-1 flex items-center justify-center gap-2 rounded-2xl border border-neutral-200 px-4 py-3.5 text-sm font-semibold text-neutral-700 transition-colors hover:bg-neutral-100 disabled:opacity-50 dark:border-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-800"
                  >
                    <Download className="h-4 w-4" /> Install app
                  </button>
                ))}

              <button
                onClick={() => {
                  onEnablePush()
                  onClose()
                }}
                className="col-span-2 flex items-center justify-center gap-2 rounded-2xl bg-neutral-900 px-4 py-3.5 text-sm font-semibold text-white transition-all hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200 md:col-span-1"
              >
                <BellRing className="h-4 w-4" /> Enable alerts
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

function Step({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle: string }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-neutral-100 bg-neutral-50 p-3 dark:border-neutral-800 dark:bg-neutral-800/50">
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900">
        {icon}
      </div>
      <div>
        <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{title}</p>
        <p className="text-xs text-neutral-500 dark:text-neutral-400">{subtitle}</p>
      </div>
    </div>
  )
}