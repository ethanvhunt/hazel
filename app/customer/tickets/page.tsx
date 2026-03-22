"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { CustomerNav } from "@/components/customer/customer-nav"
import { CustomerTicketsView } from "@/components/customer/customer-tickets-view"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { toast } from "sonner"

export default function TicketsPage() {
  const router = useRouter()
  const [customer, setCustomer] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const response = await fetch("/api/auth/session", {
          credentials: "include",
        })

        if (!response.ok) {
          router.push("/customer/login")
          return
        }

        const data = await response.json()

        if (data.type !== "customer") {
          router.push("/customer/login")
          return
        }

        setCustomer(data.session)
      } catch (error) {
        console.error("[v0] Session error:", error)
        router.push("/customer/login")
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
    router.push("/customer/login")
  }

  if (loading) {
    return <div>Loading...</div>
  }

  if (!customer) {
    return null
  }

  return (
    <SidebarProvider>
      <div className="flex h-screen bg-background w-full">
        <CustomerNav customer={customer} onLogout={handleLogout} />
        <SidebarInset>
          <header className="flex items-center gap-2 border-b p-4 md:hidden">
            <SidebarTrigger />
            <h1 className="text-lg font-semibold">My Tickets</h1>
          </header>
          <main className="flex-1 overflow-auto">
            <div className="p-8">
              <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold hidden md:block">My Tickets</h1>
                <Button asChild>
                  <Link href="/customer/tickets/create">
                    <Plus className="mr-2" size={20} />
                    Create Ticket
                  </Link>
                </Button>
              </div>
              <CustomerTicketsView customerId={customer?.customerId} userRole={customer?.role} />
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}
