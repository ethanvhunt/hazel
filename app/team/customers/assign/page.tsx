"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { TeamNav } from "@/components/team/team-nav"
import { toast } from "sonner"
import { ArrowLeft, Users } from "lucide-react"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"

export default function AssignCustomerPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [customers, setCustomers] = useState<any[]>([])
  const [assignableUsers, setAssignableUsers] = useState<any[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState("")
  const [selectedAgent, setSelectedAgent] = useState("")
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const loadData = async () => {
      try {
        const sessionResponse = await fetch("/api/auth/session", {
          credentials: "include",
        })

        if (!sessionResponse.ok) {
          router.push("/team/login")
          return
        }

        const sessionData = await sessionResponse.json()
        if (sessionData.type !== "team") {
          router.push("/team/login")
          return
        }

        setUser(sessionData.session)

        // Fetch customers
        const customersResponse = await fetch("/api/customers", {
          credentials: "include",
        })
        if (customersResponse.ok) {
          const customersData = await customersResponse.json()
          setCustomers(customersData)
        }

        // Fetch assignable users
        let usersUrl = "/api/users"
        if (sessionData.session.role === "manager") {
          usersUrl = "/api/users?role=agent"
        }

        const usersResponse = await fetch(usersUrl, {
          credentials: "include",
        })
        if (usersResponse.ok) {
          const usersData = await usersResponse.json()
          let filtered = usersData
          if (sessionData.session.role === "manager") {
            filtered = usersData.filter((u: any) => u.role === "agent")
          } else if (sessionData.session.role === "admin") {
            filtered = usersData.filter((u: any) => ["manager", "agent"].includes(u.role))
          }
          setAssignableUsers(filtered)
        }
      } catch (error) {
        console.error("[v0] Load error:", error)
        router.push("/team/login")
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [router])

  const handleLogout = async () => {
    await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "team" }),
    })
    router.push("/team/login")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedCustomer || !selectedAgent) {
      toast.error("Please select both customer and team member")
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch("/api/assignment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          customerId: selectedCustomer,
          agentId: selectedAgent,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        toast.success("Customer assigned successfully")
        router.push("/team/customers")
      } else {
        toast.error(data.message || "Failed to assign customer")
      }
    } catch (error) {
      console.error("[v0] Assign error:", error)
      toast.error("An error occurred")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>
  }

  if (!["super_admin", "admin", "manager"].includes(user?.role)) {
    router.push("/team/customers")
    return null
  }

  return (
    <SidebarProvider>
      <div className="flex h-screen bg-background w-full">
        <TeamNav user={user} onLogout={handleLogout} />
        <SidebarInset>
          <header className="flex items-center gap-2 border-b p-4 md:hidden">
            <SidebarTrigger />
            <h1 className="text-lg font-semibold">Assign Customer</h1>
          </header>
          <main className="flex-1 overflow-auto">
            <div className="p-4 md:p-8 w-full">
              <div className="flex items-center gap-4 mb-8">
                <Button variant="ghost" size="icon" asChild>
                  <Link href="/team/customers">
                    <ArrowLeft size={20} />
                  </Link>
                </Button>
                <h1 className="text-2xl md:text-3xl font-bold">Assign Customer to Team Member</h1>
              </div>

              <Card className="max-w-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users size={20} />
                    Customer Assignment
                  </CardTitle>
                  <CardDescription>
                    Assign a customer to a team member for support and management
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="customer">
                        Customer <span className="text-destructive">*</span>
                      </Label>
                      <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
                        <SelectTrigger id="customer">
                          <SelectValue placeholder="Select customer" />
                        </SelectTrigger>
                        <SelectContent>
                          {customers.map((c) => (
                            <SelectItem key={c.id} value={c.id}>
                              {c.company_name}
                              {c.assigned_to && (
                                <span className="text-muted-foreground ml-2">
                                  (Currently: {c.assigned_to})
                                </span>
                              )}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="agent">
                        {user?.role === "manager" ? "Agent" : "Team Member"}{" "}
                        <span className="text-destructive">*</span>
                      </Label>
                      <Select value={selectedAgent} onValueChange={setSelectedAgent}>
                        <SelectTrigger id="agent">
                          <SelectValue placeholder={user?.role === "manager" ? "Select agent" : "Select team member"} />
                        </SelectTrigger>
                        <SelectContent>
                          {assignableUsers.map((u) => (
                            <SelectItem key={u.id} value={u.id}>
                              {u.full_name} ({u.role})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex gap-4 pt-4">
                      <Button type="submit" disabled={submitting} className="flex-1">
                        {submitting ? "Assigning..." : "Assign Customer"}
                      </Button>
                      <Button variant="outline" asChild className="flex-1">
                        <Link href="/team/customers">Cancel</Link>
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}
