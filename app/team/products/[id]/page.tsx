"use client"

import { useEffect, useState, use } from "react"
import { useRouter } from "next/navigation"
import { TeamNav } from "@/components/team/team-nav"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
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
import { toast } from "sonner"
import { ArrowLeft, Pencil, UserPlus, Trash2 } from "lucide-react"
import Link from "next/link"
import { SidebarProvider } from "@/components/ui/sidebar"

export default function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [product, setProduct] = useState<any>(null)
  const [assignments, setAssignments] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [customers, setCustomers] = useState<any[]>([])
  const [isEditing, setIsEditing] = useState(false)
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState("")
  const [assignmentNotes, setAssignmentNotes] = useState("")
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category_id: "",
    serial_number: "",
    warranty_info: "",
    purchase_date: "",
    status: "",
  })

  useEffect(() => {
    fetchSession()
    fetchCategories()
    fetchCustomers()
  }, [])

  useEffect(() => {
    if (user) {
      fetchProduct()
    }
  }, [user, id])

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
        setProduct(data.product)
        setAssignments(data.assignments || [])
        setFormData({
          name: data.product.name || "",
          description: data.product.description || "",
          category_id: data.product.category_id || "",
          serial_number: data.product.serial_number || "",
          warranty_info: data.product.warranty_info || "",
          purchase_date: data.product.purchase_date ? data.product.purchase_date.split("T")[0] : "",
          status: data.product.status || "active",
        })
      } else {
        toast.error("Product not found")
        router.push("/team/products")
      }
    } catch (error) {
      console.error("Failed to fetch product:", error)
      toast.error("Failed to fetch product")
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

  const handleUpdate = async () => {
    try {
      const response = await fetch(`/api/catalog/products/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        toast.success("Product updated successfully")
        setIsEditing(false)
        fetchProduct()
      } else {
        const data = await response.json()
        toast.error(data.message || "Failed to update product")
      }
    } catch (error) {
      toast.error("Failed to update product")
    }
  }

  const handleAssignProduct = async () => {
    if (!selectedCustomer) {
      toast.error("Please select a customer")
      return
    }

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
        setIsAssignDialogOpen(false)
        setSelectedCustomer("")
        setAssignmentNotes("")
        fetchProduct()
      } else {
        toast.error(data.message || "Failed to assign product")
      }
    } catch (error) {
      toast.error("Failed to assign product")
    }
  }

  const handleUnassign = async (customerId: string) => {
    try {
      const response = await fetch(`/api/catalog/products/${id}/assign?customer_id=${customerId}`, {
        method: "DELETE",
        credentials: "include",
      })

      if (response.ok) {
        toast.success("Product unassigned successfully")
        fetchProduct()
      } else {
        const data = await response.json()
        toast.error(data.message || "Failed to unassign product")
      }
    } catch (error) {
      toast.error("Failed to unassign product")
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

  if (loading || !product) {
    return <div>Loading...</div>
  }

  if (!user) {
    return null
  }

  const canEdit = ["super_admin", "admin", "manager"].includes(user.role)

  return (
    <SidebarProvider>
      <div className="flex h-screen bg-background">
        <TeamNav user={user} onLogout={handleLogout} />
        <main className="flex-1 overflow-auto">
          <div className="p-8">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <Button variant="ghost" asChild>
                  <Link href="/team/products">
                    <ArrowLeft size={20} />
                  </Link>
                </Button>
                <div>
                  <h1 className="text-3xl font-bold">{product.name}</h1>
                  <p className="text-muted-foreground font-mono">{product.product_code}</p>
                </div>
              </div>
              {canEdit && (
                <Button onClick={() => setIsEditing(!isEditing)} variant="outline" className="gap-2">
                  <Pencil size={16} />
                  {isEditing ? "Cancel" : "Edit"}
                </Button>
              )}
            </div>

            <div className="max-w-4xl space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Product Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {isEditing ? (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-2">
                        <Label htmlFor="name">Product Name</Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="category">Category</Label>
                        <Select
                          value={formData.category_id}
                          onValueChange={(value) => setFormData({ ...formData, category_id: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map((cat) => (
                              <SelectItem key={cat.id} value={cat.id}>
                                {cat.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="status">Status</Label>
                        <Select
                          value={formData.status}
                          onValueChange={(value) => setFormData({ ...formData, status: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="inactive">Inactive</SelectItem>
                            <SelectItem value="maintenance">Maintenance</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="serial_number">Serial Number</Label>
                        <Input
                          id="serial_number"
                          value={formData.serial_number}
                          onChange={(e) => setFormData({ ...formData, serial_number: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="warranty_info">Warranty Info</Label>
                        <Input
                          id="warranty_info"
                          value={formData.warranty_info}
                          onChange={(e) => setFormData({ ...formData, warranty_info: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="purchase_date">Purchase Date</Label>
                        <Input
                          id="purchase_date"
                          type="date"
                          value={formData.purchase_date}
                          onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
                        />
                      </div>
                      <div className="col-span-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                          id="description"
                          value={formData.description}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                          rows={3}
                        />
                      </div>
                      <div className="col-span-2">
                        <Button onClick={handleUpdate} className="w-full">
                          Save Changes
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Category</p>
                        <Badge variant="outline">{product.category_name || "Uncategorized"}</Badge>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Status</p>
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
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Serial Number</p>
                        <p className="font-mono">{product.serial_number || "—"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Warranty Info</p>
                        <p>{product.warranty_info || "—"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Purchase Date</p>
                        <p>{product.purchase_date ? new Date(product.purchase_date).toLocaleDateString() : "—"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Created</p>
                        <p>{new Date(product.created_at).toLocaleDateString()}</p>
                      </div>
                      {product.description && (
                        <div className="col-span-2">
                          <p className="text-sm text-muted-foreground">Description</p>
                          <p>{product.description}</p>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Customer Assignments</CardTitle>
                  {canEdit && (
                    <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
                      <DialogTrigger asChild>
                        <Button size="sm" className="gap-2">
                          <UserPlus size={16} />
                          Assign to Customer
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Assign Product to Customer</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label>Customer</Label>
                            <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select customer" />
                              </SelectTrigger>
                              <SelectContent>
                                {customers
                                  .filter((c) => !assignments.find((a) => a.customer_id === c.id))
                                  .map((c) => (
                                    <SelectItem key={c.id} value={c.id}>
                                      {c.company_name}
                                    </SelectItem>
                                  ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label>Notes (optional)</Label>
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
                  )}
                </CardHeader>
                <CardContent>
                  {assignments.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      This product is not assigned to any customers
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Customer</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Assigned</TableHead>
                          <TableHead>Notes</TableHead>
                          {canEdit && <TableHead>Actions</TableHead>}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {assignments.map((assignment) => (
                          <TableRow key={assignment.id}>
                            <TableCell className="font-medium">{assignment.company_name}</TableCell>
                            <TableCell>{assignment.contact_email}</TableCell>
                            <TableCell>{new Date(assignment.assigned_at).toLocaleDateString()}</TableCell>
                            <TableCell>{assignment.notes || "—"}</TableCell>
                            {canEdit && (
                              <TableCell>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button variant="destructive" size="sm" className="gap-2">
                                      <Trash2 size={14} />
                                      Unassign
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Unassign Product</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Are you sure you want to remove this product from {assignment.company_name}?
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <div className="flex gap-4 justify-end">
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => handleUnassign(assignment.customer_id)}
                                        className="bg-destructive"
                                      >
                                        Unassign
                                      </AlertDialogAction>
                                    </div>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </TableCell>
                            )}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  )
}
