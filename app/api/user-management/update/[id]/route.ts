import { sql } from "@/lib/db"
import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { ROLES } from "@/lib/constants"

async function checkAdminAuth() {
  const cookieStore = await cookies()
  const teamSession = cookieStore.get("team-session")

  if (!teamSession) {
    return null
  }

  try {
    const session = JSON.parse(teamSession.value)
    if (![ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER].includes(session.role)) {
      return null
    }
    return session
  } catch {
    return null
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const session = await checkAdminAuth()
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 })
    }

    const { fullName, role } = await request.json()

    // Get current user for activity logging
    const currentUsers = await sql`SELECT * FROM users WHERE id = ${id}`
    const currentUser = currentUsers[0]

    if (!currentUser) {
      return NextResponse.json({ message: "User not found" }, { status: 404 })
    }

    // Permission check - managers can only modify agents
    if (session.role === ROLES.MANAGER && currentUser.role !== ROLES.AGENT) {
      return NextResponse.json({ message: "Managers can only modify agents" }, { status: 403 })
    }

    // Can't promote above your own role
    const roleHierarchy: Record<string, number> = {
      super_admin: 4,
      admin: 3,
      manager: 2,
      agent: 1,
    }

    if (role && roleHierarchy[role] > roleHierarchy[session.role]) {
      return NextResponse.json({ message: "Cannot promote to higher role" }, { status: 403 })
    }

    const updates: string[] = []
    const values: any[] = []

    if (fullName) {
      updates.push(`full_name = $${updates.length + 1}`)
      values.push(fullName)
    }

    if (role) {
      updates.push(`role = $${updates.length + 1}`)
      values.push(role)
    }

    if (updates.length === 0) {
      return NextResponse.json({ message: "No updates provided" }, { status: 400 })
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`)
    values.push(id)

    const query = `UPDATE users SET ${updates.join(", ")} WHERE id = $${values.length} RETURNING id, email, full_name, role`
    const result = await sql(query, values)

    // Log activity
    await sql`
      INSERT INTO activity_logs (entity_type, entity_id, action, performed_by, old_values, new_values)
      VALUES ('user', ${id}, 'update', ${session.id}, ${JSON.stringify({
        fullName: currentUser.full_name,
        role: currentUser.role,
      })}, ${JSON.stringify({ fullName, role })})
    `

    return NextResponse.json({
      message: "User updated successfully",
      user: result[0],
    })
  } catch (error) {
    console.error("[v0] Error updating user:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
