"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
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
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import { CheckCircle, XCircle } from "lucide-react"
import { TICKET_STATUS_LABELS } from "@/lib/constants"

interface TicketsListProps {
  customerId: string
  userRole?: string
}

export function TicketsList({ customerId, userRole }: TicketsListProps) {
  const [tickets, setTickets] = useState<any[]>([])
  const [pendingTickets, setPendingTickets] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [rejectionReason, setRejectionReason] = useState("")
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    productId: "",
    priority: "medium",
  })

  const isCustomerAdmin = userRole === "customer_admin"

  useEffect(() => {
    if (customerId) {
      fetchTickets()
      fetchProducts()
      if (isCustomerAdmin) {
        fetchPendingTickets()
      }
    }
  }, [customerId, userRole])

  const fetchTickets = async () => {
    try {
      const response = await fetch(`/api/tickets?customerId=${customerId}`, {
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

  const fetchPendingTickets = async () => {
    try {
      const response = await fetch(`/api/tickets?customerId=${customerId}&pendingApproval=true`, {
        credentials: "include",
      })
      if (response.ok) {
        const data = await response.json()
        setPendingTickets(data)
      }
    } catch (error) {
      console.error("[v0] Error fetching pending tickets:", error)
    }
  }

  const fetchProducts = async () => {
    try {
      const response = await fetch(`/api/products`, {
        credentials: "include",
      })
      if (response.ok) {
        const data = await response.json()
        setProducts(data)
      }
    } catch (error) {
      console.error("[v0] Error fetching products:", error)
    }
  }

  const handleCreateTicket = async () => {
    if (!formData.title || !formData.description) {
      toast.error("Please fill in all required fields")
      return
    }

    try {
      const response = await fetch("/api/tickets", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId,
          productId: formData.productId || null,
          title: formData.title,
          description: formData.description,
          priority: formData.priority,
        }),
      })

      if (response.ok) {
        const result = await response.json()
        if (result.status === "pending_approval") {
          toast.success("Ticket submitted for approval")
        } else {
          toast.success("Ticket created successfully")
        }
        setIsDialogOpen(false)
        setFormData({ title: "", description: "", productId: "", priority: "medium" })
        fetchTickets()
        if (isCustomerAdmin) {
          fetchPendingTickets()
        }
      }
    } catch (error) {
      console.error("[v0] Error creating ticket:", error)
      toast.error("Failed to create ticket")
    }
  }

  const handleApproveTicket = async (ticketId: string) => {
    try {
      const response = await fetch(`/api/tickets/${ticketId}/approve`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "approve" }),
      })

      if (response.ok) {
        toast.success("Ticket approved successfully")
        fetchTickets()
        fetchPendingTickets()
      } else {
        const data = await response.json()
        toast.error(data.message || "Failed to approve ticket")
      }
    } catch (error) {
      console.error("[v0] Error approving ticket:", error)
      toast.error("Failed to approve ticket")
    }
  }

  const handleRejectTicket = async () => {
    if (!selectedTicketId) return

    try {
      const response = await fetch(`/api/tickets/${selectedTicketId}/approve`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reject", rejection_reason: rejectionReason }),
      })

      if (response.ok) {
        toast.success("Ticket rejected")
        setSelectedTicketId(null)
        setRejectionReason("")
        fetchTickets()
        fetchPendingTickets()
      } else {
        const data = await response.json()
        toast.error(data.message || "Failed to reject ticket")
      }
    } catch (error) {
      console.error("[v0] Error rejecting ticket:", error)
      toast.error("Failed to reject ticket")
    }
  }

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      pending_approval: "bg-orange-100 text-orange-800",
      open: "bg-yellow-100 text-yellow-800",
      in_progress: "bg-blue-100 text-blue-800",
      resolved: "bg-green-100 text-green-800",
      closed: "bg-gray-100 text-gray-800",
      rejected: "bg-red-100 text-red-800",
    }
    return colors[status] || "bg-gray-100 text-gray-800"
  }

  const getPriorityBadge = (priority: string) => {
    const colors: Record<string, string> = {
      low: "bg-green-50 text-green-700",
      medium: "bg-yellow-50 text-yellow-700",
      high: "bg-orange-50 text-orange-700",
      urgent: "bg-red-50 text-red-700",
    }
    return colors[priority] || "bg-gray-50 text-gray-700"
  }

  if (loading) {
    return <div>Loading tickets...</div>
  }

  return (
    <div className="space-y-4">
      {isCustomerAdmin && pendingTickets.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-800">
              Pending Approvals ({pendingTickets.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Created By</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingTickets.map((ticket) => (
                  <TableRow key={ticket.id}>
                    <TableCell className="font-medium">{ticket.title}</TableCell>
                    <TableCell>{ticket.created_by_name || "Customer"}</TableCell>
                    <TableCell>
                      <Badge className={getPriorityBadge(ticket.priority)}>{ticket.priority}</Badge>
                    </TableCell>
                    <TableCell>{new Date(ticket.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          className="gap-1 bg-green-600 hover:bg-green-700"
                          onClick={() => handleApproveTicket(ticket.id)}
                        >
                          <CheckCircle size={14} />
                          Approve
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="destructive"
                              className="gap-1"
                              onClick={() => setSelectedTicketId(ticket.id)}
                            >
                              <XCircle size={14} />
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
                            <Textarea
                              placeholder="Rejection reason (optional)"
                              value={rejectionReason}
                              onChange={(e) => setRejectionReason(e.target.value)}
                              rows={3}
                            />
                            <div className="flex gap-4 justify-end">
                              <AlertDialogCancel onClick={() => {
                                setSelectedTicketId(null)
                                setRejectionReason("")
                              }}>
                                Cancel
                              </AlertDialogCancel>
                              <AlertDialogAction
                                onClick={handleRejectTicket}
                                className="bg-destructive"
                              >
                                Reject Ticket
                              </AlertDialogAction>
                            </div>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Your Tickets</CardTitle>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">Create Ticket</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Ticket</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Title</label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Issue title"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Description</label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe the issue..."
                    rows={4}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Product (Optional)</label>
                  <Select
                    value={formData.productId}
                    onValueChange={(value) => setFormData({ ...formData, productId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a product" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Priority</label>
                  <Select
                    value={formData.priority}
                    onValueChange={(value) => setFormData({ ...formData, priority: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleCreateTicket} className="w-full">
                  Create Ticket
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {tickets.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No tickets yet</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tickets.map((ticket) => (
                  <TableRow key={ticket.id}>
                    <TableCell className="font-medium">{ticket.title}</TableCell>
                    <TableCell>{ticket.product_name || "—"}</TableCell>
                    <TableCell>
                      <Badge className={getStatusBadge(ticket.status)}>
                        {TICKET_STATUS_LABELS[ticket.status] || ticket.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getPriorityBadge(ticket.priority)}>{ticket.priority}</Badge>
                    </TableCell>
                    <TableCell>{new Date(ticket.created_at).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
