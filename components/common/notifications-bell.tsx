"use client"

import { useEffect, useState } from "react"
import { Bell, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

export function NotificationsBell({ userType }: { userType: "team" | "customer" }) {
  const [notifications, setNotifications] = useState<any[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return

    fetchNotifications()
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [mounted])

  const fetchNotifications = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/notifications/subscribe?limit=10`, {
        credentials: "include",
      })

      if (response.ok) {
        const data = await response.json()
        if (Array.isArray(data)) {
          setNotifications(data)
          setUnreadCount(data.length)
        } else {
          setNotifications([])
          setUnreadCount(0)
        }
      } else {
        setNotifications([])
        setUnreadCount(0)
      }
    } catch (error) {
      console.error("[v0] Error fetching notifications:", error)
      setNotifications([])
      setUnreadCount(0)
    } finally {
      setLoading(false)
    }
  }

  const handleNotificationClick = async (notificationId: string, index: number) => {
    try {
      const response = await fetch("/api/notifications/mark-read", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          notificationIds: [notificationId],
        }),
      })

      if (response.ok) {
        // Remove the notification from the list
        const updatedNotifications = notifications.filter((_, i) => i !== index)
        setNotifications(updatedNotifications)
        setUnreadCount(updatedNotifications.length)
      }
    } catch (error) {
      console.error("[v0] Error marking notification as read:", error)
    }
  }

  const clearAllNotifications = async () => {
    try {
      const notificationIds = notifications.map((n) => n.id)
      if (notificationIds.length === 0) return

      const response = await fetch("/api/notifications/mark-read", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          notificationIds,
        }),
      })

      if (response.ok) {
        setNotifications([])
        setUnreadCount(0)
      }
    } catch (error) {
      console.error("[v0] Error marking all notifications as read:", error)
    }
  }

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" className="relative">
        <Bell size={20} />
      </Button>
    )
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell size={20} />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-red-500 text-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="font-semibold">Notifications</h3>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={clearAllNotifications}>
              <X size={16} />
            </Button>
          )}
        </div>
        <div className="max-h-96 overflow-y-auto">
          {loading && notifications.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">Loading notifications...</div>
          ) : notifications.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">No new notifications</div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification, index) => (
                <div
                  key={notification.id}
                  className="p-4 hover:bg-muted/50 cursor-pointer transition"
                  onClick={() => handleNotificationClick(notification.id, index)}
                >
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{notification.message || "New notification"}</p>
                      <p className="text-xs text-muted-foreground mt-1">{notification.title || ""}</p>
                    </div>
                    <Badge variant="secondary" className="text-xs capitalize">
                      {notification.event_type || "info"}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    {notification.created_at ? new Date(notification.created_at).toLocaleTimeString() : "Just now"}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
