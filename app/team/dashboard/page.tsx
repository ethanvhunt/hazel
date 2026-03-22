"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { TeamNav } from "@/components/team/team-nav"
import { CustomersList } from "@/components/team/customers-list"
import { TicketsList } from "@/components/team/tickets-list"
import { ActivityLog } from "@/components/team/activity-log"
import { useNotifications } from "@/hooks/use-notifications"
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar"

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
    return <div className="flex items-center justify-center h-screen">Loading...</div>
  }

  if (!user) {
    return null
  }

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full">
        <TeamNav user={user} onLogout={handleLogout} />
        <SidebarInset>
          <header className="flex items-center gap-2 border-b p-4 md:hidden">
            <SidebarTrigger />
            <h1 className="text-lg font-semibold">Team Dashboard</h1>
          </header>
          <main className="flex-1 overflow-auto">
            <div className="p-4 md:p-8">
              <div className="flex justify-between items-center mb-8 max-md:flex-col max-md:gap-4">
                <h1 className="text-3xl font-bold hidden md:block">Team Dashboard</h1>
                {["super_admin", "admin", "manager"].includes(user?.role) && (
                  <Button asChild>
                    <Link href="/team/users/create">
                      <Plus className="mr-2" size={20} />
                      Add Team Member
                    </Link>
                  </Button>
                )}
              </div>

              <Tabs defaultValue="overview" className="space-y-4">
                <TabsList className="grid w-full grid-cols-2 md:w-auto">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="customers">Customers</TabsTrigger>
                  <TabsTrigger value="tickets" className="hidden md:block">
                    Tickets
                  </TabsTrigger>
                  <TabsTrigger value="activity" className="hidden md:block">
                    Activity
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{stats?.totalCustomers || 0}</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Open Tickets</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{stats?.openTickets || 0}</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">In Progress</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{stats?.inProgressTickets || 0}</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Resolved</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{stats?.resolvedTickets || 0}</div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="customers">
                  <CustomersList userRole={user?.role} />
                </TabsContent>

                <TabsContent value="tickets">
                  <TicketsList />
                </TabsContent>

                <TabsContent value="activity">
                  <ActivityLog />
                </TabsContent>
              </Tabs>
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}
