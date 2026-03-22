import { sql } from "@/lib/db"
import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { ROLES } from "@/lib/constants"

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    const tickets = await sql`
      SELECT 
        t.*,
        c.company_name as customer_name,
        cp.name as product_name,
        cp.product_code,
        u.full_name as agent_name,
        u.full_name as assigned_to_name
      FROM tickets t
      LEFT JOIN customers c ON t.customer_id = c.id
      LEFT JOIN catalog_products cp ON t.product_id = cp.id
      LEFT JOIN users u ON t.assigned_agent_id = u.id
      WHERE t.id = ${id}::uuid
    `

    if (tickets.length === 0) {
      return NextResponse.json({ message: "Ticket not found" }, { status: 404 })
    }

    return NextResponse.json(tickets[0])
  } catch (error) {
    console.error("[v0] Error fetching ticket:", error)
    return NextResponse.json({ message: "Error fetching ticket", error: String(error) }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const cookieStore = await cookies()
    const teamSession = cookieStore.get("team-session")

    if (!teamSession) {
      console.error("[v0] No team session found")
      return NextResponse.json({ message: "Unauthorized - No session" }, { status: 401 })
    }

    let session
    try {
      session = JSON.parse(teamSession.value)
    } catch (error) {
      console.error("[v0] Failed to parse session:", error)
      return NextResponse.json({ message: "Unauthorized - Invalid session" }, { status: 401 })
    }

    if (!session.userId) {
      console.error("[v0] Session missing userId:", session)
      return NextResponse.json({ message: "Unauthorized - Invalid session data" }, { status: 401 })
    }

    const body = await request.json()
    const { status, agentId, priority } = body

    console.log("[v0] Update request:", { id, status, agentId, priority, userId: session.userId })

    const currentTickets = await sql`SELECT * FROM tickets WHERE id = ${id}::uuid`

    if (currentTickets.length === 0) {
      console.error("[v0] Ticket not found:", id)
      return NextResponse.json({ message: "Ticket not found" }, { status: 404 })
    }

    const currentTicket = currentTickets[0]
    console.log("[v0] Current ticket:", currentTicket)

    let updatedTicket

    if (status !== undefined && agentId !== undefined && priority !== undefined) {
      // Update all three fields
      const result = await sql`
        UPDATE tickets 
        SET 
          status = ${status}::varchar,
          agent_id = ${agentId}::uuid,
          priority = ${priority}::varchar,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ${id}::uuid
        RETURNING *
      `
      updatedTicket = result[0]
    } else if (status !== undefined && agentId !== undefined) {
      // Update status and agent
      const result = await sql`
        UPDATE tickets 
        SET 
          status = ${status}::varchar,
          agent_id = ${agentId}::uuid,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ${id}::uuid
        RETURNING *
      `
      updatedTicket = result[0]
    } else if (status !== undefined && priority !== undefined) {
      // Update status and priority
      const result = await sql`
        UPDATE tickets 
        SET 
          status = ${status}::varchar,
          priority = ${priority}::varchar,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ${id}::uuid
        RETURNING *
      `
      updatedTicket = result[0]
    } else if (agentId !== undefined && priority !== undefined) {
      // Update agent and priority
      const result = await sql`
        UPDATE tickets 
        SET 
          agent_id = ${agentId}::uuid,
          priority = ${priority}::varchar,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ${id}::uuid
        RETURNING *
      `
      updatedTicket = result[0]
    } else if (status !== undefined) {
      // Update only status
      const result = await sql`
        UPDATE tickets 
        SET 
          status = ${status}::varchar,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ${id}::uuid
        RETURNING *
      `
      updatedTicket = result[0]
    } else if (agentId !== undefined) {
      // Update only agent
      const result = await sql`
        UPDATE tickets 
        SET 
          agent_id = ${agentId}::uuid,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ${id}::uuid
        RETURNING *
      `
      updatedTicket = result[0]
    } else if (priority !== undefined) {
      // Update only priority
      const result = await sql`
        UPDATE tickets 
        SET 
          priority = ${priority}::varchar,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ${id}::uuid
        RETURNING *
      `
      updatedTicket = result[0]
    } else {
      console.error("[v0] No update fields provided")
      return NextResponse.json({ message: "No updates provided" }, { status: 400 })
    }

    console.log("[v0] Ticket updated successfully:", updatedTicket)

    const oldValues: any = {}
    const newValues: any = {}

    if (status !== undefined) {
      oldValues.status = currentTicket.status
      newValues.status = status
    }
    if (agentId !== undefined) {
      oldValues.agent_id = currentTicket.agent_id
      newValues.agent_id = agentId
    }
    if (priority !== undefined) {
      oldValues.priority = currentTicket.priority
      newValues.priority = priority
    }

    try {
      await sql`
        INSERT INTO activity_logs (
          entity_type, 
          entity_id, 
          action, 
          performed_by, 
          old_values, 
          new_values
        )
        VALUES (
          'ticket'::varchar,
          ${id}::uuid,
          'update'::varchar,
          ${session.userId}::uuid,
          ${JSON.stringify(oldValues)}::jsonb,
          ${JSON.stringify(newValues)}::jsonb
        )
      `
      console.log("[v0] Activity logged successfully")
    } catch (logError) {
      console.error("[v0] Failed to log activity (non-critical):", logError)
      // Don't fail the request if logging fails
    }

    const finalTickets = await sql`
      SELECT 
        t.*,
        c.company_name as customer_name,
        cp.name as product_name,
        cp.product_code,
        u.full_name as agent_name,
        u.full_name as assigned_to_name
      FROM tickets t
      LEFT JOIN customers c ON t.customer_id = c.id
      LEFT JOIN catalog_products cp ON t.product_id = cp.id
      LEFT JOIN users u ON t.assigned_agent_id = u.id
      WHERE t.id = ${id}::uuid
    `

    return NextResponse.json(finalTickets[0])
  } catch (error) {
    console.error("[v0] Error updating ticket:", error)
    return NextResponse.json(
      {
        message: "Error updating ticket",
        error: String(error),
      },
      { status: 500 },
    )
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return PUT(request, { params })
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const cookieStore = await cookies()
    const teamSession = cookieStore.get("team-session")

    if (!teamSession) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    let session
    try {
      session = JSON.parse(teamSession.value)
    } catch {
      return NextResponse.json({ message: "Unauthorized - Invalid session" }, { status: 401 })
    }

    // Only super_admin can delete tickets
    if (session.role !== ROLES.SUPER_ADMIN) {
      return NextResponse.json({ message: "Unauthorized. Only super admin can delete tickets." }, { status: 403 })
    }

    // Get ticket data for logging
    const tickets = await sql`SELECT * FROM tickets WHERE id = ${id}::uuid`
    if (tickets.length === 0) {
      return NextResponse.json({ message: "Ticket not found" }, { status: 404 })
    }

    const ticketToDelete = tickets[0]

    // Delete related messages first
    await sql`DELETE FROM messages WHERE ticket_id = ${id}::uuid`

    // Delete the ticket
    await sql`DELETE FROM tickets WHERE id = ${id}::uuid`

    // Log activity
    await sql`
      INSERT INTO activity_logs (entity_type, entity_id, action, performed_by, old_values, new_values)
      VALUES ('ticket', ${id}::uuid, 'delete', ${session.userId}::uuid, ${JSON.stringify({
        id: ticketToDelete.id,
        title: ticketToDelete.title,
        status: ticketToDelete.status,
        priority: ticketToDelete.priority,
      })}::jsonb, null)
    `

    return NextResponse.json({ message: "Ticket deleted successfully" })
  } catch (error) {
    console.error("Error deleting ticket:", error)
    return NextResponse.json({ message: "Error deleting ticket", error: String(error) }, { status: 500 })
  }
}
