import { sql } from "@/lib/db"
import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { ROLES } from "@/lib/constants"

async function getSession() {
  const cookieStore = await cookies()
  const teamSession = cookieStore.get("team-session")

  if (!teamSession) {
    return null
  }

  try {
    return JSON.parse(teamSession.value)
  } catch {
    return null
  }
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const session = await getSession()

    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const users = await sql`
      SELECT id, email, full_name, role, mobile_number, created_at
      FROM users
      WHERE id = ${id}
    `

    if (users.length === 0) {
      return NextResponse.json({ message: "User not found" }, { status: 404 })
    }

    return NextResponse.json(users[0])
  } catch (error) {
    console.error("Error fetching user:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const session = await getSession()

    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    // Only super_admin and admin can update users
    if (![ROLES.SUPER_ADMIN, ROLES.ADMIN].includes(session.role)) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 })
    }

    const { fullName, email, role, mobileNumber } = await request.json()

    // Fetch current user data
    const currentUsers = await sql`SELECT * FROM users WHERE id = ${id}`
    if (currentUsers.length === 0) {
      return NextResponse.json({ message: "User not found" }, { status: 404 })
    }

    const currentUser = currentUsers[0]

    // Non-super_admin cannot modify super_admin users
    if (currentUser.role === ROLES.SUPER_ADMIN && session.role !== ROLES.SUPER_ADMIN) {
      return NextResponse.json({ message: "Cannot modify super admin" }, { status: 403 })
    }

    // Only super_admin can assign super_admin role
    if (role === ROLES.SUPER_ADMIN && session.role !== ROLES.SUPER_ADMIN) {
      return NextResponse.json({ message: "Only super admin can assign super admin role" }, { status: 403 })
    }

    const updatedUsers = await sql`
      UPDATE users 
      SET 
        full_name = ${fullName || currentUser.full_name},
        email = ${email || currentUser.email},
        role = ${role || currentUser.role},
        mobile_number = ${mobileNumber || currentUser.mobile_number}
      WHERE id = ${id}
      RETURNING id, email, full_name, role, mobile_number, created_at
    `

    // Log activity
    await sql`
      INSERT INTO activity_logs (entity_type, entity_id, action, performed_by, old_values, new_values)
      VALUES ('user', ${id}, 'update', ${session.userId}, ${JSON.stringify({
        fullName: currentUser.full_name,
        email: currentUser.email,
        role: currentUser.role,
        mobileNumber: currentUser.mobile_number,
      })}, ${JSON.stringify({
        fullName: fullName || currentUser.full_name,
        email: email || currentUser.email,
        role: role || currentUser.role,
        mobileNumber: mobileNumber || currentUser.mobile_number,
      })})
    `

    return NextResponse.json({
      message: "User updated successfully",
      user: updatedUsers[0],
    })
  } catch (error) {
    console.error("Error updating user:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const session = await getSession()

    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    // Only super_admin can delete users
    if (session.role !== ROLES.SUPER_ADMIN) {
      return NextResponse.json({ message: "Unauthorized. Only super admin can delete users." }, { status: 403 })
    }

    // Get user to delete
    const users = await sql`SELECT * FROM users WHERE id = ${id}`
    if (users.length === 0) {
      return NextResponse.json({ message: "User not found" }, { status: 404 })
    }

    const userToDelete = users[0]

    // Cannot delete yourself
    if (userToDelete.id === session.userId) {
      return NextResponse.json({ message: "Cannot delete your own account" }, { status: 400 })
    }

    // Remove customer assignments first
    await sql`DELETE FROM customer_agent_assignment WHERE agent_id = ${id}`

    // Delete user
    await sql`DELETE FROM users WHERE id = ${id}`

    // Log activity
    await sql`
      INSERT INTO activity_logs (entity_type, entity_id, action, performed_by, old_values, new_values)
      VALUES ('user', ${id}, 'delete', ${session.userId}, ${JSON.stringify({
        id: userToDelete.id,
        fullName: userToDelete.full_name,
        email: userToDelete.email,
        role: userToDelete.role,
      })}, null)
    `

    return NextResponse.json({ message: "User deleted successfully" })
  } catch (error) {
    console.error("Error deleting user:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
