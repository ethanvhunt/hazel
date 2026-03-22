"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { TeamNav } from "@/components/team/team-nav"
import { Badge } from "@/components/ui/badge"
import { Plus } from "lucide-react"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"

export default function UsersPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [users, setUsers] = useState<any[]>([])
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

        // Fetch users
        const usersResponse = await fetch("/api/users", {
          credentials: "include",
        })

        if (usersResponse.ok) {
          const userData = await usersResponse.json()
          setUsers(userData)
        }
      } catch (error) {
        console.error("[v0] Error fetching data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [router])

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" })
    router.push("/team/login")
  }

  const getRoleBadge = (role: string) => {
    const colors: Record<string, string> = {
      super_admin: "bg-red-100 text-red-800",
      admin: "bg-purple-100 text-purple-800",
      manager: "bg-blue-100 text-blue-800",
      agent: "bg-green-100 text-green-800",
    }
    return colors[role] || "bg-gray-100 text-gray-800"
  }

  if (loading) return <div className="flex items-center justify-center h-screen">Loading...</div>
  if (!user) return null

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full">
        <TeamNav user={user} onLogout={handleLogout} />
        <SidebarInset>
          <header className="flex items-center gap-2 border-b p-4 md:hidden">
            <SidebarTrigger />
            <h1 className="text-lg font-semibold">Team Members</h1>
          </header>
          <main className="flex-1 overflow-auto">
            <div className="p-4 md:p-8">
              <div className="flex justify-between items-center mb-8 max-md:flex-col max-md:gap-4">
                <h1 className="text-3xl font-bold hidden md:block">Team Members</h1>
                <Button asChild>
                  <Link href="/team/users/create">
                    <Plus className="mr-2" size={20} />
                    Add User
                  </Link>
                </Button>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Users</CardTitle>
                  <CardDescription>Manage all team members and their roles</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((u) => (
                        <TableRow key={u.id}>
                          <TableCell>{u.full_name}</TableCell>
                          <TableCell>{u.email}</TableCell>
                          <TableCell>
                            <Badge className={getRoleBadge(u.role)}>{u.role.replace("_", " ")}</Badge>
                          </TableCell>
                          <TableCell>{new Date(u.created_at).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <Button variant="outline" size="sm" asChild>
                              <Link href={`/team/users/${u.id}`}>Edit</Link>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}
