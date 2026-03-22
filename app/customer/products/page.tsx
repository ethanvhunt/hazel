"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { CustomerNav } from "@/components/customer/customer-nav"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { ExcelProductsSection } from "@/components/customer/excel-products-section"
import Link from "next/link"
import { Eye, Ticket, Search, Package } from "lucide-react"

export default function ProductsPage() {
  const router = useRouter()
  const [customer, setCustomer] = useState<any>(null)
  const [products, setProducts] = useState<any[]>([])
  const [filteredProducts, setFilteredProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")

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

        const response = await fetch(`/api/products`, {
          credentials: "include",
        })
        if (response.ok) {
          const data = await response.json()
          setProducts(data || [])
          setFilteredProducts(data || [])
        }
      } catch (error) {
        console.error("[v0] Load products error:", error)
        router.push("/customer/login")
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [router])

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredProducts(products)
    } else {
      const query = searchQuery.toLowerCase()
      const filtered = products.filter(
        (product) =>
          product.name?.toLowerCase().includes(query) ||
          product.product_code?.toLowerCase().includes(query) ||
          product.brand?.toLowerCase().includes(query) ||
          product.model?.toLowerCase().includes(query) ||
          product.category_name?.toLowerCase().includes(query)
      )
      setFilteredProducts(filtered)
    }
  }, [searchQuery, products])

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

  return (
    <SidebarProvider>
      <div className="flex h-screen bg-background w-full">
        <CustomerNav customer={customer} onLogout={handleLogout} />
        <SidebarInset>
          <header className="flex items-center gap-2 border-b p-4 md:hidden">
            <SidebarTrigger />
            <h1 className="text-lg font-semibold">Products</h1>
          </header>
          <main className="flex-1 overflow-auto">
            <div className="p-4 md:p-8">
              <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2 hidden md:block">Your Products</h1>
                <p className="text-muted-foreground">
                  Products assigned to you by the team. Need a new product or service?{" "}
                  <Link href="/customer/requests" className="text-primary hover:underline">
                    Submit a request
                  </Link>
                </p>
              </div>

              <ExcelProductsSection customerId={customer?.customerId} />

              <Card>
                <CardHeader>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Package size={20} />
                        Assigned Products
                      </CardTitle>
                      <CardDescription>{filteredProducts.length} products assigned to your account</CardDescription>
                    </div>
                    <div className="relative w-full sm:w-72">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                      <Input
                        placeholder="Search by name, ID, brand..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {filteredProducts.length === 0 ? (
                    <div className="text-center py-12">
                      <Package className="mx-auto text-muted-foreground mb-4" size={48} />
                      <p className="text-muted-foreground mb-4">
                        {searchQuery ? "No products match your search" : "No products assigned yet"}
                      </p>
                      {!searchQuery && (
                        <Button asChild>
                          <Link href="/customer/requests">Request a Product</Link>
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Product ID</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead className="hidden md:table-cell">Category</TableHead>
                            <TableHead className="hidden lg:table-cell">Brand / Model</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredProducts.map((product) => (
                            <TableRow key={product.id}>
                              <TableCell>
                                <code className="text-xs bg-muted px-2 py-1 rounded font-mono">
                                  {product.product_code}
                                </code>
                              </TableCell>
                              <TableCell className="font-medium">{product.name}</TableCell>
                              <TableCell className="hidden md:table-cell">
                                <Badge variant="outline">{product.category_name || "Uncategorized"}</Badge>
                              </TableCell>
                              <TableCell className="hidden lg:table-cell">
                                {product.brand && product.model
                                  ? `${product.brand} ${product.model}`
                                  : product.brand || product.model || "—"}
                              </TableCell>
                              <TableCell>
                                <Badge
                                  className={
                                    product.status === "active"
                                      ? "bg-green-100 text-green-800"
                                      : product.status === "maintenance"
                                        ? "bg-yellow-100 text-yellow-800"
                                        : "bg-gray-100 text-gray-800"
                                  }
                                >
                                  {product.status}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                  <Button variant="outline" size="sm" asChild>
                                    <Link href={`/customer/products/${product.id}`}>
                                      <Eye size={16} className="mr-1" />
                                      View
                                    </Link>
                                  </Button>
                                  <Button size="sm" asChild>
                                    <Link href={`/customer/tickets/create?productId=${product.id}`}>
                                      <Ticket size={16} className="mr-1" />
                                      Create Ticket
                                    </Link>
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}
