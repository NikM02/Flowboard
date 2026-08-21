import { create } from "zustand"

interface PageTitleState {
  override: string | null
  setPageTitle: (title: string | null) => void
}

export const usePageTitleStore = create<PageTitleState>((set) => ({
  override: null,
  setPageTitle: (override) => set({ override }),
}))
