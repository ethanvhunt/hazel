import { sql } from "@/lib/db"
import { hashPassword, verifyPassword } from "@/lib/auth"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { ROLES } from "@/lib/constants"

async function checkAdminAuth() {
  const cookieStore = await cookies()
  const sessionStr = cookieStore.get("team-session")?.value

  if (!sessionStr) {
    return null
  }

  try {
    const session = JSON.parse(sessionStr)
    return session
  } catch {
    return null
  }
}

export async function POST(request: Request) {
  try {
    const session = await checkAdminAuth()

    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const { targetUserId, oldPassword, newPassword } = await request.json()

    // If targetUserId is provided, it means an admin is changing another user's password
    const userId = targetUserId || session.userId

    if (targetUserId && ![ROLES.SUPER_ADMIN, ROLES.ADMIN].includes(session.role)) {
      return NextResponse.json({ message: "Only admins can change other users' passwords" }, { status: 403 })
    }

    const user = await sql`
      SELECT password_hash, role FROM users WHERE id = ${userId}
    `

    if (user.length === 0) {
      return NextResponse.json({ message: "User not found" }, { status: 404 })
    }

    // If changing own password, verify old password
    if (!targetUserId) {
      if (!verifyPassword(oldPassword, user[0].password_hash)) {
        return NextResponse.json({ message: "Invalid current password" }, { status: 401 })
      }
    }

    // Validate new password
    if (!newPassword || newPassword.length < 6) {
      return NextResponse.json({ message: "Password must be at least 6 characters" }, { status: 400 })
    }

    const newHash = hashPassword(newPassword)
    await sql`
      UPDATE users
      SET password_hash = ${newHash}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${userId}
    `

    await sql`
      INSERT INTO activity_logs (entity_type, entity_id, action, performed_by)
      VALUES ('user', ${userId}, 'password_change', ${session.userId})
    `

    return NextResponse.json({ success: true, message: "Password changed successfully" })
  } catch (error) {
    console.error("[v0] Change password error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
