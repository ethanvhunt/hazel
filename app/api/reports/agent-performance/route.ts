import { neon } from '@neondatabase/serverless'
import { cookies } from 'next/headers'

export async function GET() {
  try {
    // Check authentication
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get('team-session')

    if (!sessionCookie?.value) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const session = JSON.parse(decodeURIComponent(sessionCookie.value))

    if (session.role !== 'super_admin') {
      return Response.json({ error: 'Forbidden: Only super admins can access reports' }, { status: 403 })
    }

    const sql = neon(process.env.DATABASE_URL!)

    // Get ticket counts by agent
    const ticketCounts = await sql`
      SELECT 
        agent_id,
        COUNT(*)::int as total_tickets,
        SUM(CASE WHEN status = 'open' THEN 1 ELSE 0 END)::int as open_tickets,
        SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END)::int as in_progress_tickets,
        SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END)::int as resolved_tickets
      FROM tickets
      WHERE agent_id IS NOT NULL
      GROUP BY agent_id
    `

    // Get client assignments by agent
    const clientAssignments = await sql`
      SELECT 
        agent_id,
        COUNT(DISTINCT customer_id)::int as total_clients
      FROM customer_agent_assignment
      GROUP BY agent_id
    `

    // Get excel uploads by agent
    const excelUploads = await sql`
      SELECT 
        uploaded_by,
        COUNT(*)::int as total_excel_uploads
      FROM excel_uploads
      WHERE uploaded_by IS NOT NULL
      GROUP BY uploaded_by
    `

    // Get average response time per agent (time between ticket creation and first agent message)
    const responseTime = await sql`
      SELECT 
        t.agent_id,
        ROUND(AVG(EXTRACT(EPOCH FROM (m.created_at - t.created_at)) / 3600)::numeric, 2)::float as avg_response_time_hours
      FROM tickets t
      INNER JOIN messages m ON t.id = m.ticket_id AND m.sender_type = 'agent' AND m.sender_id = t.agent_id
      WHERE t.agent_id IS NOT NULL
      GROUP BY t.agent_id
    `

    // Get all agents
    const agents = await sql`
      SELECT 
        id,
        full_name,
        email,
        gmail_address,
        role,
        created_at
      FROM users
      WHERE role IN ('agent', 'manager', 'super_admin')
      ORDER BY created_at DESC
    `

    // Combine agent data with metrics
    const agentMetrics = agents.map((agent: any) => {
      const tickets = ticketCounts.find((t: any) => t.agent_id === agent.id) || {
        total_tickets: 0,
        open_tickets: 0,
        in_progress_tickets: 0,
        resolved_tickets: 0,
      }
      const clients = clientAssignments.find((c: any) => c.agent_id === agent.id) || { total_clients: 0 }
      const excel = excelUploads.find((e: any) => e.uploaded_by === agent.id) || { total_excel_uploads: 0 }
      const response = responseTime.find((r: any) => r.agent_id === agent.id) || { avg_response_time_hours: 0 }

      return {
        ...agent,
        ...tickets,
        ...clients,
        ...excel,
        ...response,
      }
    })

    // Get detailed agent-client information
    const agentClientDetails = await sql`
      SELECT 
        u.id as agent_id,
        u.full_name as agent_name,
        c.id as customer_id,
        c.company_name,
        c.contact_person,
        c.email as customer_email,
        COUNT(DISTINCT t.id)::int as tickets_count,
        SUM(CASE WHEN t.status = 'resolved' THEN 1 ELSE 0 END)::int as resolved_count,
        SUM(CASE WHEN t.status = 'in_progress' THEN 1 ELSE 0 END)::int as in_progress_count,
        SUM(CASE WHEN t.status = 'open' THEN 1 ELSE 0 END)::int as open_count,
        (SELECT COUNT(*)::int FROM excel_uploads WHERE uploaded_by = u.id AND customer_id = c.id) as excel_files_count,
        MAX(m.created_at) as last_message_time
      FROM users u
      INNER JOIN customer_agent_assignment ca ON u.id = ca.agent_id
      INNER JOIN customers c ON ca.customer_id = c.id
      LEFT JOIN tickets t ON c.id = t.customer_id AND u.id = t.agent_id
      LEFT JOIN messages m ON t.id = m.ticket_id
      WHERE u.role IN ('agent', 'manager', 'super_admin')
      GROUP BY u.id, u.full_name, c.id, c.company_name, c.contact_person, c.email
      ORDER BY u.full_name, c.company_name
    `

    // Calculate summary statistics
    const totalTickets = agentMetrics.reduce((sum: number, agent: any) => sum + (agent.total_tickets || 0), 0)
    const totalResolvedTickets = agentMetrics.reduce((sum: number, agent: any) => sum + (agent.resolved_tickets || 0), 0)
    const totalOpenTickets = agentMetrics.reduce((sum: number, agent: any) => sum + (agent.open_tickets || 0), 0)
    const totalInProgressTickets = agentMetrics.reduce((sum: number, agent: any) => sum + (agent.in_progress_tickets || 0), 0)
    const avgResponseTimeAcrossAgents =
      agentMetrics.reduce((sum: number, agent: any) => sum + (agent.avg_response_time_hours || 0), 0) /
      Math.max(agentMetrics.length, 1)

    return Response.json({
      agentMetrics,
      agentClientDetails,
      summary: {
        totalAgents: agentMetrics.length,
        totalTickets,
        totalResolvedTickets,
        totalOpenTickets,
        totalInProgressTickets,
        totalClients: agentClientDetails.reduce((acc: any, item: any) => {
          if (!acc.includes(item.customer_id)) {
            acc.push(item.customer_id)
          }
          return acc
        }, []).length,
        avgResponseTimeHours: Number(avgResponseTimeAcrossAgents.toFixed(2)),
      },
    })
  } catch (error) {
    console.error('[v0] Error fetching agent performance metrics:', error)
    return Response.json(
      { error: 'Failed to fetch agent performance metrics', details: String(error) },
      { status: 500 }
    )
  }
}
