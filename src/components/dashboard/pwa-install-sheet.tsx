"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Share, Smartphone, Home, Download, X } from "lucide-react"

type Props = {
  open: boolean
  onClose: () => void
  isIOS: boolean
  canPrompt: boolean
  onPrompt: () => void
}

export function PwaInstallSheet({ open, onClose, isIOS, canPrompt, onPrompt }: Props) {
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
                  Install Vault
                </h3>
                <p className="mt-0.5 text-sm text-neutral-500 dark:text-neutral-400">
                  Add Vault to your Home Screen for quick access and a badge little bell icon.
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
                  </>
                ) : (
                  <>
                    <Step
                      icon={<Download className="h-4 w-4" />}
                      title="Tap the install button below"
                      subtitle="Chrome / Edge / Samsung Internet will add Vault to your Home Screen."
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

              {!standalone && (
                <button
                  onClick={onClose}
                  className={"col-span-2 flex items-center justify-center gap-2 rounded-2xl bg-neutral-900 px-4 py-3.5 text-sm font-semibold text-white transition-all hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200 md:col-span-1"}
                >
                  Not now
                </button>
              )}
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