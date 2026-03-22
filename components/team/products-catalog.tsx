"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { Trash2, Eye, UserPlus, Search } from "lucide-react"
import { PRODUCT_CATEGORY_LABELS } from "@/lib/constants"

export function ProductsCatalog({ userRole }: { userRole: string }) {
  const router = useRouter()
  const [products, setProducts] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [customers, setCustomers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  // Filters
  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  
  // Assignment dialog
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<any>(null)
  const [selectedCustomer, setSelectedCustomer] = useState("")
  const [assignmentNotes, setAssignmentNotes] = useState("")

  useEffect(() => {
    fetchProducts()
    fetchCategories()
    fetchCustomers()
  }, [])

  useEffect(() => {
    fetchProducts()
  }, [searchQuery, categoryFilter, statusFilter])

  const fetchProducts = async () => {
    try {
      const params = new URLSearchParams()
      if (searchQuery) params.append("search", searchQuery)
      if (categoryFilter) params.append("category", categoryFilter)
      if (statusFilter) params.append("status", statusFilter)
      
      const response = await fetch(`/api/catalog/products?${params}`, {
        credentials: "include",
      })
      if (response.ok) {
        const data = await response.json()
        setProducts(data)
      }
    } catch (error) {
      toast.error("Failed to fetch products")
    } finally {
      setLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const response = await fetch("/api/catalog/categories", {
        credentials: "include",
      })
      if (response.ok) {
        const data = await response.json()
        setCategories(data)
      }
    } catch (error) {
      console.error("Failed to fetch categories:", error)
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
      }
    } catch (error) {
      console.error("Failed to fetch customers:", error)
    }
  }

  const handleAssignProduct = async () => {
    if (!selectedProduct || !selectedCustomer) {
      toast.error("Please select a customer")
      return
    }

    try {
      const response = await fetch(`/api/catalog/products/${selectedProduct.id}/assign`, {
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
        setIsAssignDialogOpen(false)
        setSelectedProduct(null)
        setSelectedCustomer("")
        setAssignmentNotes("")
        fetchProducts()
      } else {
        toast.error(data.message || "Failed to assign product")
      }
    } catch (error) {
      toast.error("Failed to assign product")
    }
  }

  const handleDeleteProduct = async (productId: string, productName: string) => {
    try {
      const response = await fetch(`/api/catalog/products/${productId}`, {
        method: "DELETE",
        credentials: "include",
      })

      const data = await response.json()

      if (!response.ok) {
        toast.error(data.message || "Failed to delete product")
        return
      }

      toast.success(`Product ${productName} deleted successfully`)
      fetchProducts()
    } catch (error) {
      console.error("[v0] Error deleting product:", error)
      toast.error("An error occurred while deleting product")
    }
  }

  const openAssignDialog = (product: any) => {
    setSelectedProduct(product)
    setIsAssignDialogOpen(true)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800"
      case "inactive":
        return "bg-gray-100 text-gray-800"
      case "maintenance":
        return "bg-yellow-100 text-yellow-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (loading) {
    return <div>Loading products...</div>
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>All Products</CardTitle>
        <div className="flex flex-wrap gap-4 mt-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
            <Input
              placeholder="Search by name or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.slug}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="maintenance">Maintenance</SelectItem>
            </SelectContent>
          </Select>
          <Button 
            variant="outline" 
            onClick={() => {
              setSearchQuery("")
              setCategoryFilter("")
              setStatusFilter("")
            }}
          >
            Clear Filters
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {products.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">No products found</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Serial Number</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => (
                <TableRow key={product.id} className="cursor-pointer hover:bg-muted/50">
                  <TableCell className="font-mono text-sm">{product.product_code}</TableCell>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {product.category_name || PRODUCT_CATEGORY_LABELS[product.category_slug] || "Uncategorized"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(product.status)}>
                      {product.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-sm">{product.serial_number || "—"}</TableCell>
                  <TableCell>{new Date(product.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-2 bg-transparent"
                        onClick={() => router.push(`/team/products/${product.id}`)}
                      >
                        <Eye size={16} />
                        View
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-2 bg-transparent"
                        onClick={() => openAssignDialog(product)}
                      >
                        <UserPlus size={16} />
                        Assign
                      </Button>
                      {userRole === "super_admin" && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="sm" className="gap-2">
                              <Trash2 size={16} />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Product</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete {product.name} ({product.product_code})? 
                                This will also remove all customer assignments. This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <div className="flex gap-4 justify-end">
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteProduct(product.id, product.name)}
                                className="bg-destructive"
                              >
                                Delete
                              </AlertDialogAction>
                            </div>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      {/* Assign Product Dialog */}
      <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Product to Customer</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedProduct && (
              <div className="p-3 bg-muted rounded-md">
                <p className="font-medium">{selectedProduct.name}</p>
                <p className="text-sm text-muted-foreground">{selectedProduct.product_code}</p>
              </div>
            )}
            <div>
              <label className="text-sm font-medium">Customer</label>
              <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
                <SelectTrigger>
                  <SelectValue placeholder="Select customer" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.company_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Notes (optional)</label>
              <Input
                placeholder="Assignment notes..."
                value={assignmentNotes}
                onChange={(e) => setAssignmentNotes(e.target.value)}
              />
            </div>
            <Button onClick={handleAssignProduct} className="w-full">
              Assign Product
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
