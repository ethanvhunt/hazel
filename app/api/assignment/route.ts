import { connectToDatabase } from "@/lib/mongodb"
import { User, CustomerAgentAssignment } from "@/models"
import { logActivity } from "@/lib/activity-logger"
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

    await connectToDatabase()

    // Get the target user's role
    const targetUser = await User.findById(agentId).lean()

    if (!targetUser) {
      return NextResponse.json({ message: "Target user not found" }, { status: 404 })
    }

    const targetRole = (targetUser as any).role

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

    // Check if assignment exists, update or create
    const existingAssignment = await CustomerAgentAssignment.findOne({
      customerId,
      agentId,
    })

    let result
    if (existingAssignment) {
      result = await CustomerAgentAssignment.findByIdAndUpdate(
        existingAssignment._id,
        { assignedAt: new Date() },
        { new: true }
      ).lean()
    } else {
      const newAssignment = await CustomerAgentAssignment.create({
        customerId,
        agentId,
        assignedBy: session.userId,
        assignedAt: new Date(),
      })
      result = newAssignment.toObject()
    }

    // Log activity
    await logActivity({
      entityType: "assignment",
      entityId: customerId,
      action: "create",
      performedBy: session.userId,
      performedByType: "team",
      newValues: { agentId, customerId },
    })

    return NextResponse.json({
      id: (result as any)._id.toString(),
      customer_id: (result as any).customerId,
      agent_id: (result as any).agentId,
      assigned_by: (result as any).assignedBy,
      assigned_at: (result as any).assignedAt,
    }, { status: 201 })
  } catch (error) {
    console.error("[v0] Error assigning customer:", error)
    return NextResponse.json({ message: "Error assigning customer" }, { status: 500 })
  }
}
