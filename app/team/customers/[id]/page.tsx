"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { TeamNav } from "@/components/team/team-nav"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
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
import { ArrowLeft, Plus, Trash2, Lock, Check, ChevronsUpDown, X, Package } from "lucide-react"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { ExcelUploadsSection } from "@/components/team/excel-uploads-section"
import { CustomerUsersList } from "@/components/team/customer-users-list"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface CatalogProduct {
  id: string
  product_code: string
  name: string
  category_name?: string
}

export default function CustomerDetailPage() {
  const router = useRouter()
  const params = useParams()
  const customerId = params.id as string

  const [user, setUser] = useState<any>(null)
  const [customer, setCustomer] = useState<any>(null)
  const [products, setProducts] = useState<any[]>([])
  const [catalogProducts, setCatalogProducts] = useState<CatalogProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [isEditMode, setIsEditMode] = useState(false)
  const [isAddProductOpen, setIsAddProductOpen] = useState(false)
  const [isPasswordResetOpen, setIsPasswordResetOpen] = useState(false)
  const [resetPassword, setResetPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isResettingPassword, setIsResettingPassword] = useState(false)
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([])
  const [productsOpen, setProductsOpen] = useState(false)
  const [assigningProducts, setAssigningProducts] = useState(false)
  const [editForm, setEditForm] = useState({
    companyName: "",
    contactPerson: "",
    phone: "",
  })

  useEffect(() => {
    fetchSession()
  }, [])

  useEffect(() => {
    if (user) {
      fetchCustomerDetails()
      fetchProducts()
      fetchCatalogProducts()
    }
  }, [user, customerId])

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
    }
  }

  const fetchCustomerDetails = async () => {
    try {
      const response = await fetch(`/api/customers/${customerId}`, {
        credentials: "include",
      })

      if (response.ok) {
        const data = await response.json()
        setCustomer(data)
        setEditForm({
          companyName: data.company_name,
          contactPerson: data.contact_person,
          phone: data.phone || "",
        })
      } else {
        toast.error("Failed to fetch customer details")
        router.push("/team/customers")
      }
    } catch (error) {
      console.error("[v0] Error fetching customer:", error)
      toast.error("Failed to fetch customer details")
    } finally {
      setLoading(false)
    }
  }

  const fetchProducts = async () => {
    try {
      const response = await fetch(`/api/products/team/${customerId}`, {
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

  const fetchCatalogProducts = async () => {
    try {
      const response = await fetch("/api/catalog/products", {
        credentials: "include",
      })
      if (response.ok) {
        const data = await response.json()
        setCatalogProducts(data)
      }
    } catch (error) {
      console.error("[v0] Error fetching catalog products:", error)
    }
  }

  const handleToggleProduct = (productId: string) => {
    setSelectedProductIds(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    )
  }

  const handleRemoveSelectedProduct = (productId: string) => {
    setSelectedProductIds(prev => prev.filter(id => id !== productId))
  }

  const handleAssignProducts = async () => {
    if (selectedProductIds.length === 0) {
      toast.error("Please select at least one product to assign")
      return
    }

    setAssigningProducts(true)
    let successCount = 0
    let errorCount = 0

    for (const productId of selectedProductIds) {
      try {
        const response = await fetch(`/api/catalog/products/${productId}/assign`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            customer_id: customerId,
          }),
        })

        if (response.ok) {
          successCount++
        } else {
          const data = await response.json()
          if (data.message?.includes("already assigned")) {
            // Skip already assigned products silently
          } else {
            errorCount++
          }
        }
      } catch (error) {
        console.error("[v0] Error assigning product:", error)
        errorCount++
      }
    }

    setAssigningProducts(false)
    setSelectedProductIds([])
    setIsAddProductOpen(false)

    if (successCount > 0) {
      toast.success(`Successfully assigned ${successCount} product(s)`)
      fetchProducts()
    }
    if (errorCount > 0) {
      toast.error(`Failed to assign ${errorCount} product(s)`)
    }
  }

  const handleUpdateCustomer = async () => {
    try {
      const response = await fetch(`/api/customers/${customerId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          companyName: editForm.companyName,
          contactPerson: editForm.contactPerson,
          phone: editForm.phone,
        }),
      })

      if (response.ok) {
        toast.success("Customer updated successfully")
        setIsEditMode(false)
        fetchCustomerDetails()
      } else {
        const data = await response.json()
        toast.error(data.message || "Failed to update customer")
      }
    } catch (error) {
      console.error("[v0] Error updating customer:", error)
      toast.error("Failed to update customer")
    }
  }

  const handleResetPassword = async () => {
    if (!resetPassword.trim()) {
      toast.error("Password cannot be empty")
      return
    }

    if (resetPassword.length < 6) {
      toast.error("Password must be at least 6 characters")
      return
    }

    if (resetPassword !== confirmPassword) {
      toast.error("Passwords do not match")
      return
    }

    setIsResettingPassword(true)

    try {
      const response = await fetch("/api/password/customer/admin-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          customerId,
          newPassword: resetPassword,
        }),
      })

      if (response.ok) {
        toast.success("Customer password reset successfully")
        setIsPasswordResetOpen(false)
        setResetPassword("")
        setConfirmPassword("")
      } else {
        const data = await response.json()
        toast.error(data.message || "Failed to reset password")
      }
    } catch (error) {
      console.error("[v0] Error resetting password:", error)
      toast.error("Failed to reset password")
    } finally {
      setIsResettingPassword(false)
    }
  }

  const handleUnassignProduct = async (productId: string, productName: string) => {
    try {
      const response = await fetch(`/api/catalog/products/${productId}/assign?customer_id=${customerId}`, {
        method: "DELETE",
        credentials: "include",
      })

      if (response.ok) {
        toast.success(`Product ${productName} unassigned successfully`)
        fetchProducts()
      } else {
        const data = await response.json()
        toast.error(data.message || "Failed to unassign product")
      }
    } catch (error) {
      console.error("[v0] Error unassigning product:", error)
      toast.error("Failed to unassign product")
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

  // Get catalog products that are not already assigned
  const getAvailableProducts = () => {
    const assignedProductIds = products.map(p => p.catalog_product_id || p.id)
    return catalogProducts.filter(cp => !assignedProductIds.includes(cp.id))
  }

  const getSelectedProducts = () => {
    return catalogProducts.filter(cp => selectedProductIds.includes(cp.id))
  }

  if (loading) {
    return <div>Loading...</div>
  }

  if (!user || !customer) {
    return null
  }

  const canAddProduct = () => {
    if (["super_admin", "admin", "manager"].includes(user.role)) {
      return true
    }
    if (user.role === "agent" && customer.assigned_agent?.id === user.userId) {
      return true
    }
    return false
  }

  const canEditCustomer = () => {
    if (["super_admin", "admin", "manager"].includes(user.role)) {
      return true
    }
    if (user.role === "agent" && customer.assigned_agent?.id === user.userId) {
      return true
    }
    return false
  }

  const canResetPassword = () => {
    return user.role === "super_admin"
  }

  const availableProducts = getAvailableProducts()

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full">
        <TeamNav user={user} onLogout={handleLogout} />
        <SidebarInset>
          <header className="flex items-center gap-2 border-b p-4 md:hidden">
            <SidebarTrigger />
            <h1 className="text-lg font-semibold">Customer Details</h1>
          </header>
          <main className="flex-1 overflow-auto">
            <div className="p-4 md:p-8 w-full">
              {/* Back button and title */}
              <div className="flex items-center gap-4 mb-8">
                <Button variant="ghost" size="sm" onClick={() => router.back()}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
                <h1 className="text-3xl font-bold hidden md:block">Customer Details</h1>
              </div>

              {/* Tabs for sections */}
              <Tabs defaultValue="details" className="space-y-4 w-full">
                <TabsList>
                  <TabsTrigger value="details">Details</TabsTrigger>
                  <TabsTrigger value="products">Products</TabsTrigger>
                  <TabsTrigger value="users">Users</TabsTrigger>
                </TabsList>

                <TabsContent value="details" className="space-y-6">
                  {/* Customer Information */}
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                      <CardTitle>Customer Information</CardTitle>
                      <div className="flex gap-2">
                        {canResetPassword() && (
                          <Dialog open={isPasswordResetOpen} onOpenChange={setIsPasswordResetOpen}>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                                <Lock className="h-4 w-4" />
                                Reset Password
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Reset Customer Password</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <Label htmlFor="newPassword">New Password</Label>
                                  <Input
                                    id="newPassword"
                                    type="password"
                                    value={resetPassword}
                                    onChange={(e) => setResetPassword(e.target.value)}
                                    placeholder="Enter new password (min 6 characters)"
                                  />
                                </div>
                                <div>
                                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                                  <Input
                                    id="confirmPassword"
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="Confirm new password"
                                  />
                                </div>
                                <div className="flex gap-2 justify-end">
                                  <Button
                                    variant="outline"
                                    onClick={() => {
                                      setIsPasswordResetOpen(false)
                                      setResetPassword("")
                                      setConfirmPassword("")
                                    }}
                                  >
                                    Cancel
                                  </Button>
                                  <Button onClick={handleResetPassword} disabled={isResettingPassword}>
                                    {isResettingPassword ? "Resetting..." : "Reset Password"}
                                  </Button>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                        )}
                        {canEditCustomer() && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              if (isEditMode) {
                                handleUpdateCustomer()
                              } else {
                                setIsEditMode(true)
                              }
                            }}
                          >
                            {isEditMode ? "Save Changes" : "Edit"}
                          </Button>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="grid gap-4">
                      {isEditMode ? (
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="companyName">Company Name</Label>
                            <Input
                              id="companyName"
                              value={editForm.companyName}
                              onChange={(e) => setEditForm({ ...editForm, companyName: e.target.value })}
                            />
                          </div>
                          <div>
                            <Label htmlFor="contactPerson">Contact Person</Label>
                            <Input
                              id="contactPerson"
                              value={editForm.contactPerson}
                              onChange={(e) => setEditForm({ ...editForm, contactPerson: e.target.value })}
                            />
                          </div>
                          <div>
                            <Label htmlFor="phone">Phone</Label>
                            <Input
                              id="phone"
                              value={editForm.phone}
                              onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                            />
                          </div>
                          <div>
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => {
                                setIsEditMode(false)
                                setEditForm({
                                  companyName: customer.company_name,
                                  contactPerson: customer.contact_person,
                                  phone: customer.phone || "",
                                })
                              }}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label className="text-muted-foreground">Company Name</Label>
                            <p className="text-lg font-medium">{customer.company_name}</p>
                          </div>
                          <div>
                            <Label className="text-muted-foreground">Contact Person</Label>
                            <p className="text-lg font-medium">{customer.contact_person}</p>
                          </div>
                          <div>
                            <Label className="text-muted-foreground">Email</Label>
                            <p className="text-lg font-medium">{customer.email}</p>
                          </div>
                          <div>
                            <Label className="text-muted-foreground">Phone</Label>
                            <p className="text-lg font-medium">{customer.phone || "—"}</p>
                          </div>
                          <div>
                            <Label className="text-muted-foreground">Assigned To</Label>
                            <p className="text-lg font-medium">{customer.assigned_agent?.full_name || "Unassigned"}</p>
                          </div>
                          <div>
                            <Label className="text-muted-foreground">Created At</Label>
                            <p className="text-lg font-medium">{new Date(customer.created_at).toLocaleDateString()}</p>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="products" className="space-y-6 w-full">
                  {/* Excel uploads section */}
                  <ExcelUploadsSection customerId={customerId} />

                  {/* Add Product from Catalog dialog */}
                  {canAddProduct() && (
                    <Dialog open={isAddProductOpen} onOpenChange={(open) => {
                      setIsAddProductOpen(open)
                      if (!open) {
                        setSelectedProductIds([])
                      }
                    }}>
                      <DialogTrigger asChild>
                        <Button size="sm" className="gap-2">
                          <Plus size={16} />
                          Assign Products from Catalog
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Assign Products from Catalog</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          {/* Product Selection */}
                          <div className="space-y-2">
                            <Label>Select Products</Label>
                            <Popover open={productsOpen} onOpenChange={setProductsOpen}>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  role="combobox"
                                  aria-expanded={productsOpen}
                                  className="w-full justify-between"
                                >
                                  {selectedProductIds.length > 0
                                    ? `${selectedProductIds.length} product(s) selected`
                                    : "Select products..."}
                                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-full p-0" align="start">
                                <Command>
                                  <CommandInput placeholder="Search products..." />
                                  <CommandList>
                                    <CommandEmpty>No products available</CommandEmpty>
                                    <CommandGroup>
                                      {availableProducts.map((product) => (
                                        <CommandItem
                                          key={product.id}
                                          value={`${product.product_code} ${product.name}`}
                                          onSelect={() => handleToggleProduct(product.id)}
                                        >
                                          <Check
                                            className={cn(
                                              "mr-2 h-4 w-4",
                                              selectedProductIds.includes(product.id) ? "opacity-100" : "opacity-0"
                                            )}
                                          />
                                          <div className="flex flex-col">
                                            <span className="font-medium">{product.product_code}</span>
                                            <span className="text-sm text-muted-foreground">{product.name}</span>
                                            {product.category_name && (
                                              <span className="text-xs text-muted-foreground">{product.category_name}</span>
                                            )}
                                          </div>
                                        </CommandItem>
                                      ))}
                                    </CommandGroup>
                                  </CommandList>
                                </Command>
                              </PopoverContent>
                            </Popover>
                          </div>

                          {/* Selected Products */}
                          {selectedProductIds.length > 0 && (
                            <div className="space-y-2">
                              <Label>Selected Products</Label>
                              <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto p-2 border rounded-md">
                                {getSelectedProducts().map((product) => (
                                  <Badge key={product.id} variant="secondary" className="gap-1 py-1">
                                    <Package className="h-3 w-3" />
                                    {product.product_code} - {product.name}
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveSelectedProduct(product.id)}
                                      className="ml-1 hover:bg-muted rounded-full"
                                    >
                                      <X className="h-3 w-3" />
                                    </button>
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}

                          <div className="flex gap-2 justify-end">
                            <Button
                              variant="outline"
                              onClick={() => {
                                setIsAddProductOpen(false)
                                setSelectedProductIds([])
                              }}
                            >
                              Cancel
                            </Button>
                            <Button 
                              onClick={handleAssignProducts} 
                              disabled={assigningProducts || selectedProductIds.length === 0}
                            >
                              {assigningProducts ? "Assigning..." : `Assign ${selectedProductIds.length} Product(s)`}
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}

                  {/* Products table */}
                  <Card className="w-full">
                    <CardHeader>
                      <div>
                        <CardTitle>Products</CardTitle>
                        <CardDescription>Products assigned to this customer</CardDescription>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {products.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">No products assigned yet</div>
                      ) : (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Product Code</TableHead>
                              <TableHead>Name</TableHead>
                              <TableHead>Category</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Assigned</TableHead>
                              <TableHead>Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {products.map((product) => (
                              <TableRow key={product.id}>
                                <TableCell className="font-mono text-sm">{product.product_code || product.name}</TableCell>
                                <TableCell className="font-medium">{product.name}</TableCell>
                                <TableCell>{product.category_name || "—"}</TableCell>
                                <TableCell>
                                  <Badge variant={product.status === "active" ? "default" : "secondary"}>
                                    {product.status}
                                  </Badge>
                                </TableCell>
                                <TableCell>{new Date(product.assigned_at || product.created_at).toLocaleDateString()}</TableCell>
                                <TableCell>
                                  {canAddProduct() && (
                                    <AlertDialog>
                                      <AlertDialogTrigger asChild>
                                        <Button variant="destructive" size="sm" className="gap-2">
                                          <Trash2 size={16} />
                                          Unassign
                                        </Button>
                                      </AlertDialogTrigger>
                                      <AlertDialogContent>
                                        <AlertDialogHeader>
                                          <AlertDialogTitle>Unassign Product</AlertDialogTitle>
                                          <AlertDialogDescription>
                                            Are you sure you want to unassign {product.name} from this customer? 
                                            The product will remain in the catalog.
                                          </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <div className="flex gap-4 justify-end">
                                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                                          <AlertDialogAction
                                            onClick={() => handleUnassignProduct(product.catalog_product_id || product.id, product.name)}
                                            className="bg-destructive"
                                          >
                                            Unassign
                                          </AlertDialogAction>
                                        </div>
                                      </AlertDialogContent>
                                    </AlertDialog>
                                  )}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="users" className="space-y-6 w-full">
                  <CustomerUsersList customerId={customerId} userRole={user.role} />
                </TabsContent>
              </Tabs>
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}
