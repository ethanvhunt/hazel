"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { TeamNav } from "@/components/team/team-nav"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"

export default function ActivityLogsPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState("all")

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

        // Fetch activity logs
        const logsResponse = await fetch("/api/activity-logs", {
          credentials: "include",
        })

        if (logsResponse.ok) {
          const logsData = await logsResponse.json()
          setLogs(logsData)
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

  const getActionBadgeColor = (action: string) => {
    const colors: Record<string, string> = {
      create: "bg-green-100 text-green-800",
      update: "bg-blue-100 text-blue-800",
      delete: "bg-red-100 text-red-800",
      assign: "bg-purple-100 text-purple-800",
    }
    return colors[action] || "bg-gray-100 text-gray-800"
  }

  const filteredLogs = filter === "all" ? logs : logs.filter((log) => log.action === filter)

  if (loading) return <div className="flex items-center justify-center h-screen">Loading...</div>
  if (!user) return null

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full">
        <TeamNav user={user} onLogout={handleLogout} />
        <SidebarInset>
          <header className="flex items-center gap-2 border-b p-4 md:hidden">
            <SidebarTrigger />
            <h1 className="text-lg font-semibold">Activity Logs</h1>
          </header>
          <main className="flex-1 overflow-auto">
            <div className="p-4 md:p-8">
              <h1 className="text-3xl font-bold mb-8 hidden md:block">Activity Logs</h1>

              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center max-md:flex-col max-md:gap-4">
                    <div>
                      <CardTitle>System Activity</CardTitle>
                      <CardDescription>View all system activities and changes</CardDescription>
                    </div>
                    <Select value={filter} onValueChange={setFilter}>
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Actions</SelectItem>
                        <SelectItem value="create">Create</SelectItem>
                        <SelectItem value="update">Update</SelectItem>
                        <SelectItem value="delete">Delete</SelectItem>
                        <SelectItem value="assign">Assign</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date & Time</TableHead>
                        <TableHead>Action</TableHead>
                        <TableHead>Entity Type</TableHead>
                        <TableHead>Performed By</TableHead>
                        <TableHead>Details</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredLogs.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                            No activity logs found
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredLogs.map((log) => (
                          <TableRow key={log.id}>
                            <TableCell>{new Date(log.created_at).toLocaleString()}</TableCell>
                            <TableCell>
                              <Badge className={getActionBadgeColor(log.action)}>
                                {log.action.charAt(0).toUpperCase() + log.action.slice(1)}
                              </Badge>
                            </TableCell>
                            <TableCell className="capitalize">{log.entity_type}</TableCell>
                            <TableCell>{log.performed_by_name || "System"}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {log.old_values && JSON.stringify(log.old_values).substring(0, 50)}...
                            </TableCell>
                          </TableRow>
                        ))
                      )}
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
