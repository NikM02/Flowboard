"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Send, CheckCircle2, XCircle, Loader2, Link2, Unlink,
  MessageSquare, Settings, ChevronDown, ChevronUp, ExternalLink,
} from "lucide-react"
import { useTelegramStore } from "@/store/use-telegram-store"
import { sendTelegramMessage, verifyBotToken, setWebhook, setBotCommands } from "@/lib/telegram"
import { cn } from "@/lib/shadcn-utils"

export function TelegramSettings({ variant = "panel" }: { variant?: "panel" | "inline" }) {
  const { botToken, chatId, connected, botName, setCredentials, setConnected, disconnect } = useTelegramStore()
  const [token, setToken] = useState(botToken)
  const [chat, setChat] = useState(chatId)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [expanded, setExpanded] = useState(connected ? false : true)
  const [testMsg, setTestMsg] = useState("")

  const handleConnect = async () => {
    if (!token || !chat) {
      setError("Enter both bot token and chat ID")
      return
    }
    setLoading(true)
    setError("")
    setSuccess("")

    try {
      const { valid, botName: name } = await verifyBotToken(token)
      if (!valid) {
        setError("Invalid bot token. Check it from @BotFather.")
        setLoading(false)
        return
      }

      const sent = await sendTelegramMessage(token, chat, `\u2705 <b>Vault connected!</b>\nBot: ${name}\n\nYou'll receive reminders here.`)
      if (!sent) {
        setError("Can't send to this chat ID. Message the bot first, then enter your chat ID.")
        setLoading(false)
        return
      }

      // Save connection to Supabase for webhook data access
      try {
        const tokenHash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token))
        const hashHex = Array.from(new Uint8Array(tokenHash)).map(b => b.toString(16).padStart(2, "0")).join("").slice(0, 32)
        await fetch("/api/telegram/connect", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chatId: chat, botTokenHash: hashHex, botToken: token }),
        })
      } catch {}

      // Self-heal: (re)point the webhook at THIS deployment and register the
      // command menu, so the bot survives redeploys and stale registrations.
      try {
        await setWebhook(token, `${window.location.origin}/api/telegram/webhook`)
        await setBotCommands(token)
      } catch {}

      setCredentials(token, chat)
      setConnected(true, name)
      setSuccess(`Connected to ${name}!`)
      setExpanded(false)
    } catch {
      setError("Connection failed. Try again.")
    }
    setLoading(false)
  }

  const handleDisconnect = async () => {
    disconnect()
    setToken("")
    setChat("")
    setSuccess("")
    setError("")
    setExpanded(true)
    // Remove the server-side chat mapping so the bot stops replying here
    try {
      await fetch("/api/telegram/connect", { method: "DELETE" })
    } catch {}
  }

  const handleTestMessage = async () => {
    if (!testMsg.trim()) return
    setLoading(true)
    const sent = await sendTelegramMessage(botToken, chatId, `\ud83d\udce8 <b>Test:</b> ${testMsg}`)
    if (sent) {
      setSuccess("Test message sent!")
      setTestMsg("")
    } else {
      setError("Failed to send test message")
    }
    setLoading(false)
  }

  if (variant === "inline") {
    return (
      <div className="flex items-center gap-2">
        <button
          onClick={() => setExpanded(!expanded)}
          className={cn(
            "flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all",
            connected
              ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400"
              : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-700"
          )}
        >
          {connected ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Send className="h-3.5 w-3.5" />}
          <span className="hidden sm:inline">Telegram</span>
          {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        </button>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-neutral-200/60 bg-white p-4 dark:border-neutral-800/60 dark:bg-neutral-900">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-3"
      >
        <div className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px]",
          connected ? "bg-emerald-100 dark:bg-emerald-900/30" : "bg-neutral-100 dark:bg-neutral-800"
        )}>
          <Send className={cn("h-4.5 w-4.5", connected ? "text-emerald-600 dark:text-emerald-400" : "text-neutral-500")} />
        </div>
        <div className="flex-1 text-left">
          <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">Telegram Bot</p>
          <p className="text-[11px] text-neutral-400">
            {connected ? `Connected to ${botName}` : "Send reminders to Telegram"}
          </p>
        </div>
        {expanded ? <ChevronUp className="h-4 w-4 text-neutral-400" /> : <ChevronDown className="h-4 w-4 text-neutral-400" />}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-4 space-y-3">
              {connected ? (
                <>
                  <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2 dark:bg-emerald-900/20">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
                      Connected to {botName}
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <div className="flex-1">
                      <input
                        value={testMsg}
                        onChange={(e) => setTestMsg(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleTestMessage()}
                        placeholder="Send test message..."
                        className="h-8 w-full rounded-lg border border-neutral-200 bg-neutral-50 px-2.5 text-xs dark:border-neutral-700 dark:bg-neutral-800"
                      />
                    </div>
                    <button
                      onClick={handleTestMessage}
                      disabled={loading || !testMsg.trim()}
                      className="flex h-8 items-center gap-1 rounded-lg bg-emerald-500 px-3 text-xs font-medium text-white hover:bg-emerald-600 disabled:opacity-50"
                    >
                      <Send className="h-3 w-3" />
                    </button>
                  </div>

                  <a
                    href={`https://t.me/${botName}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs text-blue-500 hover:text-blue-600"
                  >
                    <ExternalLink className="h-3 w-3" />
                    Open bot in Telegram
                  </a>

                  <button
                    onClick={handleDisconnect}
                    className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-600"
                  >
                    <Unlink className="h-3 w-3" />
                    Disconnect
                  </button>
                </>
              ) : (
                <>
                  <div>
                    <label className="mb-1 block text-[11px] font-medium text-neutral-500">
                      Bot Token
                    </label>
                    <input
                      value={token}
                      onChange={(e) => setToken(e.target.value)}
                      placeholder="1234567890:ABCdefGHI..."
                      className="h-8 w-full rounded-lg border border-neutral-200 bg-neutral-50 px-2.5 text-xs font-mono dark:border-neutral-700 dark:bg-neutral-800"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-[11px] font-medium text-neutral-500">
                      Chat ID
                    </label>
                    <input
                      value={chat}
                      onChange={(e) => setChat(e.target.value)}
                      placeholder="Your chat ID"
                      className="h-8 w-full rounded-lg border border-neutral-200 bg-neutral-50 px-2.5 text-xs font-mono dark:border-neutral-700 dark:bg-neutral-800"
                    />
                  </div>

                  <a
                    href="https://t.me/userinfobot"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-[11px] text-blue-500 hover:text-blue-600"
                  >
                    <ExternalLink className="h-3 w-3" />
                    Get your Chat ID from @userinfobot
                  </a>

                  {error && (
                    <div className="flex items-center gap-1.5 rounded-lg bg-red-50 px-2.5 py-1.5 text-xs text-red-600 dark:bg-red-900/20 dark:text-red-400">
                      <XCircle className="h-3.5 w-3.5 shrink-0" />
                      {error}
                    </div>
                  )}

                  {success && (
                    <div className="flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2.5 py-1.5 text-xs text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400">
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                      {success}
                    </div>
                  )}

                  <button
                    onClick={handleConnect}
                    disabled={loading || !token || !chat}
                    className="flex h-8 w-full items-center justify-center gap-1.5 rounded-lg bg-blue-500 text-xs font-medium text-white hover:bg-blue-600 disabled:opacity-50"
                  >
                    {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Link2 className="h-3.5 w-3.5" />}
                    Connect
                  </button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
