"use client"

import { useEffect, useState, useCallback } from "react"
import { sendNotification } from "@/lib/notifications"

export function useRealTimeEvents(userType: "team" | "customer" | null) {
  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [lastEventIds, setLastEventIds] = useState<Set<string>>(new Set())

  const fetchEvents = useCallback(async () => {
    if (!userType) return

    try {
      setLoading(true)
      const response = await fetch("/api/real-time-events", {
        credentials: "include",
      })

      if (response.ok) {
        const data = await response.json()
        const newEvents = data.events || []

        newEvents.forEach((event: any) => {
          const eventId = `${event.event_type}-${event.entity_id}-${event.timestamp}`

          if (!lastEventIds.has(eventId)) {
            // Send browser notification for new events
            const notificationTitle =
              event.event_type === "ticket_created"
                ? "New Ticket"
                : event.event_type === "ticket_updated"
                  ? "Ticket Updated"
                  : event.event_type === "message_received"
                    ? "New Message"
                    : "Ticket Assignment"

            const notificationBody = `${event.title} - ${event.description}`

            sendNotification({
              title: notificationTitle,
              body: notificationBody,
              tag: `ticket-${event.entity_id}`,
            })

            lastEventIds.add(eventId)
          }
        })

        setLastEventIds(new Set(lastEventIds))
        setEvents(newEvents)
      } else if (response.status === 401) {
        // Session expired or user not logged in, will be handled by middleware redirect
      }
    } catch (error) {
      console.error("[v0] Error fetching real-time events:", error)
    } finally {
      setLoading(false)
    }
  }, [userType, lastEventIds])

  useEffect(() => {
    fetchEvents()
    // Poll every 5 seconds for real-time updates
    const interval = setInterval(fetchEvents, 5000)
    return () => clearInterval(interval)
  }, [fetchEvents])

  return { events, loading, refetch: fetchEvents }
}
