"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { TeamNav } from "@/components/team/team-nav"
import { TicketsView } from "@/components/team/tickets-view"
import { toast } from "sonner"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"

export default function TicketsPage() {
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
            <h1 className="text-lg font-semibold">Tickets</h1>
          </header>
          <main className="flex-1 overflow-auto">
            <div className="p-4 md:p-8">
              <h1 className="text-3xl font-bold mb-8 hidden md:block">Manage Tickets</h1>
              <TicketsView userRole={user?.role} userId={user?.userId} />
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}
