const VERSION = "vault-sw-v6"
const CACHE = `${VERSION}-core`
const OFFLINE_CACHE = `${VERSION}-offline`

const APP_SHELL = [
  "/",
  "/dashboard",
  "/tasks",
  "/habits",
  "/finance",
  "/investments",
  "/future",
  "/north-star",
  "/content-hub",
  "/skills",
  "/skills/bucket-list",
  "/offline.html",
  "/manifest.webmanifest",
  "/icon-192.png",
  "/favicon-512.png",
  "/favicon-32.png",
  "/apple-touch-icon.png",
]

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((c) => c.addAll(APP_SHELL))
      .catch(() => {})
      .then(() => self.skipWaiting())
  )
})

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((k) => k !== CACHE && k !== OFFLINE_CACHE).map((k) => caches.delete(k))
        )
      )
      .then(() => clients.claim())
  )
})

self.addEventListener("fetch", (event) => {
  const req = event.request
  if (req.method !== "GET") return
  const url = new URL(req.url)
  if (url.origin !== self.location.origin) return // API calls / push services untouched

  // Navigation: network-first, fall back to the cached shell.
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone()
          caches.open(OFFLINE_CACHE).then((c) => c.put("/offline.html", copy))
          return res
        })
        .catch(() =>
          caches.match("/offline.html").then((cached) => cached || caches.match("/dashboard"))
        )
    )
    return
  }

  // Static build assets: cache-first (instant load, works offline after first visit).
  if (url.pathname.startsWith("/_next/static") || url.pathname.startsWith("/favicon") || url.pathname === "/apple-touch-icon.png") {
    event.respondWith(
      caches.match(req).then(
        (cached) =>
          cached ||
          fetch(req).then((res) => {
            const copy = res.clone()
            caches.open(CACHE).then((c) => c.put(req, copy))
            return res
          })
      )
    )
    return
  }

  // Anything else same-origin: network-first, cache fallback.
  event.respondWith(
    fetch(req)
      .then((res) => {
        if (res.status === 200) {
          const copy = res.clone()
          caches.open(OFFLINE_CACHE).then((c) => c.put(req, copy))
        }
        return res
      })
      .catch(() => caches.match(req))
  )
})

self.addEventListener("push", (event) => {
  let data = {}
  try {
    data = event.data ? event.data.json() : {}
  } catch {
    data = { title: "Vault", body: event.data ? event.data.text() : "" }
  }
  const {
    title = "Vault",
    body = "",
    href = "/dashboard",
    tag,
    rmd = false,
    kind,
  } = data

  const actions = []
  if (rmd) {
    if (kind === "task" || kind === "todo" || kind === "goal" || kind === "bucket") {
      actions.push({ action: "done", title: "\u2713 Done" })
      actions.push({ action: "snooze", title: "+5 min" })
    } else if (kind === "habit") {
      actions.push({ action: "done", title: "\u2713 Log" })
      actions.push({ action: "snooze", title: "+5 min" })
    } else {
      actions.push({ action: "open", title: "Open" })
      actions.push({ action: "snooze", title: "+5 min" })
    }
  }

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: "/icon-192.png",
      badge: "/favicon-32.png",
      tag: tag || `vf-${Date.now()}`,
      vibrate: [100, 50, 100],
      data,
      actions,
      silent: false,
    })
  )
})

self.addEventListener("notificationclick", (event) => {
  event.notification.close()
  const data = event.notification.data || {}
  const action = event.action || "open"
  const href = data.href || "/dashboard"

  const isActionButtons = action === "done" || action === "snooze" || action === "ok"

  // Plain taps (and any non-action button) open the app.
  if (action === "open" || !isActionButtons) {
    event.waitUntil(
      (async () => {
        const all = await clients.matchAll({ type: "window", includeUncontrolled: true })
        for (const c of all) {
          if ("navigate" in c) {
            try {
              await c.navigate(href)
              await c.focus()
              return
            } catch {}
          }
        }
        await clients.openWindow(href)
      })()
    )
    return
  }

  // Action buttons (Done / Snooze / OK) are handled server-side so they work
  // even when the app is closed. "ok" just dismisses — no navigation.
  event.waitUntil(
    fetch("/api/notifications/action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        action === "snooze" || action === "ok"
          ? { uid: data.uid, kind: data.kind, id: data.id, action, minutes: 5 }
          : { uid: data.uid, kind: data.kind, id: data.id, action }
      ),
    }).catch(() => {
      if (action === "snooze") clients.openWindow(href)
    })
  )
})

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "vault-refresh") {
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((all) => {
      all.forEach((c) => c.postMessage({ type: "vault-refresh" }))
    })
  }
  if (event.data && event.data.type === "vault-skip-waiting") {
    self.skipWaiting()
  }
})