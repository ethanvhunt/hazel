import { sql } from "@/lib/db"
import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { ROLES } from "@/lib/constants"

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies()
    const teamSession = cookieStore.get("team-session")

    if (!teamSession) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const session = JSON.parse(teamSession.value)

    // Only managers, admins, and super admins can assign customers
    if (![ROLES.MANAGER, ROLES.ADMIN, ROLES.SUPER_ADMIN].includes(session.role)) {
      return NextResponse.json({ message: "Insufficient permissions" }, { status: 403 })
    }

    const { customerId, agentId } = await request.json()

    // Get the target user's role
    const targetUser = await sql`
      SELECT role FROM users WHERE id = ${agentId}
    `

    if (!targetUser || targetUser.length === 0) {
      return NextResponse.json({ message: "Target user not found" }, { status: 404 })
    }

    const targetRole = targetUser[0].role

    // Validate assignment permissions based on role
    if (session.role === ROLES.MANAGER) {
      // Managers can only assign to agents
      if (targetRole !== ROLES.AGENT) {
        return NextResponse.json({ message: "Managers can only assign customers to agents" }, { status: 403 })
      }
    } else if (session.role === ROLES.ADMIN) {
      // Admins can assign to managers and agents (not super admins)
      if (![ROLES.MANAGER, ROLES.AGENT].includes(targetRole)) {
        return NextResponse.json(
          { message: "Admins can only assign customers to managers and agents" },
          { status: 403 },
        )
      }
    }
    // Super admins can assign to anyone (no restrictions)

    const result = await sql`
      INSERT INTO customer_agent_assignment (customer_id, agent_id, assigned_by, assigned_at)
      VALUES (${customerId}, ${agentId}, ${session.userId}, CURRENT_TIMESTAMP)
      ON CONFLICT (customer_id, agent_id) DO UPDATE SET assigned_at = CURRENT_TIMESTAMP
      RETURNING *
    `

    // Log activity
    await sql`
      INSERT INTO activity_logs (entity_type, entity_id, action, performed_by, new_values)
      VALUES ('assignment', ${customerId}, 'create', ${session.userId}, ${JSON.stringify({ agentId, customerId })})
    `

    return NextResponse.json(result[0], { status: 201 })
  } catch (error) {
    console.error("[v0] Error assigning customer:", error)
    return NextResponse.json({ message: "Error assigning customer" }, { status: 500 })
  }
}
