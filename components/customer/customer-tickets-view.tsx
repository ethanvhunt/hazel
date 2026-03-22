"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import Link from "next/link"
import { Eye, CheckCircle, XCircle, Search, Ticket, Clock } from "lucide-react"

interface CustomerTicketsViewProps {
  customerId: string
  userRole?: string
}

export function CustomerTicketsView({ customerId, userRole }: CustomerTicketsViewProps) {
  const [tickets, setTickets] = useState<any[]>([])
  const [filteredTickets, setFilteredTickets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [approvalNotes, setApprovalNotes] = useState("")
  const [processingTicketId, setProcessingTicketId] = useState<string | null>(null)

  useEffect(() => {
    if (customerId) {
      fetchTickets()
      const interval = setInterval(fetchTickets, 10000)
      return () => clearInterval(interval)
    }
  }, [customerId])

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredTickets(tickets)
    } else {
      const query = searchQuery.toLowerCase()
      const filtered = tickets.filter(
        (ticket) =>
          ticket.title?.toLowerCase().includes(query) ||
          ticket.description?.toLowerCase().includes(query) ||
          ticket.status?.toLowerCase().includes(query) ||
          ticket.priority?.toLowerCase().includes(query)
      )
      setFilteredTickets(filtered)
    }
  }, [searchQuery, tickets])

  const fetchTickets = async () => {
    try {
      const response = await fetch(`/api/tickets?customerId=${customerId}`)
      if (response.ok) {
        const data = await response.json()
        setTickets(data)
        setFilteredTickets(data)
      }
    } catch (error) {
      console.error("Failed to fetch tickets:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleApproveTicket = async (ticketId: string) => {
    setProcessingTicketId(ticketId)
    try {
      const response = await fetch(`/api/tickets/${ticketId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "approve", notes: approvalNotes }),
        credentials: "include",
      })

      const data = await response.json()

      if (response.ok) {
        toast.success(data.message || "Ticket approved successfully")
        setApprovalNotes("")
        fetchTickets()
      } else {
        toast.error(data.message || "Failed to approve ticket")
      }
    } catch (error) {
      console.error("Error approving ticket:", error)
      toast.error("An error occurred")
    } finally {
      setProcessingTicketId(null)
    }
  }

  const handleRejectTicket = async (ticketId: string) => {
    if (!approvalNotes.trim()) {
      toast.error("Please provide a reason for rejection")
      return
    }

    setProcessingTicketId(ticketId)
    try {
      const response = await fetch(`/api/tickets/${ticketId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reject", notes: approvalNotes }),
        credentials: "include",
      })

      const data = await response.json()

      if (response.ok) {
        toast.success(data.message || "Ticket rejected")
        setApprovalNotes("")
        fetchTickets()
      } else {
        toast.error(data.message || "Failed to reject ticket")
      }
    } catch (error) {
      console.error("Error rejecting ticket:", error)
      toast.error("An error occurred")
    } finally {
      setProcessingTicketId(null)
    }
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
    return <Badge className={config.className}>{config.label}</Badge>
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

  // Check if user can approve tickets (customer_admin or main customer account)
  const canApprove = userRole === "customer_admin" || userRole === "customer"

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <Clock className="animate-spin" size={20} />
            Loading tickets...
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Ticket size={20} />
              Your Support Tickets
            </CardTitle>
            <CardDescription>{filteredTickets.length} tickets found</CardDescription>
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
            <Input
              placeholder="Search tickets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {filteredTickets.length === 0 ? (
          <div className="text-center py-12">
            <Ticket className="mx-auto text-muted-foreground mb-4" size={48} />
            <p className="text-muted-foreground mb-4">
              {searchQuery ? "No tickets match your search" : "No tickets found"}
            </p>
            {!searchQuery && (
              <Button asChild>
                <Link href="/customer/tickets/create">Create Your First Ticket</Link>
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead className="hidden md:table-cell">Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTickets.map((ticket) => (
                  <TableRow key={ticket.id}>
                    <TableCell className="font-medium max-w-[200px] truncate">{ticket.title}</TableCell>
                    <TableCell>
                      {ticket.product_code ? (
                        <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">{ticket.product_code}</code>
                      ) : (
                        <span className="text-muted-foreground text-sm">—</span>
                      )}
                    </TableCell>
                    <TableCell>{getStatusBadge(ticket.status)}</TableCell>
                    <TableCell>{getPriorityBadge(ticket.priority)}</TableCell>
                    <TableCell className="hidden md:table-cell">
                      {new Date(ticket.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="outline" asChild>
                          <Link href={`/customer/tickets/${ticket.id}`}>
                            <Eye size={16} className="mr-1" />
                            View
                          </Link>
                        </Button>

                        {/* Approval buttons for customer_admin */}
                        {canApprove && ticket.status === "pending_approval" && (
                          <>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button size="sm" className="bg-green-600 hover:bg-green-700">
                                  <CheckCircle size={16} className="mr-1" />
                                  Approve
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Approve Ticket</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to approve this ticket? It will be sent to the support team.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <div className="space-y-2">
                                  <label className="text-sm font-medium">Notes (Optional)</label>
                                  <Textarea
                                    placeholder="Add any notes for the support team..."
                                    value={approvalNotes}
                                    onChange={(e) => setApprovalNotes(e.target.value)}
                                  />
                                </div>
                                <div className="flex gap-4 justify-end">
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleApproveTicket(ticket.id)}
                                    disabled={processingTicketId === ticket.id}
                                    className="bg-green-600 hover:bg-green-700"
                                  >
                                    {processingTicketId === ticket.id ? "Processing..." : "Approve"}
                                  </AlertDialogAction>
                                </div>
                              </AlertDialogContent>
                            </AlertDialog>

                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button size="sm" variant="destructive">
                                  <XCircle size={16} className="mr-1" />
                                  Reject
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Reject Ticket</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Please provide a reason for rejecting this ticket.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <div className="space-y-2">
                                  <label className="text-sm font-medium">
                                    Reason <span className="text-destructive">*</span>
                                  </label>
                                  <Textarea
                                    placeholder="Explain why this ticket is being rejected..."
                                    value={approvalNotes}
                                    onChange={(e) => setApprovalNotes(e.target.value)}
                                  />
                                </div>
                                <div className="flex gap-4 justify-end">
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleRejectTicket(ticket.id)}
                                    disabled={processingTicketId === ticket.id || !approvalNotes.trim()}
                                    className="bg-destructive hover:bg-destructive/90"
                                  >
                                    {processingTicketId === ticket.id ? "Processing..." : "Reject"}
                                  </AlertDialogAction>
                                </div>
                              </AlertDialogContent>
                            </AlertDialog>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
