"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Plus, 
  Users, 
  Ticket, 
  Package, 
  TrendingUp, 
  ArrowUpRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  Activity
} from "lucide-react"
import { TeamNav } from "@/components/team/team-nav"
import { CustomersList } from "@/components/team/customers-list"
import { TicketsList } from "@/components/team/tickets-list"
import { ActivityLog } from "@/components/team/activity-log"
import { useNotifications } from "@/hooks/use-notifications"
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"

interface StatCardProps {
  title: string
  value: number | string
  description?: string
  icon: React.ElementType
  trend?: { value: number; positive: boolean }
  className?: string
  iconClassName?: string
}

function StatCard({ title, value, description, icon: Icon, trend, className, iconClassName }: StatCardProps) {
  return (
    <Card className={cn("card-hover", className)}>
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
        {trend && (
          <div className={cn(
            "flex items-center gap-1 mt-2 text-xs font-medium",
            trend.positive ? "text-success" : "text-destructive"
          )}>
            <TrendingUp className={cn("h-3 w-3", !trend.positive && "rotate-180")} />
            <span>{trend.positive ? "+" : "-"}{Math.abs(trend.value)}%</span>
            <span className="text-muted-foreground font-normal">from last week</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default function TeamDashboard() {
  const router = useRouter()
  const { notify } = useNotifications()
  const [user, setUser] = useState<any>(null)
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const sessionResponse = await fetch("/api/auth/session", {
          credentials: "include",
        })

        if (!sessionResponse.ok) {
          router.push("/team/login")
          return
        }

        const sessionData = await sessionResponse.json()

        if (!sessionData.session || sessionData.type !== "team") {
          router.push("/team/login")
          return
        }

        setUser(sessionData.session)

        const statsResponse = await fetch("/api/team/stats", {
          credentials: "include",
        })

        if (statsResponse.ok) {
          const statsData = await statsResponse.json()
          setStats(statsData)
        }
      } catch (error) {
        console.error("[v0] Session fetch error:", error)
        router.push("/team/login")
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
        body: JSON.stringify({ type: "team" }),
      })
      notify("success", "Logged out successfully")
      router.push("/team/login")
    } catch (error) {
      console.error("[v0] Logout error:", error)
      router.push("/team/login")
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

  if (!user) {
    return null
  }

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full bg-background">
        <TeamNav user={user} onLogout={handleLogout} />
        <SidebarInset className="flex-1 flex flex-col">
          {/* Mobile Header */}
          <header className="sticky top-0 z-10 flex items-center gap-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 py-3 md:hidden">
            <SidebarTrigger />
            <h1 className="text-lg font-semibold">Dashboard</h1>
          </header>
          
          {/* Main Content */}
          <main className="flex-1 overflow-auto">
            <div className="container max-w-7xl mx-auto px-4 py-6 md:px-8 md:py-8">
              {/* Page Header */}
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8">
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                    Welcome back, {user?.fullName?.split(" ")[0] || user?.full_name?.split(" ")[0]}
                  </h1>
                  <p className="text-muted-foreground mt-1">
                    Here&apos;s what&apos;s happening with your support tickets today.
                  </p>
                </div>
                {["super_admin", "admin", "manager"].includes(user?.role) && (
                  <div className="flex gap-2">
                    <Button asChild variant="outline" className="gap-2">
                      <Link href="/team/customers/create">
                        <Users className="h-4 w-4" />
                        Add Customer
                      </Link>
                    </Button>
                    <Button asChild className="gap-2">
                      <Link href="/team/users/create">
                        <Plus className="h-4 w-4" />
                        Add Team Member
                      </Link>
                    </Button>
                  </div>
                )}
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <StatCard
                  title="Total Customers"
                  value={stats?.totalCustomers || 0}
                  description="Active customer accounts"
                  icon={Users}
                  iconClassName="bg-chart-1/10 text-chart-1"
                />
                <StatCard
                  title="Open Tickets"
                  value={stats?.openTickets || 0}
                  description="Awaiting response"
                  icon={AlertCircle}
                  iconClassName="bg-warning/10 text-warning"
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
                  description="Completed this month"
                  icon={CheckCircle2}
                  iconClassName="bg-success/10 text-success"
                />
              </div>

              {/* Tabs Content */}
              <Tabs defaultValue="overview" className="space-y-6">
                <TabsList className="inline-flex h-10 items-center justify-start rounded-lg bg-muted p-1 text-muted-foreground">
                  <TabsTrigger 
                    value="overview"
                    className="rounded-md px-3 py-1.5 text-sm font-medium transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
                  >
                    Overview
                  </TabsTrigger>
                  <TabsTrigger 
                    value="customers"
                    className="rounded-md px-3 py-1.5 text-sm font-medium transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
                  >
                    Customers
                  </TabsTrigger>
                  <TabsTrigger 
                    value="tickets"
                    className="rounded-md px-3 py-1.5 text-sm font-medium transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
                  >
                    Tickets
                  </TabsTrigger>
                  <TabsTrigger 
                    value="activity"
                    className="rounded-md px-3 py-1.5 text-sm font-medium transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
                  >
                    Activity
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-6">
                  {/* Quick Actions */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="card-hover">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base font-semibold">Recent Tickets</CardTitle>
                          <Link href="/team/tickets" className="text-xs text-primary hover:underline flex items-center gap-1">
                            View all <ArrowUpRight className="h-3 w-3" />
                          </Link>
                        </div>
                        <CardDescription>Latest support requests</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between py-2 border-b border-dashed last:border-0">
                            <div className="flex items-center gap-3">
                              <div className="h-2 w-2 rounded-full bg-warning" />
                              <span className="text-sm">TKT-001234</span>
                            </div>
                            <Badge variant="outline" className="status-open">Open</Badge>
                          </div>
                          <div className="flex items-center justify-between py-2 border-b border-dashed last:border-0">
                            <div className="flex items-center gap-3">
                              <div className="h-2 w-2 rounded-full bg-primary" />
                              <span className="text-sm">TKT-001233</span>
                            </div>
                            <Badge variant="outline" className="status-in-progress">In Progress</Badge>
                          </div>
                          <div className="flex items-center justify-between py-2 border-b border-dashed last:border-0">
                            <div className="flex items-center gap-3">
                              <div className="h-2 w-2 rounded-full bg-success" />
                              <span className="text-sm">TKT-001232</span>
                            </div>
                            <Badge variant="outline" className="status-resolved">Resolved</Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="card-hover">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base font-semibold">Top Customers</CardTitle>
                          <Link href="/team/customers" className="text-xs text-primary hover:underline flex items-center gap-1">
                            View all <ArrowUpRight className="h-3 w-3" />
                          </Link>
                        </div>
                        <CardDescription>Most active this month</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {[1, 2, 3].map((i) => (
                            <div key={i} className="flex items-center justify-between py-2 border-b border-dashed last:border-0">
                              <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                                  <Users className="h-4 w-4 text-muted-foreground" />
                                </div>
                                <span className="text-sm font-medium">Customer {i}</span>
                              </div>
                              <span className="text-xs text-muted-foreground">{10 - i * 2} tickets</span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="card-hover">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base font-semibold">Recent Activity</CardTitle>
                          <Link href="/team/activity-logs" className="text-xs text-primary hover:underline flex items-center gap-1">
                            View all <ArrowUpRight className="h-3 w-3" />
                          </Link>
                        </div>
                        <CardDescription>Latest system events</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {[
                            { action: "Ticket created", time: "2 min ago" },
                            { action: "Customer updated", time: "5 min ago" },
                            { action: "Product assigned", time: "12 min ago" },
                          ].map((item, i) => (
                            <div key={i} className="flex items-center justify-between py-2 border-b border-dashed last:border-0">
                              <div className="flex items-center gap-3">
                                <Activity className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm">{item.action}</span>
                              </div>
                              <span className="text-xs text-muted-foreground">{item.time}</span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="customers">
                  <Card>
                    <CardHeader>
                      <CardTitle>Customer Management</CardTitle>
                      <CardDescription>View and manage all customer accounts</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <CustomersList userRole={user?.role} />
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="tickets">
                  <Card>
                    <CardHeader>
                      <CardTitle>Support Tickets</CardTitle>
                      <CardDescription>Manage and respond to support requests</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <TicketsList />
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="activity">
                  <Card>
                    <CardHeader>
                      <CardTitle>Activity Log</CardTitle>
                      <CardDescription>Track all system activities and changes</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ActivityLog />
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
