"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import { CustomerNav } from "@/components/customer/customer-nav"
import { ArrowLeft, Ticket, Package, Calendar, Tag, Cpu, Building } from "lucide-react"
import Link from "next/link"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"

export default function ProductDetailPage() {
  const router = useRouter()
  const params = useParams()
  const productId = params.id as string
  const [customer, setCustomer] = useState<any>(null)
  const [product, setProduct] = useState<any>(null)
  const [loading, setLoading] = useState(true)

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

        const response = await fetch(`/api/catalog/products/${productId}`, {
          credentials: "include",
        })
        if (response.ok) {
          const data = await response.json()
          setProduct(data)
        } else if (response.status === 401) {
          router.push("/customer/login")
        } else {
          toast.error("Product not found")
          router.push("/customer/products")
        }
      } catch (error) {
        console.error("[v0] Load product error:", error)
        toast.error("Failed to load product")
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [router, productId])

  const handleLogout = async () => {
    await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
    })
    toast.success("Logged out successfully")
    router.push("/customer/login")
  }

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>
  }

  if (!product) {
    return <div className="flex items-center justify-center h-screen">Product not found</div>
  }

  return (
    <SidebarProvider>
      <div className="flex h-screen bg-background w-full">
        <CustomerNav customer={customer} onLogout={handleLogout} />
        <SidebarInset>
          <header className="flex items-center gap-2 border-b p-4 md:hidden">
            <SidebarTrigger />
            <h1 className="text-lg font-semibold">Product Details</h1>
          </header>
          <main className="flex-1 overflow-auto">
            <div className="p-4 md:p-8 w-full">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                <div className="flex items-center gap-4">
                  <Button variant="ghost" size="icon" asChild>
                    <Link href="/customer/products">
                      <ArrowLeft size={20} />
                    </Link>
                  </Button>
                  <div>
                    <h1 className="text-2xl md:text-3xl font-bold">{product.name}</h1>
                    <p className="text-muted-foreground font-mono">{product.product_code}</p>
                  </div>
                </div>
                <Button asChild size="lg">
                  <Link href={`/customer/tickets/create?productId=${product.id}`}>
                    <Ticket className="mr-2" size={20} />
                    Create Support Ticket
                  </Link>
                </Button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Details */}
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Package size={20} />
                      Product Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">Product ID</p>
                        <code className="text-sm bg-muted px-2 py-1 rounded font-mono">{product.product_code}</code>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">Category</p>
                        <Badge variant="outline" className="text-sm">
                          <Tag size={12} className="mr-1" />
                          {product.category_name || "Uncategorized"}
                        </Badge>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">Brand</p>
                        <p className="flex items-center gap-2">
                          <Building size={16} className="text-muted-foreground" />
                          {product.brand || "Not specified"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">Model</p>
                        <p className="flex items-center gap-2">
                          <Cpu size={16} className="text-muted-foreground" />
                          {product.model || "Not specified"}
                        </p>
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-2">Description</p>
                      <p className="text-sm leading-relaxed">{product.description || "No description available"}</p>
                    </div>

                    {product.serial_number && (
                      <>
                        <Separator />
                        <div>
                          <p className="text-sm font-medium text-muted-foreground mb-1">Serial Number</p>
                          <code className="text-sm bg-muted px-2 py-1 rounded font-mono">{product.serial_number}</code>
                        </div>
                      </>
                    )}

                    {product.specifications && (
                      <>
                        <Separator />
                        <div>
                          <p className="text-sm font-medium text-muted-foreground mb-2">Specifications</p>
                          <pre className="text-sm bg-muted p-4 rounded-lg overflow-x-auto whitespace-pre-wrap">
                            {typeof product.specifications === "string"
                              ? product.specifications
                              : JSON.stringify(product.specifications, null, 2)}
                          </pre>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>

                {/* Status & Quick Actions */}
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Status</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Badge
                        className={`text-base px-4 py-2 ${
                          product.status === "active"
                            ? "bg-green-100 text-green-800"
                            : product.status === "maintenance"
                              ? "bg-yellow-100 text-yellow-800"
                              : product.status === "retired"
                                ? "bg-red-100 text-red-800"
                                : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {product.status?.charAt(0).toUpperCase() + product.status?.slice(1)}
                      </Badge>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Calendar size={18} />
                        Timeline
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Added to System</p>
                        <p className="text-sm">{new Date(product.created_at).toLocaleDateString()}</p>
                      </div>
                      {product.assigned_at && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Assigned to You</p>
                          <p className="text-sm">{new Date(product.assigned_at).toLocaleDateString()}</p>
                        </div>
                      )}
                      {product.updated_at && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Last Updated</p>
                          <p className="text-sm">{new Date(product.updated_at).toLocaleDateString()}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Need Help?</CardTitle>
                      <CardDescription>Create a support ticket for this product</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button className="w-full" asChild>
                        <Link href={`/customer/tickets/create?productId=${product.id}`}>
                          <Ticket className="mr-2" size={18} />
                          Create Ticket
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}
