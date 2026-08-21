import { create } from "zustand"

export type ColorTheme = "dark" | "light"

type ThemeStore = {
  colorTheme: ColorTheme
  setColorTheme: (theme: ColorTheme) => void
}

const THEME_KEY = "vault-color-theme-v1"

function applyTheme(theme: ColorTheme) {
  const root = document.documentElement
  root.classList.remove("dark")

  if (theme === "dark") {
    root.classList.add("dark")
  }

  try { localStorage.setItem(THEME_KEY, theme) } catch {}
}

function getInitialTheme(): ColorTheme {
  try {
    const stored = localStorage.getItem(THEME_KEY) as ColorTheme | null
    if (stored && ["dark", "light"].includes(stored)) return stored
  } catch {}
  return "dark"
}

export const useThemeStore = create<ThemeStore>((set) => ({
  colorTheme: getInitialTheme(),
  setColorTheme: (theme: ColorTheme) => {
    applyTheme(theme)
    set({ colorTheme: theme })
  },
}))

if (typeof window !== "undefined") applyTheme(getInitialTheme())
