"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { TeamNav } from "@/components/team/team-nav"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { ArrowLeft, Plus, X, Users, Package, Building2, Check, ChevronsUpDown, Phone } from "lucide-react"
import Link from "next/link"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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

interface Product {
  id: string
  product_code: string
  name: string
  category_name?: string
}

interface CustomerUser {
  fullName: string
  email: string
  mobileNumber: string
  role: "customer_admin" | "customer_agent"
}

export default function CreateCustomerPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [availableProducts, setAvailableProducts] = useState<Product[]>([])
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([])
  const [customerUsers, setCustomerUsers] = useState<CustomerUser[]>([])
  const [productsOpen, setProductsOpen] = useState(false)
  const [formData, setFormData] = useState({
    companyName: "",
    contactPerson: "",
    email: "",
    phone: "",
  })
  const [currentUser, setCurrentUser] = useState<CustomerUser>({
    fullName: "",
    email: "",
    mobileNumber: "",
    role: "customer_agent",
  })

  useEffect(() => {
    fetchSession()
    fetchProducts()
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

  const fetchProducts = async () => {
    try {
      const response = await fetch("/api/catalog/products", {
        credentials: "include",
      })
      if (response.ok) {
        const data = await response.json()
        setAvailableProducts(data)
      }
    } catch (error) {
      console.error("[v0] Error fetching products:", error)
    }
  }

  const handleToggleProduct = (productId: string) => {
    setSelectedProductIds(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    )
  }

  const handleRemoveProduct = (productId: string) => {
    setSelectedProductIds(prev => prev.filter(id => id !== productId))
  }

  const handleAddUser = () => {
    if (!currentUser.fullName.trim() || !currentUser.email.trim() || !currentUser.mobileNumber.trim()) {
      toast.error("Please fill in all user fields including mobile number")
      return
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(currentUser.email)) {
      toast.error("Please enter a valid email address")
      return
    }

    // Check for duplicate email
    if (customerUsers.some(u => u.email.toLowerCase() === currentUser.email.toLowerCase())) {
      toast.error("A user with this email already exists")
      return
    }

    setCustomerUsers([...customerUsers, currentUser])
    setCurrentUser({
      fullName: "",
      email: "",
      mobileNumber: "",
      role: "customer_agent",
    })
    toast.success("User added")
  }

  const handleRemoveUser = (index: number) => {
    setCustomerUsers(customerUsers.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.companyName.trim() || !formData.contactPerson.trim() || !formData.email.trim()) {
      toast.error("Please fill in all required fields")
      return
    }

    setSubmitting(true)

    try {
      // Separate admin and agent users
      const customerAdmin = customerUsers.find(u => u.role === "customer_admin")
      const customerAgents = customerUsers.filter(u => u.role === "customer_agent")

      const response = await fetch("/api/customers/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          ...formData,
          customerAdmin,
          customerAgents,
          productIds: selectedProductIds,
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

  const selectedProducts = availableProducts.filter(p => selectedProductIds.includes(p.id))

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full bg-background">
        <TeamNav user={user} onLogout={handleLogout} />
        <SidebarInset className="flex-1 flex flex-col">
          <header className="sticky top-0 z-10 flex items-center gap-4 border-b bg-background/95 backdrop-blur px-4 py-3 md:hidden">
            <SidebarTrigger />
            <h1 className="text-lg font-semibold">Create Customer</h1>
          </header>
          
          <main className="flex-1 overflow-auto">
            <div className="w-full px-4 py-6 md:px-8 md:py-8">
              <div className="flex items-center gap-4 mb-8">
                <Button variant="ghost" size="icon" asChild>
                  <Link href="/team/customers">
                    <ArrowLeft size={20} />
                  </Link>
                </Button>
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold">Create New Customer</h1>
                  <p className="text-muted-foreground">Add a new customer with products and users</p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="w-full space-y-6">
                {/* Customer Information Card */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Building2 className="h-5 w-5 text-primary" />
                      <CardTitle>Customer Information</CardTitle>
                    </div>
                    <CardDescription>Basic details about the customer company</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    <div className="flex items-center gap-2">
                      <Package className="h-5 w-5 text-primary" />
                      <CardTitle>Assign Products</CardTitle>
                    </div>
                    <CardDescription>Select products to assign to this customer</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
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
                            <CommandEmpty>No products found.</CommandEmpty>
                            <CommandGroup>
                              {availableProducts.map((product) => (
                                <CommandItem
                                  key={product.id}
                                  value={product.name}
                                  onSelect={() => handleToggleProduct(product.id)}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      selectedProductIds.includes(product.id) ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                  <div className="flex flex-col">
                                    <span>{product.name}</span>
                                    <span className="text-xs text-muted-foreground">
                                      {product.product_code} {product.category_name ? `- ${product.category_name}` : ""}
                                    </span>
                                  </div>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>

                    {/* Selected Products */}
                    {selectedProducts.length > 0 && (
                      <div className="space-y-2">
                        <Label>Selected Products ({selectedProducts.length})</Label>
                        <div className="flex flex-wrap gap-2">
                          {selectedProducts.map((product) => (
                            <Badge
                              key={product.id}
                              variant="secondary"
                              className="gap-1 pr-1"
                            >
                              {product.name}
                              <span className="text-xs opacity-70">({product.product_code})</span>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-4 w-4 ml-1 hover:bg-destructive/20"
                                onClick={() => handleRemoveProduct(product.id)}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Customer Users Card */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-primary" />
                      <CardTitle>Customer Users</CardTitle>
                    </div>
                    <CardDescription>Add users who will manage this customer account</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Add User Form */}
                    <div className="space-y-4 p-4 bg-muted/50 rounded-lg border">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="userFullName">Full Name *</Label>
                          <Input
                            id="userFullName"
                            value={currentUser.fullName}
                            onChange={(e) => setCurrentUser({ ...currentUser, fullName: e.target.value })}
                            placeholder="Enter full name"
                          />
                        </div>
                        <div>
                          <Label htmlFor="userEmail">Email *</Label>
                          <Input
                            id="userEmail"
                            type="email"
                            value={currentUser.email}
                            onChange={(e) => setCurrentUser({ ...currentUser, email: e.target.value })}
                            placeholder="Enter email address"
                          />
                        </div>
                        <div>
                          <Label htmlFor="userMobile">Mobile Number *</Label>
                          <div className="relative">
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              id="userMobile"
                              value={currentUser.mobileNumber}
                              onChange={(e) => setCurrentUser({ ...currentUser, mobileNumber: e.target.value })}
                              placeholder="Enter mobile number"
                              className="pl-9"
                            />
                          </div>
                        </div>
                        <div>
                          <Label htmlFor="userRole">Role *</Label>
                          <Select
                            value={currentUser.role}
                            onValueChange={(value: "customer_admin" | "customer_agent") =>
                              setCurrentUser({ ...currentUser, role: value })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="customer_admin">Customer Admin</SelectItem>
                              <SelectItem value="customer_agent">Customer Agent</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <Button type="button" onClick={handleAddUser} className="w-full gap-2">
                        <Plus size={16} />
                        Add User
                      </Button>
                    </div>

                    {/* Users List */}
                    {customerUsers.length > 0 && (
                      <div className="space-y-2">
                        <Label>Added Users ({customerUsers.length})</Label>
                        <div className="space-y-2">
                          {customerUsers.map((user, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between gap-4 p-3 bg-card rounded-lg border"
                            >
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <p className="font-medium truncate">{user.fullName}</p>
                                  <Badge variant={user.role === "customer_admin" ? "default" : "secondary"} className="shrink-0">
                                    {user.role === "customer_admin" ? "Admin" : "Agent"}
                                  </Badge>
                                </div>
                                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 text-sm text-muted-foreground">
                                  <span className="truncate">{user.email}</span>
                                  <span className="flex items-center gap-1">
                                    <Phone className="h-3 w-3" />
                                    {user.mobileNumber}
                                  </span>
                                </div>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="shrink-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                                onClick={() => handleRemoveUser(index)}
                              >
                                <X size={16} />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Submit Button */}
                <div className="flex flex-col sm:flex-row gap-4">
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
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}
