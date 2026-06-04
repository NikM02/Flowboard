import { create } from "zustand"

type ThemeStore = {
  darkMode: boolean
  toggleDarkMode: () => void
}

export const useThemeStore = create<ThemeStore>((set) => ({
  darkMode: false,
  toggleDarkMode: () =>
    set((state) => {
      const next = !state.darkMode
      if (next) {
        document.documentElement.classList.add("dark")
      } else {
        document.documentElement.classList.remove("dark")
      }
      return { darkMode: next }
    }),
}))
