"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { CustomerNav } from "@/components/customer/customer-nav"
import { toast } from "sonner"
import Link from "next/link"
import { ArrowLeft, CheckCircle, Clock, XCircle } from "lucide-react"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"

export default function RequestsPage() {
  const router = useRouter()
  const [customer, setCustomer] = useState<any>(null)
  const [requests, setRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({ productName: "", description: "" })

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

        // Fetch product requests
        const response = await fetch("/api/product-requests", {
          credentials: "include",
        })
        if (response.ok) {
          const data = await response.json()
          setRequests(data || [])
        }
      } catch (error) {
        console.error("[v0] Load requests error:", error)
        router.push("/customer/login")
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [router])

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.productName.trim()) {
      toast.error("Product name is required")
      return
    }
    if (!formData.description.trim()) {
      toast.error("Description is required")
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch("/api/product-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          productName: formData.productName,
          description: formData.description,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setRequests([data, ...requests])
        setFormData({ productName: "", description: "" })
        setShowForm(false)
        toast.success("Product request submitted successfully")
      } else {
        const error = await response.json()
        toast.error(error.message || "Failed to submit request")
      }
    } catch (error) {
      console.error("[v0] Error submitting request:", error)
      toast.error("An error occurred")
    } finally {
      setSubmitting(false)
    }
  }

  const handleLogout = async () => {
    await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
    })
    toast.success("Logged out successfully")
    router.push("/customer/login")
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

  const getStatusBadge = (status: string) => {
    const badges = {
      pending: "bg-yellow-100 text-yellow-800",
      approved: "bg-green-100 text-green-800",
      rejected: "bg-red-100 text-red-800",
    }
    return badges[status as keyof typeof badges] || "bg-gray-100 text-gray-800"
  }

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>
  }

  return (
    <SidebarProvider>
      <div className="flex h-screen bg-background w-full">
        <CustomerNav customer={customer} onLogout={handleLogout} />
        <SidebarInset>
          <header className="flex items-center gap-2 border-b p-4 md:hidden">
            <SidebarTrigger />
            <h1 className="text-lg font-semibold">Product Requests</h1>
          </header>
          <main className="flex-1 overflow-auto">
            <div className="p-8">
              <div className="flex items-center gap-4 mb-8">
                <Button variant="ghost" asChild>
                  <Link href="/customer/dashboard">
                    <ArrowLeft size={20} />
                  </Link>
                </Button>
                <h1 className="text-3xl font-bold hidden md:block">Product Requests</h1>
              </div>

              {!showForm ? (
                <Button onClick={() => setShowForm(true)} className="mb-8">
                  New Request
                </Button>
              ) : (
                <Card className="mb-8">
                  <CardHeader>
                    <CardTitle>Submit Product Request</CardTitle>
                    <CardDescription>Request a new product or service from the Hazelnutcyborg CRM team</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleSubmitRequest} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="productName">Product/Service Name</Label>
                        <Input
                          id="productName"
                          value={formData.productName}
                          onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
                          placeholder="e.g., Backup System, VPN Setup"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                          id="description"
                          value={formData.description}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                          placeholder="Describe what you need and why..."
                          rows={4}
                        />
                      </div>

                      <div className="flex gap-2">
                        <Button type="submit" disabled={submitting}>
                          {submitting ? "Submitting..." : "Submit Request"}
                        </Button>
                        <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                          Cancel
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              )}

              {requests.length === 0 ? (
                <Card>
                  <CardContent className="pt-8 text-center">
                    <p className="text-muted-foreground mb-4">No product requests yet</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {requests.map((request) => (
                    <Card key={request.id}>
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              {getStatusIcon(request.status)}
                              <h3 className="font-semibold text-lg">{request.product_name}</h3>
                            </div>
                            <p className="text-muted-foreground mb-4">{request.description}</p>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span>Submitted: {new Date(request.created_at).toLocaleDateString()}</span>
                              {request.reviewed_at && (
                                <span>Reviewed: {new Date(request.reviewed_at).toLocaleDateString()}</span>
                              )}
                            </div>
                          </div>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(request.status)}`}
                          >
                            {request.status}
                          </span>
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
