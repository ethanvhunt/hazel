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
    if (session.role !== ROLES.SUPER_ADMIN) {
      return null
    }
    return session
  } catch {
    return null
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const session = await checkAdminAuth()
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 })
    }

    // Get user to be deleted
    const users = await sql`SELECT * FROM users WHERE id = ${id}`
    const userToDelete = users[0]

    if (!userToDelete) {
      return NextResponse.json({ message: "User not found" }, { status: 404 })
    }

    // Can't delete yourself
    if (id === session.id) {
      return NextResponse.json({ message: "Cannot delete your own account" }, { status: 403 })
    }

    // Delete user
    await sql`DELETE FROM users WHERE id = ${id}`

    // Log activity
    await sql`
      INSERT INTO activity_logs (entity_type, entity_id, action, performed_by, old_values, new_values)
      VALUES ('user', ${id}, 'delete', ${session.id}, ${JSON.stringify({
        id: userToDelete.id,
        fullName: userToDelete.full_name,
        email: userToDelete.email,
        role: userToDelete.role,
      })}, null)
    `

    return NextResponse.json({ message: "User deleted successfully" })
  } catch (error) {
    console.error("[v0] Error deleting user:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
