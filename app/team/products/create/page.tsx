"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { TeamNav } from "@/components/team/team-nav"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { SidebarProvider } from "@/components/ui/sidebar"

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
    serial_number: "",
    warranty_info: "",
    purchase_date: "",
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
      const response = await fetch("/api/catalog/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (response.ok) {
        toast.success(`Product created successfully with ID: ${data.product.product_id}`)
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
    return <div>Loading...</div>
  }

  if (!user) {
    return null
  }

  return (
    <SidebarProvider>
      <div className="flex h-screen bg-background">
        <TeamNav user={user} onLogout={handleLogout} />
        <main className="flex-1 overflow-auto">
          <div className="p-8">
            <div className="flex items-center gap-4 mb-8">
              <Button variant="ghost" asChild>
                <Link href="/team/products">
                  <ArrowLeft size={20} />
                </Link>
              </Button>
              <h1 className="text-3xl font-bold">Add New Product</h1>
            </div>

            <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Product Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
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
                      <Label htmlFor="serial_number">Serial Number</Label>
                      <Input
                        id="serial_number"
                        value={formData.serial_number}
                        onChange={(e) => setFormData({ ...formData, serial_number: e.target.value })}
                        placeholder="Enter serial number"
                      />
                    </div>
                    <div className="col-span-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Enter product description"
                        rows={3}
                      />
                    </div>
                    <div>
                      <Label htmlFor="warranty_info">Warranty Information</Label>
                      <Input
                        id="warranty_info"
                        value={formData.warranty_info}
                        onChange={(e) => setFormData({ ...formData, warranty_info: e.target.value })}
                        placeholder="e.g., 2 years manufacturer warranty"
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
                  </div>
                </CardContent>
              </Card>

              <div className="flex gap-4">
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
      </div>
    </SidebarProvider>
  )
}
