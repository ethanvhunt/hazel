"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { Eye, Ticket, Search, Package } from "lucide-react"

interface ProductsListProps {
  customerId: string
}

export function ProductsList({ customerId }: ProductsListProps) {
  const [products, setProducts] = useState<any[]>([])
  const [filteredProducts, setFilteredProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    if (customerId) {
      fetchProducts()
    }
  }, [customerId])

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

  const fetchProducts = async () => {
    try {
      const response = await fetch(`/api/products`, {
        credentials: "include",
      })
      if (response.ok) {
        const data = await response.json()
        setProducts(data)
        setFilteredProducts(data)
      }
    } catch (error) {
      console.error("[v0] Error fetching products:", error)
      toast.error("Failed to fetch products")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-muted-foreground">Loading products...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Package size={20} />
              Your Products
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
                            Ticket
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
  )
}
