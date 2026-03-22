"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { TeamNav } from "@/components/team/team-nav"
import { ProductsCatalog } from "@/components/team/products-catalog"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { Package, Plus, FolderTree, Tag, ArrowUpRight } from "lucide-react"

export default function ProductsPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
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

        // Only managers and above can access
        if (!["super_admin", "admin", "manager"].includes(data.session.role)) {
          router.push("/team/dashboard")
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

    fetchSession()
  }, [router])

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
          <p className="text-sm text-muted-foreground">Loading products...</p>
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
          {/* Mobile Header */}
          <header className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 py-3 md:hidden">
            <div className="flex items-center gap-2">
              <SidebarTrigger />
              <Package className="h-5 w-5 text-primary" />
              <h1 className="text-lg font-semibold">Products</h1>
            </div>
            <Button size="sm" onClick={() => router.push("/team/products/create")}>
              <Plus className="h-4 w-4" />
            </Button>
          </header>
          
          <main className="flex-1 overflow-auto">
            <div className="container max-w-7xl mx-auto px-4 py-6 md:px-8 md:py-8">
              {/* Page Header */}
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
                <div className="flex items-center gap-3">
                  <div className="hidden md:flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Package className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                      Product Catalog
                    </h1>
                    <p className="text-muted-foreground">
                      Manage your product inventory and assignments
                    </p>
                  </div>
                </div>
                <div className="hidden md:flex items-center gap-2">
                  <Button variant="outline" asChild className="gap-2">
                    <Link href="/team/products/categories">
                      <FolderTree className="h-4 w-4" />
                      Categories
                    </Link>
                  </Button>
                  <Button onClick={() => router.push("/team/products/create")} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Add Product
                  </Button>
                </div>
              </div>

              {/* Quick Links */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <Card className="card-hover cursor-pointer" onClick={() => router.push("/team/products/create")}>
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Plus className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">Add Product</p>
                          <p className="text-xs text-muted-foreground">Create new product</p>
                        </div>
                      </div>
                      <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
                <Card className="card-hover cursor-pointer" onClick={() => router.push("/team/products/categories")}>
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-lg bg-chart-2/10 flex items-center justify-center">
                          <FolderTree className="h-4 w-4 text-chart-2" />
                        </div>
                        <div>
                          <p className="font-medium">Categories</p>
                          <p className="text-xs text-muted-foreground">Manage categories</p>
                        </div>
                      </div>
                      <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
                <Card className="card-hover cursor-pointer" onClick={() => router.push("/team/product-requests")}>
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-lg bg-warning/10 flex items-center justify-center">
                          <Tag className="h-4 w-4 text-warning" />
                        </div>
                        <div>
                          <p className="font-medium">Requests</p>
                          <p className="text-xs text-muted-foreground">View product requests</p>
                        </div>
                      </div>
                      <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Products Content */}
              <Card>
                <CardHeader>
                  <CardTitle>All Products</CardTitle>
                  <CardDescription>
                    Browse and manage your complete product inventory
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ProductsCatalog userRole={user?.role} />
                </CardContent>
              </Card>
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}
