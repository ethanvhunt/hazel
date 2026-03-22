"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ChatView } from "./chat-view"
import { toast } from "sonner"
import { Trash2 } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { ROLES } from "@/lib/constants"

export function TicketsView({ userRole, userId }: { userRole: string; userId: string }) {
  const [tickets, setTickets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTicket, setSelectedTicket] = useState<any>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [deleting, setDeleting] = useState<string | null>(null)

  useEffect(() => {
    fetchTickets()
    const interval = setInterval(fetchTickets, 5000)
    return () => clearInterval(interval)
  }, [filterStatus])

  const fetchTickets = async () => {
    try {
      const query = filterStatus !== "all" ? `?status=${filterStatus}` : ""
      const response = await fetch(`/api/tickets${query}`)
      if (response.ok) {
        const data = await response.json()
        setTickets(data)
      } else {
        toast.error("Failed to fetch tickets")
      }
    } catch (error) {
      console.error("[v0] Failed to fetch tickets:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleOpenTicket = (ticket: any) => {
    setSelectedTicket(ticket)
    setIsDialogOpen(true)
  }

  const handleUpdateStatus = async (ticketId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/tickets/${ticketId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status: newStatus }),
      })

      if (response.ok) {
        const updated = await response.json()
        setSelectedTicket(updated)
        toast.success("Ticket updated")
        fetchTickets()
      } else {
        toast.error("Failed to update ticket")
      }
    } catch (error) {
      console.error("[v0] Update error:", error)
      toast.error("Failed to update ticket")
    }
  }

  const handleDelete = async (id: string) => {
    setDeleting(id)
    try {
      const response = await fetch(`/api/tickets/${id}`, {
        method: "DELETE",
        credentials: "include",
      })
      if (response.ok) {
        toast.success("Ticket deleted successfully")
        setIsDialogOpen(false)
        setSelectedTicket(null)
        fetchTickets()
      } else {
        const data = await response.json()
        toast.error(data.message || "Failed to delete ticket")
      }
    } catch (error) {
      console.error("Error deleting ticket:", error)
      toast.error("Failed to delete ticket")
    } finally {
      setDeleting(null)
    }
  }

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      pending_approval: "bg-purple-100 text-purple-800",
      approved: "bg-teal-100 text-teal-800",
      rejected: "bg-red-100 text-red-800",
      open: "bg-yellow-100 text-yellow-800",
      "in-progress": "bg-blue-100 text-blue-800",
      in_progress: "bg-blue-100 text-blue-800",
      resolved: "bg-green-100 text-green-800",
      closed: "bg-gray-100 text-gray-800",
    }
    return colors[status] || "bg-gray-100 text-gray-800"
  }

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending_approval: "Pending Approval",
      approved: "Approved",
      rejected: "Rejected",
      open: "Open",
      "in-progress": "In Progress",
      in_progress: "In Progress",
      resolved: "Resolved",
      closed: "Closed",
    }
    return labels[status] || status
  }

  if (loading) {
    return <div className="flex items-center justify-center py-8">Loading tickets...</div>
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Active Tickets</CardTitle>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="pending_approval">Pending Approval</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="in-progress">In Progress</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          {tickets.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No tickets found</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tickets.map((ticket) => (
                  <TableRow key={ticket.id}>
                    <TableCell className="font-medium">{ticket.title}</TableCell>
                    <TableCell>{ticket.customer_name || ticket.customer_id}</TableCell>
                    <TableCell>
                      <Badge className={getStatusBadge(ticket.status)}>{getStatusLabel(ticket.status)}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{ticket.priority}</Badge>
                    </TableCell>
                    <TableCell>{new Date(ticket.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="outline" onClick={() => handleOpenTicket(ticket)}>
                          View & Chat
                        </Button>
                        {userRole === ROLES.SUPER_ADMIN && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="sm" variant="destructive" disabled={deleting === ticket.id}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Ticket</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete this ticket? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(ticket.id)}>Delete</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>{selectedTicket?.title}</span>
              {userRole === ROLES.SUPER_ADMIN && selectedTicket && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button size="sm" variant="destructive" disabled={deleting === selectedTicket.id}>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Ticket</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete this ticket? This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDelete(selectedTicket.id)}>Delete</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </DialogTitle>
          </DialogHeader>
          {selectedTicket && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Status</label>
                  <Select
                    value={selectedTicket.status}
                    onValueChange={(value) => handleUpdateStatus(selectedTicket.id, value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending_approval">Pending Approval</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="in-progress">In Progress</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Priority</label>
                  <p className="text-sm">{selectedTicket.priority}</p>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Description</label>
                <p className="text-sm text-muted-foreground">{selectedTicket.description}</p>
              </div>

              <ChatView ticketId={selectedTicket.id} senderType="agent" senderId={userId} />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
