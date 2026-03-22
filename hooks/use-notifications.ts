"use client"

import { useEffect } from "react"
import { requestNotificationPermission, sendPushNotification, registerServiceWorker } from "@/lib/notifications"

export function useNotifications() {
  // Request notification permission on mount
  useEffect(() => {
    requestNotificationPermission().catch((error) => {
      console.error("[v0] Error in notification hook:", error)
    })

    registerServiceWorker().catch((error) => {
      console.error("[v0] Error registering service worker:", error)
    })
  }, [])

  const notify = (title: string, body: string, tag?: string) => {
    sendPushNotification({
      title,
      body,
      tag,
    })
  }

  return { notify }
}
