"use client"

import { useEffect, useState, use } from "react"
import { useRouter } from "next/navigation"
import { TeamNav } from "@/components/team/team-nav"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { ArrowLeft, Package, Search } from "lucide-react"
import Link from "next/link"
import { SidebarProvider } from "@/components/ui/sidebar"

export default function AssignProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [product, setProduct] = useState<any>(null)
  const [customers, setCustomers] = useState<any[]>([])
  const [filteredCustomers, setFilteredCustomers] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCustomer, setSelectedCustomer] = useState("")
  const [assignmentNotes, setAssignmentNotes] = useState("")

  useEffect(() => {
    fetchSession()
    fetchProduct()
    fetchCustomers()
  }, [])

  useEffect(() => {
    if (searchQuery) {
      const filtered = customers.filter(
        (c) =>
          c.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.email?.toLowerCase().includes(searchQuery.toLowerCase())
      )
      setFilteredCustomers(filtered)
    } else {
      setFilteredCustomers(customers)
    }
  }, [searchQuery, customers])

  const fetchSession = async () => {
    try {
      const response = await fetch("/api/auth/session", {
        credentials: "include",
      })

      if (!response.ok) {
        router.push("/team/login")
        return
      }

      const data = await response.json()

      if (data.type !== "team") {
        router.push("/team/login")
        return
      }

      setUser(data.session)
    } catch (error) {
      console.error("[v0] Session error:", error)
      router.push("/team/login")
    } finally {
      setLoading(false)
    }
  }

  const fetchProduct = async () => {
    try {
      const response = await fetch(`/api/catalog/products/${id}`, {
        credentials: "include",
      })
      if (response.ok) {
        const data = await response.json()
        setProduct(data.product || data)
      } else {
        toast.error("Product not found")
        router.push("/team/products")
      }
    } catch (error) {
      console.error("Failed to fetch product:", error)
      toast.error("Failed to load product")
    }
  }

  const fetchCustomers = async () => {
    try {
      const response = await fetch("/api/customers", {
        credentials: "include",
      })
      if (response.ok) {
        const data = await response.json()
        setCustomers(data)
        setFilteredCustomers(data)
      }
    } catch (error) {
      console.error("Failed to fetch customers:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedCustomer) {
      toast.error("Please select a customer")
      return
    }

    setSubmitting(true)

    try {
      const response = await fetch(`/api/catalog/products/${id}/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          customer_id: selectedCustomer,
          notes: assignmentNotes,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        toast.success("Product assigned successfully")
        router.push(`/team/products/${id}`)
      } else {
        toast.error(data.message || "Failed to assign product")
      }
    } catch (error) {
      console.error("[v0] Error assigning product:", error)
      toast.error("Failed to assign product")
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
    router.push("/team/login")
  }

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
        <main className="flex-1 overflow-auto">
          <div className="p-8">
            <div className="flex items-center gap-4 mb-8">
              <Button variant="ghost" asChild>
                <Link href={`/team/products/${id}`}>
                  <ArrowLeft size={20} />
                </Link>
              </Button>
              <h1 className="text-3xl font-bold">Assign Product to Customer</h1>
            </div>

            <div className="max-w-2xl space-y-6">
              {/* Product Info Card */}
              {product && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Package size={20} />
                      Product Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Product Code</p>
                        <p className="font-mono font-medium">{product.product_code}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Name</p>
                        <p className="font-medium">{product.name}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Category</p>
                        <Badge variant="outline">{product.category_name || "Uncategorized"}</Badge>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Status</p>
                        <Badge className={product.status === "active" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                          {product.status}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Assignment Form */}
              <form onSubmit={handleSubmit}>
                <Card>
                  <CardHeader>
                    <CardTitle>Select Customer</CardTitle>
                    <CardDescription>
                      Choose a customer to assign this product to. The customer will be able to view and create tickets for this product.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="search">Search Customers</Label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
                        <Input
                          id="search"
                          placeholder="Search by company name or email..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="customer">Customer *</Label>
                      <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a customer" />
                        </SelectTrigger>
                        <SelectContent>
                          {filteredCustomers.map((customer) => (
                            <SelectItem key={customer.id} value={customer.id}>
                              <div className="flex flex-col">
                                <span className="font-medium">{customer.company_name}</span>
                                <span className="text-xs text-muted-foreground">{customer.email}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="notes">Assignment Notes (Optional)</Label>
                      <Textarea
                        id="notes"
                        placeholder="Add any notes about this assignment..."
                        value={assignmentNotes}
                        onChange={(e) => setAssignmentNotes(e.target.value)}
                        rows={3}
                      />
                    </div>
                  </CardContent>
                </Card>

                <div className="flex gap-4 mt-6">
                  <Button type="submit" className="flex-1" disabled={submitting || !selectedCustomer}>
                    {submitting ? "Assigning..." : "Assign Product"}
                  </Button>
                  <Button type="button" variant="outline" asChild>
                    <Link href={`/team/products/${id}`}>Cancel</Link>
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  )
}
