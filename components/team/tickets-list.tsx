"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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

interface TicketsListProps {
  userRole?: string
}

export function TicketsList({ userRole }: TicketsListProps) {
  const [tickets, setTickets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
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
      const response = await fetch(`/api/tickets${query}`, {
        credentials: "include",
      })
      if (response.ok) {
        const data = await response.json()
        setTickets(data)
      }
    } catch (error) {
      console.error("[v0] Error fetching tickets:", error)
      toast.error("Failed to fetch tickets")
    } finally {
      setLoading(false)
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
      resolved: "Resolved",
      closed: "Closed",
    }
    return labels[status] || status
  }

  const getPriorityBadge = (priority: string) => {
    const colors: Record<string, string> = {
      low: "bg-green-100 text-green-800",
      medium: "bg-yellow-100 text-yellow-800",
      high: "bg-orange-100 text-orange-800",
      urgent: "bg-red-100 text-red-800",
    }
    return colors[priority] || "bg-gray-100 text-gray-800"
  }

  if (loading) {
    return <div>Loading tickets...</div>
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>All Tickets</CardTitle>
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
                  <TableCell>{ticket.customer_name || "N/A"}</TableCell>
                  <TableCell>
                    <Badge className={getStatusBadge(ticket.status)}>{getStatusLabel(ticket.status)}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={getPriorityBadge(ticket.priority)}>{ticket.priority}</Badge>
                  </TableCell>
                  <TableCell>{new Date(ticket.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline" asChild>
                        <Link href={`/team/tickets/${ticket.id}`}>View</Link>
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
                                Are you sure you want to delete this ticket? This action cannot be undone and will also
                                delete all associated messages.
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
  )
}
