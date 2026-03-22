import { sql } from "@/lib/db"
import { NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies()
    const teamSession = cookieStore.get("team-session")
    const customerSession = cookieStore.get("customer-session")

    let userId: string | null = null
    let userType: "team" | "customer" | null = null

    if (teamSession) {
      const session = JSON.parse(teamSession.value)
      userId = session.id
      userType = "team"
    } else if (customerSession) {
      const session = JSON.parse(customerSession.value)
      userId = session.customerId
      userType = "customer"
    }

    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    // Get real-time events (updates in last 5 minutes)
    let events: any[] = []

    if (userType === "team") {
      // Team member events
      events = await sql`
        SELECT 
          'ticket_created' as event_type, 
          t.id as entity_id, t.title, 
          'New ticket created' as description,
          t.created_at as timestamp,
          c.company_name as from_entity
        FROM tickets t
        JOIN customers c ON t.customer_id = c.id
        WHERE t.created_at > NOW() - INTERVAL '5 minutes'
        
        UNION ALL
        
        SELECT 
          'ticket_updated' as event_type,
          t.id as entity_id, t.title,
          'Ticket status: ' || t.status as description,
          t.updated_at as timestamp,
          c.company_name as from_entity
        FROM tickets t
        JOIN customers c ON t.customer_id = c.id
        WHERE t.updated_at > NOW() - INTERVAL '5 minutes' AND t.updated_at != t.created_at
        
        UNION ALL
        
        SELECT 
          'message_received' as event_type,
          m.id as entity_id, t.title,
          'New message on ticket' as description,
          m.created_at as timestamp,
          CASE WHEN m.sender_type = 'customer' THEN c.company_name ELSE u.full_name END as from_entity
        FROM messages m
        JOIN tickets t ON m.ticket_id = t.id
        LEFT JOIN users u ON m.sender_id = u.id AND m.sender_type = 'agent'
        LEFT JOIN customers c ON m.sender_id = c.id AND m.sender_type = 'customer'
        WHERE t.agent_id = ${userId} AND m.created_at > NOW() - INTERVAL '5 minutes'
        
        ORDER BY timestamp DESC
        LIMIT 50
      `
    } else if (userType === "customer") {
      // Customer events
      events = await sql`
        SELECT 
          'ticket_assigned' as event_type,
          t.id as entity_id, t.title,
          'Ticket assigned to agent' as description,
          t.updated_at as timestamp,
          u.full_name as from_entity
        FROM tickets t
        LEFT JOIN users u ON t.agent_id = u.id
        WHERE t.customer_id = ${userId} AND t.updated_at > NOW() - INTERVAL '5 minutes'
        
        UNION ALL
        
        SELECT 
          'message_received' as event_type,
          m.id as entity_id, t.title,
          'New message from support' as description,
          m.created_at as timestamp,
          u.full_name as from_entity
        FROM messages m
        JOIN tickets t ON m.ticket_id = t.id
        JOIN users u ON m.sender_id = u.id
        WHERE t.customer_id = ${userId} AND m.sender_type = 'agent' AND m.created_at > NOW() - INTERVAL '5 minutes'
        
        ORDER BY timestamp DESC
        LIMIT 50
      `
    }

    return NextResponse.json({ events, timestamp: new Date().toISOString() })
  } catch (error) {
    console.error("[v0] Error fetching real-time events:", error)
    return NextResponse.json({ message: "Error fetching events" }, { status: 500 })
  }
}
