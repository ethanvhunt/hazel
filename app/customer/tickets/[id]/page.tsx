"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { CustomerNav } from "@/components/customer/customer-nav"
import { ChatView } from "@/components/common/chat-view"
import { toast } from "sonner"
import { ArrowLeft, Package, Calendar, User, Clock } from "lucide-react"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"

export default function CustomerTicketDetailPage() {
  const router = useRouter()
  const params = useParams()
  const ticketId = params.id as string
  const [customer, setCustomer] = useState<any>(null)
  const [ticket, setTicket] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        const sessionResponse = await fetch("/api/auth/session", {
          credentials: "include",
        })

        if (!sessionResponse.ok) {
          router.push("/customer/login")
          return
        }

        const sessionData = await sessionResponse.json()
        if (sessionData.type !== "customer") {
          router.push("/customer/login")
          return
        }

        setCustomer(sessionData.session)

        const ticketResponse = await fetch(`/api/tickets/${ticketId}`, {
          credentials: "include",
        })

        if (ticketResponse.ok) {
          const ticketData = await ticketResponse.json()
          setTicket(ticketData)
        } else {
          toast.error("Ticket not found")
          router.push("/customer/tickets")
        }
      } catch (error) {
        console.error("[v0] Load ticket error:", error)
        toast.error("Failed to load ticket")
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [router, ticketId])

  const handleLogout = async () => {
    await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
    })
    toast.success("Logged out successfully")
    router.push("/customer/login")
  }

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { className: string; label: string }> = {
      pending_approval: { className: "bg-orange-100 text-orange-800", label: "Pending Approval" },
      approved: { className: "bg-blue-100 text-blue-800", label: "Approved" },
      rejected: { className: "bg-red-100 text-red-800", label: "Rejected" },
      open: { className: "bg-yellow-100 text-yellow-800", label: "Open" },
      in_progress: { className: "bg-purple-100 text-purple-800", label: "In Progress" },
      resolved: { className: "bg-green-100 text-green-800", label: "Resolved" },
      closed: { className: "bg-gray-100 text-gray-800", label: "Closed" },
    }
    const config = statusConfig[status] || { className: "bg-gray-100 text-gray-800", label: status }
    return <Badge className={`${config.className} text-sm px-3 py-1`}>{config.label}</Badge>
  }

  const getPriorityBadge = (priority: string) => {
    const priorityConfig: Record<string, string> = {
      low: "bg-gray-100 text-gray-800",
      medium: "bg-blue-100 text-blue-800",
      high: "bg-orange-100 text-orange-800",
      urgent: "bg-red-100 text-red-800",
    }
    return <Badge className={priorityConfig[priority] || "bg-gray-100 text-gray-800"}>{priority}</Badge>
  }

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>
  }

  if (!ticket) {
    return <div className="flex items-center justify-center h-screen">Ticket not found</div>
  }

  return (
    <SidebarProvider>
      <div className="flex h-screen bg-background w-full">
        <CustomerNav customer={customer} onLogout={handleLogout} />
        <SidebarInset>
          <header className="flex items-center gap-2 border-b p-4 md:hidden">
            <SidebarTrigger />
            <h1 className="text-lg font-semibold">Ticket Details</h1>
          </header>
          <main className="flex-1 overflow-auto">
            <div className="p-4 md:p-8 w-full">
              <div className="flex items-center gap-4 mb-8">
                <Button variant="ghost" size="icon" asChild>
                  <Link href="/customer/tickets">
                    <ArrowLeft size={20} />
                  </Link>
                </Button>
                <div className="flex-1">
                  <h1 className="text-2xl md:text-3xl font-bold">{ticket.title}</h1>
                  <p className="text-muted-foreground text-sm">
                    Ticket ID: {ticket.id.slice(0, 8)}...
                  </p>
                </div>
                {getStatusBadge(ticket.status)}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Ticket Details */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Ticket Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-2">Description</p>
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{ticket.description}</p>
                      </div>

                      {ticket.product_code && (
                        <>
                          <Separator />
                          <div className="flex items-center gap-3">
                            <Package size={18} className="text-muted-foreground" />
                            <div>
                              <p className="text-sm font-medium text-muted-foreground">Related Product</p>
                              <p className="text-sm">
                                <code className="bg-muted px-2 py-0.5 rounded font-mono">{ticket.product_code}</code>
                                {ticket.product_name && ` - ${ticket.product_name}`}
                              </p>
                            </div>
                          </div>
                        </>
                      )}

                      {ticket.approval_notes && (
                        <>
                          <Separator />
                          <div>
                            <p className="text-sm font-medium text-muted-foreground mb-2">Approval Notes</p>
                            <p className="text-sm leading-relaxed bg-muted p-3 rounded">{ticket.approval_notes}</p>
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>

                  {/* Chat Section - Only show for non-pending tickets */}
                  {ticket.status !== "pending_approval" && ticket.status !== "rejected" && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Conversation</CardTitle>
                        <CardDescription>Chat with the support team</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <ChatView
                          ticketId={ticket.id}
                          senderType="customer"
                          senderId={customer?.customerId}
                        />
                      </CardContent>
                    </Card>
                  )}

                  {/* Pending Approval Notice */}
                  {ticket.status === "pending_approval" && (
                    <Card className="border-orange-200 bg-orange-50">
                      <CardContent className="py-6">
                        <div className="flex items-center gap-3">
                          <Clock className="text-orange-600" size={24} />
                          <div>
                            <p className="font-medium text-orange-800">Awaiting Approval</p>
                            <p className="text-sm text-orange-600">
                              This ticket is waiting for approval from your customer admin before it can be processed by the support team.
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Rejected Notice */}
                  {ticket.status === "rejected" && (
                    <Card className="border-red-200 bg-red-50">
                      <CardContent className="py-6">
                        <div>
                          <p className="font-medium text-red-800 mb-2">Ticket Rejected</p>
                          <p className="text-sm text-red-600">
                            {ticket.approval_notes || "This ticket was rejected by your customer admin."}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Status</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Current Status</span>
                        {getStatusBadge(ticket.status)}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Priority</span>
                        {getPriorityBadge(ticket.priority)}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Calendar size={18} />
                        Timeline
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Created</p>
                        <p className="text-sm">
                          {new Date(ticket.created_at).toLocaleDateString()} at{" "}
                          {new Date(ticket.created_at).toLocaleTimeString()}
                        </p>
                      </div>
                      {ticket.approval_date && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">
                            {ticket.status === "rejected" ? "Rejected" : "Approved"}
                          </p>
                          <p className="text-sm">
                            {new Date(ticket.approval_date).toLocaleDateString()} at{" "}
                            {new Date(ticket.approval_date).toLocaleTimeString()}
                          </p>
                        </div>
                      )}
                      {ticket.updated_at && ticket.updated_at !== ticket.created_at && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Last Updated</p>
                          <p className="text-sm">
                            {new Date(ticket.updated_at).toLocaleDateString()} at{" "}
                            {new Date(ticket.updated_at).toLocaleTimeString()}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {ticket.assigned_to_name && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <User size={18} />
                          Assigned Agent
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="font-medium">{ticket.assigned_to_name}</p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}
