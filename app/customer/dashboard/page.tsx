"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CustomerNav } from "@/components/customer/customer-nav"
import { ProductsList } from "@/components/customer/products-list"
import { TicketsList } from "@/components/customer/tickets-list"
import { ExcelProductsSection } from "@/components/customer/excel-products-section"
import { useNotifications } from "@/hooks/use-notifications"
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar"

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
    return <div className="flex items-center justify-center h-screen">Loading...</div>
  }

  if (!customer) {
    return null
  }

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full">
        <CustomerNav customer={customer} onLogout={handleLogout} />
        <SidebarInset>
          <header className="flex items-center gap-2 border-b p-4 md:hidden">
            <SidebarTrigger />
            <h1 className="text-lg font-semibold">Customer Dashboard</h1>
          </header>
          <main className="flex-1 overflow-auto">
            <div className="p-4 md:p-8">
              <h1 className="text-3xl font-bold mb-8 hidden md:block">Customer Dashboard</h1>

              <Tabs defaultValue="overview" className="space-y-4">
                <TabsList className="grid w-full grid-cols-2 md:w-auto">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="products">Products</TabsTrigger>
                  <TabsTrigger value="tickets" className="hidden md:block">
                    Tickets
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Your Products</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{stats?.totalProducts || 0}</div>
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
                        <CardTitle className="text-sm font-medium">Resolved</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{stats?.resolvedTickets || 0}</div>
                      </CardContent>
                    </Card>
                  </div>
                  <ExcelProductsSection customerId={customer?.customerId} />
                </TabsContent>

                <TabsContent value="products">
                  <ProductsList customerId={customer?.customerId} />
                </TabsContent>

                <TabsContent value="tickets">
                  <TicketsList customerId={customer?.customerId} userRole={customer?.role} />
                </TabsContent>
              </Tabs>
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}
