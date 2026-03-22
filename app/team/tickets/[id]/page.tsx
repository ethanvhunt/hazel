"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { TeamNav } from "@/components/team/team-nav"
import { ChatView } from "@/components/common/chat-view"
import { toast } from "sonner"
import { ArrowLeft } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { SidebarProvider } from "@/components/ui/sidebar"

export default function TicketDetailPage() {
  const router = useRouter()
  const params = useParams()
  const ticketId = params.id as string
  const [user, setUser] = useState<any>(null)
  const [ticket, setTicket] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const sessionResponse = await fetch("/api/auth/session", {
          credentials: "include",
        })

        if (!sessionResponse.ok) {
          router.push("/team/login")
          return
        }

        const sessionData = await sessionResponse.json()

        if (!sessionData.session || sessionData.type !== "team") {
          router.push("/team/login")
          return
        }

        setUser(sessionData.session)

        // Fetch ticket
        const ticketResponse = await fetch(`/api/tickets/${ticketId}`, {
          credentials: "include",
        })

        if (ticketResponse.ok) {
          const ticketData = await ticketResponse.json()
          setTicket(ticketData)
        }
      } catch (error) {
        console.error("[v0] Error fetching data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [router, ticketId])

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" })
    router.push("/team/login")
  }

  const handleStatusUpdate = async (newStatus: string) => {
    setUpdating(true)
    try {
      const response = await fetch(`/api/tickets/${ticketId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
        credentials: "include",
      })

      if (response.ok) {
        const updatedTicket = await response.json()
        setTicket(updatedTicket)
        toast.success("Status updated successfully")
      } else {
        toast.error("Failed to update status")
      }
    } catch (error) {
      console.error("[v0] Error updating status:", error)
      toast.error("An error occurred")
    } finally {
      setUpdating(false)
    }
  }

  if (loading) return <div className="flex items-center justify-center h-screen">Loading...</div>
  if (!user || !ticket) return null

  const statusColor = {
    open: "bg-blue-100 text-blue-800",
    "in-progress": "bg-yellow-100 text-yellow-800",
    resolved: "bg-green-100 text-green-800",
    closed: "bg-gray-100 text-gray-800",
  }

  const priorityColor = {
    low: "bg-green-100 text-green-800",
    medium: "bg-yellow-100 text-yellow-800",
    high: "bg-orange-100 text-orange-800",
    urgent: "bg-red-100 text-red-800",
  }

  return (
    <SidebarProvider>
      <div className="flex h-screen bg-background">
        <TeamNav user={user} onLogout={handleLogout} />
        <main className="flex-1 overflow-auto">
          <div className="p-8 max-w-4xl">
            <div className="flex items-center gap-4 mb-8">
              <Button variant="ghost" asChild>
                <Link href="/team/tickets">
                  <ArrowLeft size={20} />
                </Link>
              </Button>
              <h1 className="text-3xl font-bold">Ticket #{ticket.id.slice(0, 8)}</h1>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-8">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <Select value={ticket.status} onValueChange={handleStatusUpdate} disabled={updating}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="in-progress">In Progress</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Priority</CardTitle>
                </CardHeader>
                <CardContent>
                  <Badge className={priorityColor[ticket.priority as keyof typeof priorityColor]}>
                    {ticket.priority.charAt(0).toUpperCase() + ticket.priority.slice(1)}
                  </Badge>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Created</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">{new Date(ticket.created_at).toLocaleDateString()}</p>
                </CardContent>
              </Card>
            </div>

            <Card className="mb-8">
              <CardHeader>
                <CardTitle>{ticket.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Description</p>
                  <p className="text-base">{ticket.description}</p>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                  <div>
                    <p className="text-sm text-muted-foreground">Customer</p>
                    <p className="font-medium">{ticket.customer_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Product</p>
                    <p className="font-medium">{ticket.product_name}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <ChatView ticketId={ticketId} senderType="agent" senderId={user.id} />
          </div>
        </main>
      </div>
    </SidebarProvider>
  )
}
