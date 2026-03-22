"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { TeamNav } from "@/components/team/team-nav"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { ArrowLeft, Package, Info, Settings, DollarSign, Shield, MapPin } from "lucide-react"
import Link from "next/link"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function CreateProductPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [categories, setCategories] = useState<any[]>([])
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category_id: "",
    brand: "",
    model: "",
    manufacturer: "",
    serial_number: "",
    part_number: "",
    sku: "",
    asset_tag: "",
    condition: "new",
    warranty_months: "",
    warranty_info: "",
    purchase_date: "",
    purchase_price: "",
    vendor: "",
    location: "",
    notes: "",
    // Specifications
    processor: "",
    memory: "",
    storage: "",
    display: "",
    graphics: "",
    connectivity: "",
    ports: "",
    dimensions: "",
    weight: "",
    power: "",
    os: "",
  })

  useEffect(() => {
    fetchSession()
    fetchCategories()
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

      if (!["super_admin", "admin", "manager"].includes(data.session.role)) {
        toast.error("You do not have permission to create products")
        router.push("/team/products")
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim() || !formData.category_id) {
      toast.error("Please fill in product name and category")
      return
    }

    setSubmitting(true)

    try {
      // Build specifications object
      const specifications: Record<string, string> = {}
      const specFields = ["processor", "memory", "storage", "display", "graphics", "connectivity", "ports", "dimensions", "weight", "power", "os"]
      for (const field of specFields) {
        if (formData[field as keyof typeof formData]) {
          specifications[field] = formData[field as keyof typeof formData] as string
        }
      }

      const payload = {
        name: formData.name,
        description: formData.description || undefined,
        category_id: formData.category_id,
        brand: formData.brand || undefined,
        model: formData.model || undefined,
        manufacturer: formData.manufacturer || undefined,
        serial_number: formData.serial_number || undefined,
        part_number: formData.part_number || undefined,
        sku: formData.sku || undefined,
        asset_tag: formData.asset_tag || undefined,
        condition: formData.condition,
        warranty_months: formData.warranty_months ? parseInt(formData.warranty_months) : undefined,
        warranty_info: formData.warranty_info || undefined,
        purchase_date: formData.purchase_date || undefined,
        purchase_price: formData.purchase_price ? parseFloat(formData.purchase_price) : undefined,
        vendor: formData.vendor || undefined,
        location: formData.location || undefined,
        notes: formData.notes || undefined,
        specifications: Object.keys(specifications).length > 0 ? specifications : undefined,
      }

      const response = await fetch("/api/catalog/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      if (response.ok) {
        toast.success(`Product created successfully with ID: ${data.product.product_code}`)
        router.push("/team/products")
      } else {
        toast.error(data.message || "Failed to create product")
      }
    } catch (error) {
      console.error("[v0] Error creating product:", error)
      toast.error("Failed to create product")
    } finally {
      setSubmitting(false)
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
            <Package className="h-5 w-5 text-primary" />
            <h1 className="text-lg font-semibold">Add Product</h1>
          </header>
          
          <main className="flex-1 overflow-auto">
            <div className="w-full px-4 py-6 md:px-8 md:py-8">
              <div className="flex items-center gap-4 mb-8">
                <Button variant="ghost" size="icon" asChild>
                  <Link href="/team/products">
                    <ArrowLeft size={20} />
                  </Link>
                </Button>
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold">Add New Product</h1>
                  <p className="text-muted-foreground">Product ID will be auto-generated (PRD-XXXXXX)</p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="w-full space-y-6">
                <Tabs defaultValue="basic" className="w-full">
                  <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
                    <TabsTrigger value="basic" className="gap-2">
                      <Info className="h-4 w-4 hidden sm:inline" />
                      Basic
                    </TabsTrigger>
                    <TabsTrigger value="specs" className="gap-2">
                      <Settings className="h-4 w-4 hidden sm:inline" />
                      Specs
                    </TabsTrigger>
                    <TabsTrigger value="purchase" className="gap-2">
                      <DollarSign className="h-4 w-4 hidden sm:inline" />
                      Purchase
                    </TabsTrigger>
                    <TabsTrigger value="asset" className="gap-2">
                      <Shield className="h-4 w-4 hidden sm:inline" />
                      Asset
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="basic" className="mt-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Basic Information</CardTitle>
                        <CardDescription>Core product details</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="md:col-span-2">
                            <Label htmlFor="name">Product Name *</Label>
                            <Input
                              id="name"
                              value={formData.name}
                              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                              placeholder="Enter product name"
                            />
                          </div>
                          <div>
                            <Label htmlFor="category">Category *</Label>
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
                            <Label htmlFor="condition">Condition</Label>
                            <Select 
                              value={formData.condition} 
                              onValueChange={(value) => setFormData({ ...formData, condition: value })}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="new">New</SelectItem>
                                <SelectItem value="good">Good</SelectItem>
                                <SelectItem value="fair">Fair</SelectItem>
                                <SelectItem value="poor">Poor</SelectItem>
                                <SelectItem value="damaged">Damaged</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label htmlFor="brand">Brand</Label>
                            <Input
                              id="brand"
                              value={formData.brand}
                              onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                              placeholder="e.g., Dell, HP, Cisco"
                            />
                          </div>
                          <div>
                            <Label htmlFor="model">Model</Label>
                            <Input
                              id="model"
                              value={formData.model}
                              onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                              placeholder="e.g., OptiPlex 7090"
                            />
                          </div>
                          <div>
                            <Label htmlFor="manufacturer">Manufacturer</Label>
                            <Input
                              id="manufacturer"
                              value={formData.manufacturer}
                              onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                              placeholder="Enter manufacturer"
                            />
                          </div>
                          <div>
                            <Label htmlFor="serial_number">Serial Number</Label>
                            <Input
                              id="serial_number"
                              value={formData.serial_number}
                              onChange={(e) => setFormData({ ...formData, serial_number: e.target.value })}
                              placeholder="Enter serial number"
                            />
                          </div>
                          <div className="md:col-span-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                              id="description"
                              value={formData.description}
                              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                              placeholder="Enter product description"
                              rows={3}
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="specs" className="mt-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Technical Specifications</CardTitle>
                        <CardDescription>Hardware and technical details (all optional)</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="processor">Processor/CPU</Label>
                            <Input
                              id="processor"
                              value={formData.processor}
                              onChange={(e) => setFormData({ ...formData, processor: e.target.value })}
                              placeholder="e.g., Intel Core i7-11700"
                            />
                          </div>
                          <div>
                            <Label htmlFor="memory">Memory/RAM</Label>
                            <Input
                              id="memory"
                              value={formData.memory}
                              onChange={(e) => setFormData({ ...formData, memory: e.target.value })}
                              placeholder="e.g., 16GB DDR4"
                            />
                          </div>
                          <div>
                            <Label htmlFor="storage">Storage</Label>
                            <Input
                              id="storage"
                              value={formData.storage}
                              onChange={(e) => setFormData({ ...formData, storage: e.target.value })}
                              placeholder="e.g., 512GB NVMe SSD"
                            />
                          </div>
                          <div>
                            <Label htmlFor="display">Display</Label>
                            <Input
                              id="display"
                              value={formData.display}
                              onChange={(e) => setFormData({ ...formData, display: e.target.value })}
                              placeholder="e.g., 27inch 4K IPS"
                            />
                          </div>
                          <div>
                            <Label htmlFor="graphics">Graphics/GPU</Label>
                            <Input
                              id="graphics"
                              value={formData.graphics}
                              onChange={(e) => setFormData({ ...formData, graphics: e.target.value })}
                              placeholder="e.g., NVIDIA RTX 3070"
                            />
                          </div>
                          <div>
                            <Label htmlFor="os">Operating System</Label>
                            <Input
                              id="os"
                              value={formData.os}
                              onChange={(e) => setFormData({ ...formData, os: e.target.value })}
                              placeholder="e.g., Windows 11 Pro"
                            />
                          </div>
                          <div>
                            <Label htmlFor="connectivity">Connectivity</Label>
                            <Input
                              id="connectivity"
                              value={formData.connectivity}
                              onChange={(e) => setFormData({ ...formData, connectivity: e.target.value })}
                              placeholder="e.g., Wi-Fi 6, Bluetooth 5.0"
                            />
                          </div>
                          <div>
                            <Label htmlFor="ports">Ports</Label>
                            <Input
                              id="ports"
                              value={formData.ports}
                              onChange={(e) => setFormData({ ...formData, ports: e.target.value })}
                              placeholder="e.g., 4x USB 3.0, 2x HDMI"
                            />
                          </div>
                          <div>
                            <Label htmlFor="dimensions">Dimensions</Label>
                            <Input
                              id="dimensions"
                              value={formData.dimensions}
                              onChange={(e) => setFormData({ ...formData, dimensions: e.target.value })}
                              placeholder="e.g., 30x20x10 cm"
                            />
                          </div>
                          <div>
                            <Label htmlFor="weight">Weight</Label>
                            <Input
                              id="weight"
                              value={formData.weight}
                              onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                              placeholder="e.g., 2.5 kg"
                            />
                          </div>
                          <div className="md:col-span-2">
                            <Label htmlFor="power">Power Requirements</Label>
                            <Input
                              id="power"
                              value={formData.power}
                              onChange={(e) => setFormData({ ...formData, power: e.target.value })}
                              placeholder="e.g., 500W PSU, 110-240V"
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="purchase" className="mt-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Purchase Information</CardTitle>
                        <CardDescription>Procurement and warranty details (all optional)</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="purchase_date">Purchase Date</Label>
                            <Input
                              id="purchase_date"
                              type="date"
                              value={formData.purchase_date}
                              onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
                            />
                          </div>
                          <div>
                            <Label htmlFor="purchase_price">Purchase Price</Label>
                            <Input
                              id="purchase_price"
                              type="number"
                              step="0.01"
                              min="0"
                              value={formData.purchase_price}
                              onChange={(e) => setFormData({ ...formData, purchase_price: e.target.value })}
                              placeholder="Enter price"
                            />
                          </div>
                          <div>
                            <Label htmlFor="vendor">Vendor/Supplier</Label>
                            <Input
                              id="vendor"
                              value={formData.vendor}
                              onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
                              placeholder="Enter vendor name"
                            />
                          </div>
                          <div>
                            <Label htmlFor="warranty_months">Warranty (Months)</Label>
                            <Input
                              id="warranty_months"
                              type="number"
                              min="0"
                              value={formData.warranty_months}
                              onChange={(e) => setFormData({ ...formData, warranty_months: e.target.value })}
                              placeholder="e.g., 24"
                            />
                          </div>
                          <div className="md:col-span-2">
                            <Label htmlFor="warranty_info">Warranty Details</Label>
                            <Textarea
                              id="warranty_info"
                              value={formData.warranty_info}
                              onChange={(e) => setFormData({ ...formData, warranty_info: e.target.value })}
                              placeholder="e.g., 3-year on-site warranty with next-business-day response"
                              rows={2}
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="asset" className="mt-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Asset Management</CardTitle>
                        <CardDescription>Tracking and location information (all optional)</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="asset_tag">Asset Tag</Label>
                            <Input
                              id="asset_tag"
                              value={formData.asset_tag}
                              onChange={(e) => setFormData({ ...formData, asset_tag: e.target.value })}
                              placeholder="e.g., ASSET-001234"
                            />
                          </div>
                          <div>
                            <Label htmlFor="sku">SKU</Label>
                            <Input
                              id="sku"
                              value={formData.sku}
                              onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                              placeholder="Enter SKU"
                            />
                          </div>
                          <div>
                            <Label htmlFor="part_number">Part Number</Label>
                            <Input
                              id="part_number"
                              value={formData.part_number}
                              onChange={(e) => setFormData({ ...formData, part_number: e.target.value })}
                              placeholder="Enter part number"
                            />
                          </div>
                          <div>
                            <Label htmlFor="location">Location</Label>
                            <div className="relative">
                              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input
                                id="location"
                                value={formData.location}
                                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                placeholder="e.g., Building A, Room 101"
                                className="pl-9"
                              />
                            </div>
                          </div>
                          <div className="md:col-span-2">
                            <Label htmlFor="notes">Notes</Label>
                            <Textarea
                              id="notes"
                              value={formData.notes}
                              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                              placeholder="Additional notes about this product"
                              rows={3}
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>

                {/* Submit Button */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button type="submit" className="flex-1" disabled={submitting}>
                    {submitting ? "Creating..." : "Create Product"}
                  </Button>
                  <Button type="button" variant="outline" asChild>
                    <Link href="/team/products">Cancel</Link>
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
