"use client"

import type React from "react"

import { useEffect, useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CustomerNav } from "@/components/customer/customer-nav"
import { toast } from "sonner"
import { ArrowLeft, Search, Package } from "lucide-react"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"

function CreateTicketForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const preselectedProductId = searchParams.get("productId")

  const [customer, setCustomer] = useState<any>(null)
  const [products, setProducts] = useState<any[]>([])
  const [filteredProducts, setFilteredProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [productSearch, setProductSearch] = useState("")
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    productId: preselectedProductId || "",
    priority: "medium",
  })

  useEffect(() => {
    const fetchData = async () => {
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

        // Fetch products
        const productsResponse = await fetch(`/api/products`, {
          credentials: "include",
        })

        if (productsResponse.ok) {
          const productsData = await productsResponse.json()
          setProducts(productsData)
          setFilteredProducts(productsData)

          // If preselected product, set product search to that product's name
          if (preselectedProductId) {
            const selectedProduct = productsData.find((p: any) => p.id === preselectedProductId)
            if (selectedProduct) {
              setProductSearch(`${selectedProduct.product_code} - ${selectedProduct.name}`)
            }
          }
        }
      } catch (error) {
        console.error("[v0] Error fetching data:", error)
        router.push("/customer/login")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [router, preselectedProductId])

  useEffect(() => {
    if (productSearch.trim() === "") {
      setFilteredProducts(products)
    } else {
      const query = productSearch.toLowerCase()
      const filtered = products.filter(
        (product) =>
          product.name?.toLowerCase().includes(query) ||
          product.product_code?.toLowerCase().includes(query) ||
          product.brand?.toLowerCase().includes(query) ||
          product.model?.toLowerCase().includes(query)
      )
      setFilteredProducts(filtered)
    }
  }, [productSearch, products])

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" })
    router.push("/customer/login")
  }

  const validateForm = () => {
    if (!formData.title.trim()) {
      toast.error("Title is required")
      return false
    }
    if (!formData.description.trim()) {
      toast.error("Description is required")
      return false
    }
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          productId: formData.productId || null,
          priority: formData.priority,
        }),
        credentials: "include",
      })

      const data = await response.json()

      if (!response.ok) {
        toast.error(data.message || "Failed to create ticket")
        return
      }

      toast.success(data.message || "Ticket created successfully")
      router.push("/customer/tickets")
    } catch (error) {
      console.error("Error creating ticket:", error)
      toast.error("An error occurred while creating ticket")
    } finally {
      setSubmitting(false)
    }
  }

  const selectedProduct = products.find((p) => p.id === formData.productId)

  if (loading) return <div className="flex items-center justify-center h-screen">Loading...</div>
  if (!customer) return null

  return (
    <SidebarProvider>
      <div className="flex h-screen bg-background w-full">
        <CustomerNav customer={customer} onLogout={handleLogout} />
        <SidebarInset>
          <header className="flex items-center gap-2 border-b p-4 md:hidden">
            <SidebarTrigger />
            <h1 className="text-lg font-semibold">Create Support Ticket</h1>
          </header>
          <main className="flex-1 overflow-auto">
            <div className="p-4 md:p-8 w-full">
              <div className="flex items-center gap-4 mb-8">
                <Button variant="ghost" size="icon" asChild>
                  <Link href="/customer/tickets">
                    <ArrowLeft size={20} />
                  </Link>
                </Button>
                <h1 className="text-2xl md:text-3xl font-bold">Create Support Ticket</h1>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle>New Ticket</CardTitle>
                    <CardDescription>Create a new support ticket for assistance</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                      {/* Product Selection */}
                      <div className="space-y-2">
                        <Label htmlFor="product">Product (Optional)</Label>
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                          <Input
                            placeholder="Search by product name or ID..."
                            value={productSearch}
                            onChange={(e) => {
                              setProductSearch(e.target.value)
                              // Clear selection if search changed
                              if (formData.productId) {
                                const selected = products.find((p) => p.id === formData.productId)
                                if (
                                  selected &&
                                  !`${selected.product_code} - ${selected.name}`
                                    .toLowerCase()
                                    .includes(e.target.value.toLowerCase())
                                ) {
                                  setFormData({ ...formData, productId: "" })
                                }
                              }
                            }}
                            className="pl-9"
                          />
                        </div>
                        {productSearch && !formData.productId && filteredProducts.length > 0 && (
                          <div className="border rounded-md max-h-48 overflow-y-auto">
                            {filteredProducts.map((product) => (
                              <button
                                key={product.id}
                                type="button"
                                className="w-full text-left px-3 py-2 hover:bg-muted flex items-center gap-2 text-sm"
                                onClick={() => {
                                  setFormData({ ...formData, productId: product.id })
                                  setProductSearch(`${product.product_code} - ${product.name}`)
                                }}
                              >
                                <Package size={14} className="text-muted-foreground" />
                                <span className="font-mono text-xs text-muted-foreground">{product.product_code}</span>
                                <span className="font-medium">{product.name}</span>
                                {product.brand && (
                                  <span className="text-muted-foreground text-xs">({product.brand})</span>
                                )}
                              </button>
                            ))}
                          </div>
                        )}
                        {formData.productId && selectedProduct && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Package size={14} />
                            <span>
                              Selected: <strong>{selectedProduct.product_code}</strong> - {selectedProduct.name}
                            </span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-auto p-1 text-xs"
                              onClick={() => {
                                setFormData({ ...formData, productId: "" })
                                setProductSearch("")
                              }}
                            >
                              Clear
                            </Button>
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="title">
                          Title <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="title"
                          value={formData.title}
                          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                          placeholder="Brief description of the issue"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="description">
                          Description <span className="text-destructive">*</span>
                        </Label>
                        <Textarea
                          id="description"
                          value={formData.description}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                          placeholder="Detailed description of the issue including any error messages, steps to reproduce, etc."
                          rows={6}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="priority">Priority</Label>
                        <Select
                          value={formData.priority}
                          onValueChange={(value) => setFormData({ ...formData, priority: value })}
                        >
                          <SelectTrigger id="priority">
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

                      <div className="flex gap-4 pt-4">
                        <Button type="submit" disabled={submitting} className="flex-1">
                          {submitting ? "Creating..." : "Create Ticket"}
                        </Button>
                        <Button variant="outline" asChild className="flex-1">
                          <Link href="/customer/tickets">Cancel</Link>
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>

                {/* Help Section */}
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Tips for Creating Tickets</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 text-sm text-muted-foreground">
                      <div>
                        <p className="font-medium text-foreground">Be Specific</p>
                        <p>Include exact error messages and what you were doing when the issue occurred.</p>
                      </div>
                      <div>
                        <p className="font-medium text-foreground">Steps to Reproduce</p>
                        <p>If possible, list the steps that lead to the issue.</p>
                      </div>
                      <div>
                        <p className="font-medium text-foreground">Select Product</p>
                        <p>Selecting the related product helps us assign the right technician.</p>
                      </div>
                      <div>
                        <p className="font-medium text-foreground">Priority Level</p>
                        <p>Use Urgent only for critical business-stopping issues.</p>
                      </div>
                    </CardContent>
                  </Card>

                  {customer?.role === "customer_agent" && (
                    <Card className="border-yellow-200 bg-yellow-50">
                      <CardHeader>
                        <CardTitle className="text-yellow-800">Approval Required</CardTitle>
                      </CardHeader>
                      <CardContent className="text-sm text-yellow-700">
                        <p>
                          As a customer agent, your ticket will require approval from your customer admin before it is
                          sent to the support team.
                        </p>
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

export default function CreateTicketPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen">Loading...</div>}>
      <CreateTicketForm />
    </Suspense>
  )
}
