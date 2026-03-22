"use client"

export interface NotificationOptions {
  title: string
  body: string
  icon?: string
  tag?: string
  badge?: string
  url?: string
}

// Request permission from user for notifications
export async function requestNotificationPermission(): Promise<boolean> {
  if (!("Notification" in window)) {
    console.log("[v0] Browser does not support notifications")
    return false
  }

  if (Notification.permission === "granted") {
    return true
  }

  if (Notification.permission !== "denied") {
    try {
      const permission = await Notification.requestPermission()
      return permission === "granted"
    } catch (error) {
      console.error("[v0] Error requesting notification permission:", error)
      return false
    }
  }

  return false
}

// Send a browser notification
export function sendNotification(options: NotificationOptions): void {
  if (!("Notification" in window)) {
    console.log("[v0] Browser does not support notifications")
    return
  }

  if (Notification.permission !== "granted") {
    console.log("[v0] Notification permission not granted")
    return
  }

  try {
    const notification = new Notification(options.title, {
      body: options.body,
      icon: options.icon || "/logo.png",
      badge: options.badge || "/badge.png",
      tag: options.tag,
      requireInteraction: false,
    })

    // Handle notification click
    notification.onclick = () => {
      window.focus()
      notification.close()
    }
  } catch (error) {
    console.error("[v0] Error sending notification:", error)
  }
}

// Get notification permission status
export function getNotificationPermission(): NotificationPermission {
  if (!("Notification" in window)) {
    return "denied"
  }
  return Notification.permission
}

export async function registerServiceWorker(): Promise<void> {
  if (!("serviceWorker" in navigator)) {
    console.log("[v0] Service Workers not supported")
    return
  }

  try {
    const registration = await navigator.serviceWorker.register("/sw.js", {
      scope: "/",
    })
    console.log("[v0] Service Worker registered successfully")

    // Request notification permission
    if ("Notification" in window && Notification.permission === "default") {
      await Notification.requestPermission()
    }

    if ("serviceWorker" in navigator && "SyncManager" in window) {
      const reg = await navigator.serviceWorker.ready
      try {
        await reg.sync.register("sync-notifications")
        console.log("[v0] Background sync registered for notifications")
      } catch (e) {
        console.log("[v0] Background sync not available:", e)
      }
    }
  } catch (error) {
    console.error("[v0] Service Worker registration failed:", error)
  }
}

export async function sendPushNotification(options: NotificationOptions): Promise<void> {
  if (!("serviceWorker" in navigator)) {
    sendNotification(options)
    return
  }

  try {
    const registration = await navigator.serviceWorker.ready
    if (registration.active) {
      registration.active.postMessage({
        type: "SHOW_NOTIFICATION",
        payload: {
          ...options,
          url: options.url || "/",
        },
      })
    }
  } catch (error) {
    console.error("[v0] Error sending push notification:", error)
    sendNotification(options)
  }
}
