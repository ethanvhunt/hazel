"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { TeamNav } from "@/components/team/team-nav"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
import { ArrowLeft, Plus, Trash2, Lock } from "lucide-react"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { ExcelUploadsSection } from "@/components/team/excel-uploads-section"
import { CustomerUsersList } from "@/components/team/customer-users-list"
import { toast } from "sonner"

export default function CustomerDetailPage() {
  const router = useRouter()
  const params = useParams()
  const customerId = params.id as string

  const [user, setUser] = useState<any>(null)
  const [customer, setCustomer] = useState<any>(null)
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isEditMode, setIsEditMode] = useState(false)
  const [isAddProductOpen, setIsAddProductOpen] = useState(false)
  const [isPasswordResetOpen, setIsPasswordResetOpen] = useState(false)
  const [resetPassword, setResetPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isResettingPassword, setIsResettingPassword] = useState(false)
  const [editForm, setEditForm] = useState({
    companyName: "",
    contactPerson: "",
    phone: "",
  })
  const [productForm, setProductForm] = useState({
    name: "",
    description: "",
  })

  useEffect(() => {
    fetchSession()
  }, [])

  useEffect(() => {
    if (user) {
      fetchCustomerDetails()
      fetchProducts()
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

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!productForm.name.trim() || !productForm.description.trim()) {
      toast.error("All fields are required")
      return
    }

    try {
      const response = await fetch(`/api/products/team/${customerId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: productForm.name,
          description: productForm.description,
        }),
      })

      if (response.ok) {
        toast.success("Product added successfully")
        setIsAddProductOpen(false)
        setProductForm({ name: "", description: "" })
        fetchProducts()
      } else {
        const data = await response.json()
        toast.error(data.message || "Failed to add product")
      }
    } catch (error) {
      console.error("[v0] Error adding product:", error)
      toast.error("Failed to add product")
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

  const handleDeleteProduct = async (productId: string, productName: string) => {
    try {
      const response = await fetch(`/api/products/team/${productId}/delete`, {
        method: "DELETE",
        credentials: "include",
      })

      if (response.ok) {
        toast.success(`Product ${productName} deleted successfully`)
        fetchProducts()
      } else {
        const data = await response.json()
        toast.error(data.message || "Failed to delete product")
      }
    } catch (error) {
      console.error("[v0] Error deleting product:", error)
      toast.error("Failed to delete product")
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
            <div className="p-4 md:p-8">
              {/* Back button and title */}
              <div className="flex items-center gap-4 mb-8">
                <Button variant="ghost" size="sm" onClick={() => router.back()}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
                <h1 className="text-3xl font-bold hidden md:block">Customer Details</h1>
              </div>

              {/* Tabs for sections */}
              <Tabs defaultValue="details" className="space-y-4">
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

                <TabsContent value="products" className="space-y-6">
                  {/* Excel uploads section */}
                  <ExcelUploadsSection customerId={customerId} />

                  {/* Add Product dialog */}
                  {canAddProduct() && (
                    <Dialog open={isAddProductOpen} onOpenChange={setIsAddProductOpen}>
                      <DialogTrigger asChild>
                        <Button size="sm" className="gap-2">
                          <Plus size={16} />
                          Add Product
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Add New Product</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleAddProduct} className="space-y-4">
                          <div>
                            <Label htmlFor="name">Product Name</Label>
                            <Input
                              id="name"
                              value={productForm.name}
                              onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                              placeholder="Enter product name"
                            />
                          </div>
                          <div>
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                              id="description"
                              value={productForm.description}
                              onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                              placeholder="Enter product description"
                              rows={4}
                            />
                          </div>
                          <Button type="submit" className="w-full">
                            Add Product
                          </Button>
                        </form>
                      </DialogContent>
                    </Dialog>
                  )}

                  {/* Products table */}
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
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
                              <TableHead>Name</TableHead>
                              <TableHead>Description</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Created</TableHead>
                              <TableHead>Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {products.map((product) => (
                              <TableRow key={product.id}>
                                <TableCell className="font-medium">{product.name}</TableCell>
                                <TableCell>{product.description}</TableCell>
                                <TableCell>
                                  <Badge variant={product.status === "active" ? "default" : "secondary"}>
                                    {product.status}
                                  </Badge>
                                </TableCell>
                                <TableCell>{new Date(product.created_at).toLocaleDateString()}</TableCell>
                                <TableCell>
                                  {canAddProduct() && (
                                    <AlertDialog>
                                      <AlertDialogTrigger asChild>
                                        <Button variant="destructive" size="sm" className="gap-2">
                                          <Trash2 size={16} />
                                          Delete
                                        </Button>
                                      </AlertDialogTrigger>
                                      <AlertDialogContent>
                                        <AlertDialogHeader>
                                          <AlertDialogTitle>Delete Product</AlertDialogTitle>
                                          <AlertDialogDescription>
                                            Are you sure you want to delete {product.name}? This action cannot be
                                            undone.
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
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="users" className="space-y-6">
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
