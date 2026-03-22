'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { TeamNav } from '@/components/team/team-nav'
import { SidebarProvider, SidebarTrigger, SidebarInset } from '@/components/ui/sidebar'
import { Users, BarChart3, TrendingUp, Clock } from 'lucide-react'

interface AgentMetric {
  id: string
  full_name: string
  email: string
  gmail_address: string
  role: string
  total_tickets: number
  open_tickets: number
  in_progress_tickets: number
  resolved_tickets: number
  total_clients: number
  total_excel_uploads: number
  avg_response_time_hours: number
}

interface AgentClientDetail {
  agent_id: string
  agent_name: string
  customer_id: string
  company_name: string
  contact_person: string
  customer_email: string
  tickets_count: number
  resolved_count: number
  in_progress_count: number
  excel_files_count: number
  last_message_time: string | null
}

export default function ReportsPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [agentMetrics, setAgentMetrics] = useState<AgentMetric[]>([])
  const [agentClientDetails, setAgentClientDetails] = useState<AgentClientDetail[]>([])
  const [summary, setSummary] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const sessionResponse = await fetch('/api/auth/session', { credentials: 'include' })
        if (!sessionResponse.ok) {
          router.push('/team/login')
          return
        }

        const sessionData = await sessionResponse.json()
        if (sessionData.type !== 'team' || sessionData.session?.role !== 'super_admin') {
          setError('You do not have permission to access this page')
          router.push('/team/dashboard')
          return
        }

        setUser(sessionData.session)

        const reportResponse = await fetch('/api/reports/agent-performance', { credentials: 'include' })
        if (reportResponse.ok) {
          const data = await reportResponse.json()
          setAgentMetrics(data.agentMetrics)
          setAgentClientDetails(data.agentClientDetails)
          setSummary(data.summary)
        } else {
          setError('Failed to load reports')
        }
      } catch (err) {
        console.error('[v0] Error fetching reports:', err)
        setError('An error occurred while loading reports')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [router])

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'team' }),
      })
      router.push('/team/login')
    } catch (error) {
      console.error('[v0] Logout error:', error)
    }
  }

  if (loading) return <div className="flex items-center justify-center h-screen">Loading...</div>
  if (error) return <div className="flex items-center justify-center h-screen text-red-500">{error}</div>
  if (!user) return null

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full">
        <TeamNav user={user} onLogout={handleLogout} />
        <SidebarInset>
          <header className="flex items-center gap-2 border-b p-4 md:hidden">
            <SidebarTrigger />
            <h1 className="text-lg font-semibold">Detailed Reports</h1>
          </header>
          <main className="flex-1 overflow-auto">
            <div className="p-4 md:p-8">
              <h1 className="text-3xl font-bold mb-8 hidden md:block">Agent Performance Reports</h1>

              {/* Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Users size={16} />
                      Total Agents
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{summary?.totalAgents || 0}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <BarChart3 size={16} />
                      Total Tickets
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{summary?.totalTickets || 0}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <TrendingUp size={16} />
                      Total Clients
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{summary?.totalClients || 0}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Clock size={16} />
                      Avg Response Time
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{summary?.avgResponseTime || 0}h</div>
                  </CardContent>
                </Card>
              </div>

              <Tabs defaultValue="agents" className="space-y-4">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="agents">Agent Performance</TabsTrigger>
                  <TabsTrigger value="client-details">Agent-Client Details</TabsTrigger>
                </TabsList>

                <TabsContent value="agents" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Agent Performance Metrics</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Agent Name</TableHead>
                              <TableHead>Email</TableHead>
                              <TableHead>Gmail</TableHead>
                              <TableHead className="text-center">Total Tickets</TableHead>
                              <TableHead className="text-center">Open</TableHead>
                              <TableHead className="text-center">In Progress</TableHead>
                              <TableHead className="text-center">Resolved</TableHead>
                              <TableHead className="text-center">Clients</TableHead>
                              <TableHead className="text-center">Excel Files</TableHead>
                              <TableHead className="text-center">Avg Response (hrs)</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {agentMetrics.map((agent) => (
                              <TableRow key={agent.id}>
                                <TableCell className="font-medium">{agent.full_name}</TableCell>
                                <TableCell>{agent.email}</TableCell>
                                <TableCell>{agent.gmail_address || 'Not set'}</TableCell>
                                <TableCell className="text-center font-semibold">{agent.total_tickets}</TableCell>
                                <TableCell className="text-center">
                                  <Badge variant="outline">{agent.open_tickets}</Badge>
                                </TableCell>
                                <TableCell className="text-center">
                                  <Badge variant="secondary">{agent.in_progress_tickets}</Badge>
                                </TableCell>
                                <TableCell className="text-center">
                                  <Badge className="bg-green-600">{agent.resolved_tickets}</Badge>
                                </TableCell>
                                <TableCell className="text-center">{agent.total_clients}</TableCell>
                                <TableCell className="text-center">{agent.total_excel_uploads}</TableCell>
                                <TableCell className="text-center font-semibold">{agent.avg_response_time_hours.toFixed(2)}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="client-details" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Agent-Client Assignment & Performance</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Agent Name</TableHead>
                              <TableHead>Client Company</TableHead>
                              <TableHead>Contact Person</TableHead>
                              <TableHead>Client Email</TableHead>
                              <TableHead className="text-center">Total Tickets</TableHead>
                              <TableHead className="text-center">Resolved</TableHead>
                              <TableHead className="text-center">In Progress</TableHead>
                              <TableHead className="text-center">Excel Files</TableHead>
                              <TableHead>Last Message</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {agentClientDetails.map((detail, index) => (
                              <TableRow key={`${detail.agent_id}-${detail.customer_id}-${index}`}>
                                <TableCell className="font-medium">{detail.agent_name}</TableCell>
                                <TableCell>{detail.company_name || 'N/A'}</TableCell>
                                <TableCell>{detail.contact_person || 'N/A'}</TableCell>
                                <TableCell>{detail.customer_email}</TableCell>
                                <TableCell className="text-center">{detail.tickets_count}</TableCell>
                                <TableCell className="text-center">
                                  <Badge className="bg-green-600">{detail.resolved_count}</Badge>
                                </TableCell>
                                <TableCell className="text-center">
                                  <Badge variant="secondary">{detail.in_progress_count}</Badge>
                                </TableCell>
                                <TableCell className="text-center">
                                  <Badge variant="outline">{detail.excel_files_count}</Badge>
                                </TableCell>
                                <TableCell className="text-xs">
                                  {detail.last_message_time ? new Date(detail.last_message_time).toLocaleDateString() : 'N/A'}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
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
