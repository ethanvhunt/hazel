"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { TeamNav } from "@/components/team/team-nav"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { ArrowLeft, Plus, FolderPlus } from "lucide-react"
import Link from "next/link"
import { SidebarProvider } from "@/components/ui/sidebar"
import { ROLES } from "@/lib/constants"

export default function CategoriesPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [categories, setCategories] = useState<any[]>([])
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newCategory, setNewCategory] = useState({
    name: "",
    description: "",
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
      toast.error("Failed to load categories")
    }
  }

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!newCategory.name.trim()) {
      toast.error("Category name is required")
      return
    }

    setSubmitting(true)

    try {
      const response = await fetch("/api/catalog/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(newCategory),
      })

      const data = await response.json()

      if (response.ok) {
        toast.success("Category created successfully")
        setNewCategory({ name: "", description: "" })
        setShowCreateForm(false)
        fetchCategories()
      } else {
        toast.error(data.message || "Failed to create category")
      }
    } catch (error) {
      console.error("[v0] Error creating category:", error)
      toast.error("Failed to create category")
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

  const canCreateCategory = user?.role === ROLES.SUPER_ADMIN || user?.role === ROLES.ADMIN

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>
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
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <Button variant="ghost" asChild>
                  <Link href="/team/products">
                    <ArrowLeft size={20} />
                  </Link>
                </Button>
                <h1 className="text-3xl font-bold">Product Categories</h1>
              </div>
              {canCreateCategory && !showCreateForm && (
                <Button onClick={() => setShowCreateForm(true)} className="gap-2">
                  <Plus size={20} />
                  Add Category
                </Button>
              )}
            </div>

            <div className="max-w-4xl space-y-6">
              {/* Create Category Form */}
              {showCreateForm && canCreateCategory && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FolderPlus size={20} />
                      Create New Category
                    </CardTitle>
                    <CardDescription>
                      Add a new product category to organize your inventory
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleCreateCategory} className="space-y-4">
                      <div>
                        <Label htmlFor="name">Category Name *</Label>
                        <Input
                          id="name"
                          placeholder="e.g., Server Equipment"
                          value={newCategory.name}
                          onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                          id="description"
                          placeholder="Brief description of this category..."
                          value={newCategory.description}
                          onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                          rows={2}
                        />
                      </div>
                      <div className="flex gap-4">
                        <Button type="submit" disabled={submitting}>
                          {submitting ? "Creating..." : "Create Category"}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setShowCreateForm(false)
                            setNewCategory({ name: "", description: "" })
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              )}

              {/* Categories List */}
              <Card>
                <CardHeader>
                  <CardTitle>All Categories</CardTitle>
                  <CardDescription>
                    {categories.length} {categories.length === 1 ? "category" : "categories"} available
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {categories.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No categories found. Create your first category to get started.
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Slug</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Created</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {categories.map((category) => (
                          <TableRow key={category.id}>
                            <TableCell className="font-medium">{category.name}</TableCell>
                            <TableCell className="font-mono text-sm text-muted-foreground">
                              {category.slug}
                            </TableCell>
                            <TableCell className="max-w-xs truncate">
                              {category.description || "—"}
                            </TableCell>
                            <TableCell>
                              <Badge variant={category.is_custom ? "default" : "secondary"}>
                                {category.is_custom ? "Custom" : "Default"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {new Date(category.created_at).toLocaleDateString()}
                            </TableCell>
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
