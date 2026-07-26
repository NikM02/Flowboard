import { create } from "zustand"

type TelegramStore = {
  botToken: string
  chatId: string
  connected: boolean
  botName: string | null
  setCredentials: (botToken: string, chatId: string) => void
  setConnected: (connected: boolean, botName?: string) => void
  disconnect: () => void
}

const TOKEN_KEY = "nexus-tg-token"
const CHAT_KEY = "nexus-tg-chat"
const CONNECTED_KEY = "nexus-tg-connected"
const BOT_NAME_KEY = "nexus-tg-bot-name"

function loadState() {
  try {
    return {
      botToken: localStorage.getItem(TOKEN_KEY) || "",
      chatId: localStorage.getItem(CHAT_KEY) || "",
      connected: localStorage.getItem(CONNECTED_KEY) === "true",
      botName: localStorage.getItem(BOT_NAME_KEY) || null,
    }
  } catch {
    return { botToken: "", chatId: "", connected: false, botName: null }
  }
}

export const useTelegramStore = create<TelegramStore>((set) => ({
  ...loadState(),
  setCredentials: (botToken, chatId) => {
    try {
      localStorage.setItem(TOKEN_KEY, botToken)
      localStorage.setItem(CHAT_KEY, chatId)
    } catch {}
    set({ botToken, chatId })
  },
  setConnected: (connected, botName) => {
    try {
      localStorage.setItem(CONNECTED_KEY, String(connected))
      if (botName) localStorage.setItem(BOT_NAME_KEY, botName)
    } catch {}
    set({ connected, botName: botName || null })
  },
  disconnect: () => {
    try {
      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem(CHAT_KEY)
      localStorage.removeItem(CONNECTED_KEY)
      localStorage.removeItem(BOT_NAME_KEY)
    } catch {}
    set({ botToken: "", chatId: "", connected: false, botName: null })
  },
}))
