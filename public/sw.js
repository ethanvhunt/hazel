self.addEventListener("install", () => {
  self.skipWaiting()
})

self.addEventListener("activate", (event) => {
  event.waitUntil(clients.claim())
})

self.addEventListener("message", (event) => {
  if (event.data.type === "SHOW_NOTIFICATION") {
    const { title, body, icon, badge, tag, actions } = event.data.payload

    const options = {
      body,
      icon: icon || "/logo.png",
      badge: badge || "/badge.png",
      tag: tag || "ticket-notification",
      requireInteraction: true,
      vibrate: [200, 100, 200],
      data: {
        dateOfArrival: Date.now(),
        primaryKey: 1,
        url: event.data.payload.url || "/",
      },
    }

    self.registration.showNotification(title, options)
  }
})

self.addEventListener("notificationclick", (event) => {
  event.notification.close()

  const urlToOpen = event.notification.data?.url || "/"

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i]
        if (client.url === urlToOpen && "focus" in client) {
          return client.focus()
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen)
      }
    }),
  )
})

self.addEventListener("notificationclose", (event) => {
  console.log("[v0] Notification closed:", event.notification.tag)
})

self.addEventListener("push", (event) => {
  if (!event.data) {
    console.log("[v0] Push notification with no data")
    return
  }

  let data = {}
  try {
    data = event.data.json()
  } catch (e) {
    console.log("[v0] Failed to parse push data:", e)
  }

  const { title, body, icon, badge, tag, url } = data

  const options = {
    body: body || "You have a new notification",
    icon: icon || "/logo.png",
    badge: badge || "/badge.png",
    tag: tag || "push-notification",
    requireInteraction: true,
    vibrate: [200, 100, 200],
    data: {
      url: url || "/",
    },
  }

  event.waitUntil(self.registration.showNotification(title || "IT Solutions", options))
})

self.addEventListener("sync", (event) => {
  if (event.tag === "sync-notifications") {
    event.waitUntil(syncNotifications())
  }
})

async function syncNotifications() {
  try {
    const response = await fetch("/api/real-time-events", {
      credentials: "include",
    })
    if (response.ok) {
      const data = await response.json()
      console.log("[v0] Synced notifications from offline:", data)
    }
  } catch (error) {
    console.error("[v0] Background sync error:", error)
  }
}
