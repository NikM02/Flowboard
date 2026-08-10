import { create } from "zustand"

export type ColorTheme = "dark" | "light" | "ocean" | "aurora" | "sunset"

type ThemeStore = {
  colorTheme: ColorTheme
  setColorTheme: (theme: ColorTheme) => void
}

const THEME_KEY = "nexus-color-theme"

function applyTheme(theme: ColorTheme) {
  const root = document.documentElement
  root.classList.remove("dark", "theme-ocean", "theme-aurora", "theme-sunset")

  if (theme === "dark") {
    root.classList.add("dark")
  } else if (theme === "ocean") {
    root.classList.add("dark", "theme-ocean")
  } else if (theme === "aurora") {
    root.classList.add("theme-aurora")
  } else if (theme === "sunset") {
    root.classList.add("dark", "theme-sunset")
  }

  try { localStorage.setItem(THEME_KEY, theme) } catch {}
}

function getInitialTheme(): ColorTheme {
  try {
    const stored = localStorage.getItem(THEME_KEY) as ColorTheme | null
    if (stored && ["dark", "light", "ocean", "aurora", "sunset"].includes(stored)) return stored
  } catch {}
  return "light"
}

export const useThemeStore = create<ThemeStore>((set) => ({
  colorTheme: getInitialTheme(),
  setColorTheme: (theme: ColorTheme) => {
    applyTheme(theme)
    set({ colorTheme: theme })
  },
}))

if (typeof window !== "undefined") applyTheme(getInitialTheme())
