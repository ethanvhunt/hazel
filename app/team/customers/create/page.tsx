"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { TeamNav } from "@/components/team/team-nav"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { ArrowLeft, Plus, X } from "lucide-react"
import Link from "next/link"
import { SidebarProvider } from "@/components/ui/sidebar"

interface Product {
  name: string
  description: string
}

export default function CreateCustomerPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [products, setProducts] = useState<Product[]>([])
  const [formData, setFormData] = useState({
    companyName: "",
    contactPerson: "",
    email: "",
    phone: "",
  })
  const [currentProduct, setCurrentProduct] = useState({
    name: "",
    description: "",
  })

  useEffect(() => {
    fetchSession()
  }, [])

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

      if (!["super_admin", "admin", "manager", "agent"].includes(data.session.role)) {
        toast.error("You do not have permission to create customers")
        router.push("/team/customers")
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

  const handleAddProduct = () => {
    if (!currentProduct.name.trim() || !currentProduct.description.trim()) {
      toast.error("Please fill in all product fields")
      return
    }

    setProducts([...products, currentProduct])
    setCurrentProduct({ name: "", description: "" })
    toast.success("Product added")
  }

  const handleRemoveProduct = (index: number) => {
    setProducts(products.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.companyName.trim() || !formData.contactPerson.trim() || !formData.email.trim()) {
      toast.error("Please fill in all required fields")
      return
    }

    setSubmitting(true)

    try {
      const response = await fetch("/api/customers/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          ...formData,
          products,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        toast.success("Customer created successfully")
        router.push("/team/customers")
      } else {
        toast.error(data.message || "Failed to create customer")
      }
    } catch (error) {
      console.error("[v0] Error creating customer:", error)
      toast.error("Failed to create customer")
    } finally {
      setSubmitting(false)
    }
  }

  const handleLogout = async () => {
    await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
      body: JSON.stringify({ type: "team" }),
    })
    toast.success("Logged out successfully")
    router.push("/team/login")
  }

  if (loading) {
    return <div>Loading...</div>
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
                <Link href="/team/customers">
                  <ArrowLeft size={20} />
                </Link>
              </Button>
              <h1 className="text-3xl font-bold">Create New Customer</h1>
            </div>

            <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
              {/* Customer Information Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Customer Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="companyName">Company Name *</Label>
                      <Input
                        id="companyName"
                        value={formData.companyName}
                        onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                        placeholder="Enter company name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="contactPerson">Contact Person *</Label>
                      <Input
                        id="contactPerson"
                        value={formData.contactPerson}
                        onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                        placeholder="Enter contact person name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="Enter email address"
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="Enter phone number"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Products Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Products</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Add Product Form */}
                  <div className="space-y-4 p-4 bg-muted rounded-lg">
                    <div>
                      <Label htmlFor="productName">Product Name</Label>
                      <Input
                        id="productName"
                        value={currentProduct.name}
                        onChange={(e) => setCurrentProduct({ ...currentProduct, name: e.target.value })}
                        placeholder="Enter product name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="productDescription">Description</Label>
                      <Textarea
                        id="productDescription"
                        value={currentProduct.description}
                        onChange={(e) => setCurrentProduct({ ...currentProduct, description: e.target.value })}
                        placeholder="Enter product description"
                        rows={3}
                      />
                    </div>
                    <Button type="button" onClick={handleAddProduct} className="w-full gap-2">
                      <Plus size={16} />
                      Add Product
                    </Button>
                  </div>

                  {/* Products List */}
                  {products.length > 0 && (
                    <div className="space-y-2">
                      <h3 className="font-semibold">Added Products ({products.length})</h3>
                      {products.map((product, index) => (
                        <div key={index} className="flex items-start justify-between gap-4 p-3 bg-muted rounded-lg">
                          <div className="flex-1">
                            <p className="font-medium">{product.name}</p>
                            <p className="text-sm text-muted-foreground">{product.description}</p>
                          </div>
                          <Button type="button" variant="ghost" size="sm" onClick={() => handleRemoveProduct(index)}>
                            <X size={16} />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Submit Button */}
              <div className="flex gap-4">
                <Button type="submit" className="flex-1" disabled={submitting}>
                  {submitting ? "Creating..." : "Create Customer"}
                </Button>
                <Button type="button" variant="outline" asChild>
                  <Link href="/team/customers">Cancel</Link>
                </Button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </SidebarProvider>
  )
}
