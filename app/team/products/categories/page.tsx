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
import { ArrowLeft, Plus, FolderPlus, Search, Filter, FolderTree, Database } from "lucide-react"
import Link from "next/link"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { ROLES } from "@/lib/constants"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function CategoriesPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [categories, setCategories] = useState<any[]>([])
  const [filteredCategories, setFilteredCategories] = useState<any[]>([])
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")
  const [seeding, setSeeding] = useState(false)
  const [newCategory, setNewCategory] = useState({
    name: "",
    description: "",
  })

  useEffect(() => {
    fetchSession()
    fetchCategories()
  }, [])

  useEffect(() => {
    filterCategories()
  }, [searchQuery, typeFilter, categories])

  const filterCategories = () => {
    let filtered = [...categories]

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (cat) =>
          cat.name?.toLowerCase().includes(query) ||
          cat.slug?.toLowerCase().includes(query) ||
          cat.description?.toLowerCase().includes(query)
      )
    }

    if (typeFilter !== "all") {
      filtered = filtered.filter((cat) =>
        typeFilter === "custom" ? cat.is_custom : !cat.is_custom
      )
    }

    setFilteredCategories(filtered)
  }

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
        setFilteredCategories(data)
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

  const handleSeedCategories = async () => {
    setSeeding(true)
    try {
      const response = await fetch("/api/catalog/categories/seed", {
        method: "POST",
        credentials: "include",
      })
      const data = await response.json()
      
      if (response.ok) {
        if (data.created.length > 0) {
          toast.success(`Created ${data.created.length} default categories`)
        } else {
          toast.info("All default categories already exist")
        }
        fetchCategories()
      } else {
        toast.error(data.message || "Failed to seed categories")
      }
    } catch (error) {
      console.error("[v0] Error seeding categories:", error)
      toast.error("Failed to seed categories")
    } finally {
      setSeeding(false)
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

  const clearFilters = () => {
    setSearchQuery("")
    setTypeFilter("all")
  }

  const canCreateCategory = user?.role === ROLES.SUPER_ADMIN || user?.role === ROLES.ADMIN

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
            <FolderTree className="h-5 w-5 text-primary" />
            <h1 className="text-lg font-semibold">Categories</h1>
          </header>
          
          <main className="flex-1 overflow-auto">
            <div className="w-full px-4 py-6 md:px-8 md:py-8">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div className="flex items-center gap-4">
                  <Button variant="ghost" size="icon" asChild className="hidden md:flex">
                    <Link href="/team/products">
                      <ArrowLeft size={20} />
                    </Link>
                  </Button>
                  <div className="flex items-center gap-3">
                    <div className="hidden md:flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <FolderTree className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h1 className="text-2xl md:text-3xl font-bold">Product Categories</h1>
                      <p className="text-muted-foreground">Manage your product categories</p>
                    </div>
                  </div>
                </div>
                {canCreateCategory && (
                  <div className="flex gap-2">
                    {!showCreateForm && (
                      <>
                        <Button variant="outline" onClick={handleSeedCategories} disabled={seeding} className="gap-2">
                          <Database size={18} />
                          {seeding ? "Seeding..." : "Seed Defaults"}
                        </Button>
                        <Button onClick={() => setShowCreateForm(true)} className="gap-2">
                          <Plus size={20} />
                          Add Category
                        </Button>
                      </>
                    )}
                  </div>
                )}
              </div>

              <div className="w-full space-y-6">
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
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                            <Input
                              id="description"
                              placeholder="Brief description of this category..."
                              value={newCategory.description}
                              onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                            />
                          </div>
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

                {/* Filters */}
                <Card>
                  <CardHeader>
                    <CardTitle>All Categories</CardTitle>
                    <CardDescription>
                      {filteredCategories.length} of {categories.length} categories
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                      <div className="relative flex-1 w-full sm:max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search categories..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-9"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <Filter className="h-4 w-4 text-muted-foreground" />
                        <Select value={typeFilter} onValueChange={setTypeFilter}>
                          <SelectTrigger className="w-40">
                            <SelectValue placeholder="All Types" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Types</SelectItem>
                            <SelectItem value="default">Default</SelectItem>
                            <SelectItem value="custom">Custom</SelectItem>
                          </SelectContent>
                        </Select>
                        {(searchQuery || typeFilter !== "all") && (
                          <Button variant="outline" size="sm" onClick={clearFilters}>
                            Clear
                          </Button>
                        )}
                      </div>
                    </div>

                    {filteredCategories.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        {categories.length === 0
                          ? "No categories found. Create your first category to get started."
                          : "No categories match your search criteria."}
                      </div>
                    ) : (
                      <div className="rounded-lg border overflow-hidden">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-muted/50 hover:bg-muted/50">
                              <TableHead className="font-semibold">Name</TableHead>
                              <TableHead className="font-semibold">Slug</TableHead>
                              <TableHead className="font-semibold hidden md:table-cell">Description</TableHead>
                              <TableHead className="font-semibold">Type</TableHead>
                              <TableHead className="font-semibold hidden sm:table-cell">Created</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredCategories.map((category) => (
                              <TableRow key={category.id} className="table-row-hover">
                                <TableCell className="font-medium">{category.name}</TableCell>
                                <TableCell className="font-mono text-sm text-muted-foreground">
                                  {category.slug}
                                </TableCell>
                                <TableCell className="max-w-xs truncate hidden md:table-cell">
                                  {category.description || "—"}
                                </TableCell>
                                <TableCell>
                                  <Badge variant={category.is_custom ? "default" : "secondary"}>
                                    {category.is_custom ? "Custom" : "Default"}
                                  </Badge>
                                </TableCell>
                                <TableCell className="hidden sm:table-cell">
                                  {new Date(category.created_at).toLocaleDateString()}
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
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}
