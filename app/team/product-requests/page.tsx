"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { TeamNav } from "@/components/team/team-nav"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { CheckCircle, XCircle, Clock } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"

export default function ProductRequestsPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [requests, setRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState("all")

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
        if (sessionData.type !== "team" || !["super_admin", "admin", "manager"].includes(sessionData.session?.role)) {
          router.push("/team/login")
          return
        }

        setUser(sessionData.session)

        // Fetch product requests
        const response = await fetch("/api/product-requests", {
          credentials: "include",
        })
        if (response.ok) {
          const data = await response.json()
          setRequests(data || [])
        }
      } catch (error) {
        console.error("[v0] Error fetching requests:", error)
        router.push("/team/login")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [router])

  const handleApprove = async (requestId: string, agentId?: string) => {
    try {
      const response = await fetch(`/api/product-requests/${requestId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          status: "approved",
          assignedAgentId: agentId || null,
        }),
      })

      if (response.ok) {
        setRequests(requests.map((r) => (r.id === requestId ? { ...r, status: "approved" } : r)))
        toast.success("Product request approved and product created")
      } else {
        toast.error("Failed to approve request")
      }
    } catch (error) {
      console.error("[v0] Error approving request:", error)
      toast.error("An error occurred")
    }
  }

  const handleReject = async (requestId: string) => {
    try {
      const response = await fetch(`/api/product-requests/${requestId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status: "rejected" }),
      })

      if (response.ok) {
        setRequests(requests.map((r) => (r.id === requestId ? { ...r, status: "rejected" } : r)))
        toast.success("Product request rejected")
      } else {
        toast.error("Failed to reject request")
      }
    } catch (error) {
      console.error("[v0] Error rejecting request:", error)
      toast.error("An error occurred")
    }
  }

  const handleLogout = async () => {
    await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
    })
    toast.success("Logged out successfully")
    router.push("/team/login")
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle className="text-green-600" size={20} />
      case "rejected":
        return <XCircle className="text-red-600" size={20} />
      default:
        return <Clock className="text-yellow-600" size={20} />
    }
  }

  const filteredRequests = requests.filter((req) => filter === "all" || req.status === filter)

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>
  }

  if (!user) {
    return null
  }

  return (
    <SidebarProvider>
      <div className="flex h-screen bg-background">
        <TeamNav user={user} onLogout={handleLogout} />
        <SidebarInset>
          <main className="flex-1 overflow-auto">
            <div className="p-8">
              <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold">Product Requests</h1>
                <Select value={filter} onValueChange={setFilter}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {filteredRequests.length === 0 ? (
                <Card>
                  <CardContent className="pt-8 text-center">
                    <p className="text-muted-foreground">No product requests</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {filteredRequests.map((request) => (
                    <Card key={request.id}>
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              {getStatusIcon(request.status)}
                              <div>
                                <h3 className="font-semibold text-lg">{request.product_name}</h3>
                                <p className="text-sm text-muted-foreground">{request.company_name}</p>
                              </div>
                            </div>
                            <p className="text-muted-foreground mb-4">{request.description}</p>
                            <div className="text-sm text-muted-foreground">
                              Submitted: {new Date(request.created_at).toLocaleDateString()}
                            </div>
                          </div>
                          <div className="flex flex-col gap-2">
                            {request.status === "pending" && (
                              <>
                                <Button
                                  onClick={() => handleApprove(request.id)}
                                  className="bg-green-600 hover:bg-green-700 text-white"
                                >
                                  Approve
                                </Button>
                                <Button
                                  onClick={() => handleReject(request.id)}
                                  variant="outline"
                                  className="text-red-600"
                                >
                                  Reject
                                </Button>
                              </>
                            )}
                            {request.status !== "pending" && (
                              <span
                                className={`px-3 py-1 rounded-full text-xs font-medium text-center ${
                                  request.status === "approved"
                                    ? "bg-green-100 text-green-800"
                                    : "bg-red-100 text-red-800"
                                }`}
                              >
                                {request.status}
                              </span>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}
