"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CustomerNav } from "@/components/customer/customer-nav"
import { ProductsList } from "@/components/customer/products-list"
import { TicketsList } from "@/components/customer/tickets-list"
import { ExcelProductsSection } from "@/components/customer/excel-products-section"
import { useNotifications } from "@/hooks/use-notifications"
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar"
import { 
  Package, 
  Ticket, 
  CheckCircle2, 
  Plus, 
  ArrowUpRight,
  AlertCircle,
  Clock
} from "lucide-react"
import { cn } from "@/lib/utils"

interface StatCardProps {
  title: string
  value: number | string
  description?: string
  icon: React.ElementType
  iconClassName?: string
  href?: string
}

function StatCard({ title, value, description, icon: Icon, iconClassName, href }: StatCardProps) {
  const content = (
    <Card className={cn("card-hover", href && "cursor-pointer")}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className={cn("flex h-9 w-9 items-center justify-center rounded-lg", iconClassName || "bg-muted")}>
          <Icon className="h-4 w-4" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold tracking-tight">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
        {href && (
          <div className="flex items-center gap-1 mt-2 text-xs text-primary">
            <span>View all</span>
            <ArrowUpRight className="h-3 w-3" />
          </div>
        )}
      </CardContent>
    </Card>
  )

  if (href) {
    return <Link href={href}>{content}</Link>
  }
  return content
}

export default function CustomerDashboard() {
  const router = useRouter()
  const { notify } = useNotifications()
  const [customer, setCustomer] = useState<any>(null)
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const sessionResponse = await fetch("/api/auth/session", {
          credentials: "include",
        })

        if (!sessionResponse.ok) {
          router.push("/customer/login")
          return
        }

        const sessionData = await sessionResponse.json()

        if (!sessionData.session || sessionData.type !== "customer") {
          router.push("/customer/login")
          return
        }

        setCustomer(sessionData.session)

        const statsResponse = await fetch(`/api/customer/stats/${sessionData.session.customerId}`, {
          credentials: "include",
        })

        if (statsResponse.ok) {
          const statsData = await statsResponse.json()
          setStats(statsData)
        }
      } catch (error) {
        console.error("[v0] Session fetch error:", error)
        router.push("/customer/login")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [router])

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "customer" }),
      })
      notify("Logged out", "You have been logged out successfully")
      router.push("/customer/login")
    } catch (error) {
      console.error("[v0] Logout error:", error)
      router.push("/customer/login")
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (!customer) {
    return null
  }

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full bg-background">
        <CustomerNav customer={customer} onLogout={handleLogout} />
        <SidebarInset className="flex-1 flex flex-col">
          {/* Mobile Header */}
          <header className="sticky top-0 z-10 flex items-center gap-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 py-3 md:hidden">
            <SidebarTrigger />
            <h1 className="text-lg font-semibold">Dashboard</h1>
          </header>
          
          <main className="flex-1 overflow-auto">
            <div className="container max-w-7xl mx-auto px-4 py-6 md:px-8 md:py-8">
              {/* Page Header */}
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8">
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                    Welcome back, {customer?.fullName?.split(" ")[0] || customer?.full_name?.split(" ")[0]}
                  </h1>
                  <p className="text-muted-foreground mt-1">
                    Manage your products and support tickets
                  </p>
                </div>
                <Button asChild className="gap-2">
                  <Link href="/customer/tickets/create">
                    <Plus className="h-4 w-4" />
                    New Ticket
                  </Link>
                </Button>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <StatCard
                  title="Your Products"
                  value={stats?.totalProducts || 0}
                  description="Assigned to your account"
                  icon={Package}
                  iconClassName="bg-chart-1/10 text-chart-1"
                  href="/customer/products"
                />
                <StatCard
                  title="Open Tickets"
                  value={stats?.openTickets || 0}
                  description="Awaiting response"
                  icon={AlertCircle}
                  iconClassName="bg-warning/10 text-warning"
                  href="/customer/tickets"
                />
                <StatCard
                  title="In Progress"
                  value={stats?.inProgressTickets || 0}
                  description="Being worked on"
                  icon={Clock}
                  iconClassName="bg-chart-1/10 text-chart-1"
                />
                <StatCard
                  title="Resolved"
                  value={stats?.resolvedTickets || 0}
                  description="Completed tickets"
                  icon={CheckCircle2}
                  iconClassName="bg-success/10 text-success"
                />
              </div>

              {/* Tabs */}
              <Tabs defaultValue="overview" className="space-y-6">
                <TabsList className="inline-flex h-10 items-center justify-start rounded-lg bg-muted p-1 text-muted-foreground">
                  <TabsTrigger 
                    value="overview"
                    className="rounded-md px-3 py-1.5 text-sm font-medium transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
                  >
                    Overview
                  </TabsTrigger>
                  <TabsTrigger 
                    value="products"
                    className="rounded-md px-3 py-1.5 text-sm font-medium transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
                  >
                    Products
                  </TabsTrigger>
                  <TabsTrigger 
                    value="tickets"
                    className="rounded-md px-3 py-1.5 text-sm font-medium transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
                  >
                    Tickets
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-6">
                  {/* Quick Actions */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card className="card-hover">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base font-semibold">Recent Tickets</CardTitle>
                          <Link href="/customer/tickets" className="text-xs text-primary hover:underline flex items-center gap-1">
                            View all <ArrowUpRight className="h-3 w-3" />
                          </Link>
                        </div>
                        <CardDescription>Your latest support requests</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between py-2 border-b border-dashed last:border-0">
                            <div className="flex items-center gap-3">
                              <div className="h-2 w-2 rounded-full bg-warning" />
                              <span className="text-sm">No recent tickets</span>
                            </div>
                          </div>
                        </div>
                        <Button asChild variant="outline" className="w-full mt-4 gap-2">
                          <Link href="/customer/tickets/create">
                            <Plus className="h-4 w-4" />
                            Create New Ticket
                          </Link>
                        </Button>
                      </CardContent>
                    </Card>

                    <Card className="card-hover">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base font-semibold">Your Products</CardTitle>
                          <Link href="/customer/products" className="text-xs text-primary hover:underline flex items-center gap-1">
                            View all <ArrowUpRight className="h-3 w-3" />
                          </Link>
                        </div>
                        <CardDescription>Products assigned to your account</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between py-2 border-b border-dashed last:border-0">
                            <div className="flex items-center gap-3">
                              <Package className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">{stats?.totalProducts || 0} products assigned</span>
                            </div>
                          </div>
                        </div>
                        <Button asChild variant="outline" className="w-full mt-4 gap-2">
                          <Link href="/customer/products">
                            <Package className="h-4 w-4" />
                            Browse Products
                          </Link>
                        </Button>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Excel Products Section */}
                  <ExcelProductsSection customerId={customer?.customerId} />
                </TabsContent>

                <TabsContent value="products">
                  <Card>
                    <CardHeader>
                      <CardTitle>Your Products</CardTitle>
                      <CardDescription>Products assigned to your account</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ProductsList customerId={customer?.customerId} />
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="tickets">
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle>Support Tickets</CardTitle>
                          <CardDescription>View and manage your support requests</CardDescription>
                        </div>
                        <Button asChild className="gap-2">
                          <Link href="/customer/tickets/create">
                            <Plus className="h-4 w-4" />
                            New Ticket
                          </Link>
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <TicketsList customerId={customer?.customerId} userRole={customer?.role} />
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}
