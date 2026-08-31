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

  if (action === "open" || (action !== "done" && action !== "snooze")) {
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

  // Action buttons mutate data server-side (works with the app closed).
  const body = {
    uid: data.uid,
    kind: data.kind,
    id: data.id,
    action,
    minutes: 5,
  }
  event.waitUntil(
    fetch("/api/notifications/action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
      .then((res) => {
        if (!res.ok) throw new Error("action failed")
        if (action === "done") {
          // Reflect the new state in an open window if any.
          clients.matchAll({ type: "window", includeUncontrolled: true }).then((all) => {
            all.forEach((c) => {
              if ("navigate" in c) {
                c.postMessage({ type: "vault-refresh" })
              }
            })
          })
        }
      })
      .catch(() => {
        // Offline / failed: open the app as fallback.
        clients.openWindow(href)
      })
  )
})

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "vault-refresh") {
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((all) => {
      all.forEach((c) => c.postMessage({ type: "vault-refresh" }))
    })
  }
})