self.addEventListener("install", () => {
  self.skipWaiting()
})

self.addEventListener("activate", (event) => {
  event.waitUntil(clients.claim())
})

self.addEventListener("push", (event) => {
  let data = {}
  try {
    data = event.data ? event.data.json() : {}
  } catch {
    data = { title: "Vault", body: event.data ? event.data.text() : "" }
  }
  const { title = "Vault", body = "", href = "/dashboard", tag } = data
  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: "/icon-192.png",
      badge: "/favicon-32.png",
      tag: tag || `vf-${Date.now()}`,
      vibrate: [100, 50, 100],
      data: { href },
      silent: false,
    })
  )
})

self.addEventListener("notificationclick", (event) => {
  event.notification.close()
  const href = (event.notification.data && event.notification.data.href) || "/dashboard"
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
})