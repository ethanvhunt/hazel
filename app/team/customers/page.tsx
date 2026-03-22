"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { TeamNav } from "@/components/team/team-nav"
import { CustomersList } from "@/components/team/customers-list"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"

export default function CustomersPage() {
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
    return <div>Loading...</div>
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
            <h1 className="text-lg font-semibold">Customers</h1>
          </header>
          <main className="flex-1 overflow-auto">
            <div className="p-4 md:p-8">
              <div className="flex justify-between items-center mb-8 max-md:flex-col max-md:gap-4">
                <h1 className="text-3xl font-bold hidden md:block">Manage Customers</h1>
                <Button onClick={() => router.push("/team/customers/create")}>Create Customer</Button>
              </div>
              <CustomersList userRole={user?.role} />
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}
