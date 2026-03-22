"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import { 
  Trash2, 
  Eye, 
  Search, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  XCircle,
  Filter,
  ArrowUpRight
} from "lucide-react"
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
import { cn } from "@/lib/utils"

interface TicketsListProps {
  userRole?: string
}

const statusConfig: Record<string, { label: string; className: string; icon: React.ElementType }> = {
  pending_approval: { label: "Pending Approval", className: "bg-chart-4/10 text-chart-4 border-chart-4/30", icon: Clock },
  approved: { label: "Approved", className: "bg-chart-5/10 text-chart-5 border-chart-5/30", icon: CheckCircle2 },
  rejected: { label: "Rejected", className: "bg-destructive/10 text-destructive border-destructive/30", icon: XCircle },
  open: { label: "Open", className: "status-open", icon: AlertCircle },
  "in-progress": { label: "In Progress", className: "status-in-progress", icon: Clock },
  resolved: { label: "Resolved", className: "status-resolved", icon: CheckCircle2 },
  closed: { label: "Closed", className: "status-closed", icon: XCircle },
}

const priorityConfig: Record<string, { label: string; className: string }> = {
  low: { label: "Low", className: "bg-success/10 text-success border-success/30" },
  medium: { label: "Medium", className: "bg-warning/10 text-warning border-warning/30" },
  high: { label: "High", className: "bg-chart-4/10 text-chart-4 border-chart-4/30" },
  urgent: { label: "Urgent", className: "bg-destructive/10 text-destructive border-destructive/30" },
}

export function TicketsList({ userRole }: TicketsListProps) {
  const [tickets, setTickets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")
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

  const filteredTickets = tickets.filter((ticket) => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      ticket.title?.toLowerCase().includes(query) ||
      ticket.ticket_number?.toLowerCase().includes(query) ||
      ticket.customer_name?.toLowerCase().includes(query)
    )
  })

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-48" />
        </div>
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tickets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tickets</SelectItem>
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
      </div>

      {/* Results count */}
      <div className="text-sm text-muted-foreground">
        Showing {filteredTickets.length} of {tickets.length} tickets
      </div>

      {/* Tickets Table */}
      {filteredTickets.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
            <AlertCircle className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium mb-1">No tickets found</h3>
          <p className="text-sm text-muted-foreground">
            {searchQuery || filterStatus !== "all" 
              ? "Try adjusting your search or filters" 
              : "No support tickets have been created yet"
            }
          </p>
        </div>
      ) : (
        <div className="rounded-lg border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead className="font-semibold">Ticket</TableHead>
                <TableHead className="font-semibold">Customer</TableHead>
                <TableHead className="font-semibold">Status</TableHead>
                <TableHead className="font-semibold">Priority</TableHead>
                <TableHead className="font-semibold hidden md:table-cell">Created</TableHead>
                <TableHead className="font-semibold text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTickets.map((ticket) => {
                const status = statusConfig[ticket.status] || statusConfig.open
                const priority = priorityConfig[ticket.priority] || priorityConfig.medium
                const StatusIcon = status.icon

                return (
                  <TableRow key={ticket.id} className="table-row-hover">
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium text-foreground">{ticket.title}</span>
                        <span className="text-xs text-muted-foreground font-mono">
                          {ticket.ticket_number || `TKT-${ticket.id?.substring(0, 6).toUpperCase()}`}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{ticket.customer_name || "N/A"}</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn("gap-1.5", status.className)}>
                        <StatusIcon className="h-3 w-3" />
                        {status.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={priority.className}>
                        {priority.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <span className="text-sm text-muted-foreground">
                        {new Date(ticket.created_at).toLocaleDateString()}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button size="sm" variant="ghost" className="gap-1.5 h-8" asChild>
                          <Link href={`/team/tickets/${ticket.id}`}>
                            <Eye className="h-4 w-4" />
                            <span className="hidden sm:inline">View</span>
                            <ArrowUpRight className="h-3 w-3 hidden sm:inline" />
                          </Link>
                        </Button>
                        {userRole === ROLES.SUPER_ADMIN && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                className="h-8 text-destructive hover:text-destructive hover:bg-destructive/10" 
                                disabled={deleting === ticket.id}
                              >
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
                                <AlertDialogAction 
                                  onClick={() => handleDelete(ticket.id)}
                                  className="bg-destructive hover:bg-destructive/90"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
