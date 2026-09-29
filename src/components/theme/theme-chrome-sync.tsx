"use client"

import { useEffect } from "react"
import { useThemeStore } from "@/store/use-theme-store"

/**
 * Keeps PWA/browser-chrome colours in step with the active theme.
 * The static manifest and appleWebApp meta are dark-only, so a light
 * user would otherwise get a black status bar and splash screen.
 */
export function ThemeChromeSync() {
  const colorTheme = useThemeStore((s) => s.colorTheme)

  useEffect(() => {
    const isDark = colorTheme === "dark"
    const manifestHref = isDark ? "/manifest.webmanifest" : "/manifest-light.webmanifest"

    let link = document.querySelector<HTMLLinkElement>('link[rel="manifest"]')
    if (!link) {
      link = document.createElement("link")
      link.rel = "manifest"
      document.head.appendChild(link)
    }
    if (link.getAttribute("href") !== manifestHref) link.setAttribute("href", manifestHref)

    const appleStatusBar = document.querySelector<HTMLMetaElement>('meta[name="apple-mobile-web-app-status-bar-style"]')
    const statusBarValue = isDark ? "black-translucent" : "default"
    if (appleStatusBar) {
      appleStatusBar.setAttribute("content", statusBarValue)
    } else {
      const meta = document.createElement("meta")
      meta.name = "apple-mobile-web-app-status-bar-style"
      meta.content = statusBarValue
      document.head.appendChild(meta)
    }
  }, [colorTheme])

  return null
}
