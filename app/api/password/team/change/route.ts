import { connectToDatabase } from "@/lib/mongodb"
import { User } from "@/models"
import { logActivity } from "@/lib/activity-logger"
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

    await connectToDatabase()

    const user = await User.findById(userId).lean()

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 })
    }

    // If changing own password, verify old password
    if (!targetUserId) {
      if (!verifyPassword(oldPassword, (user as any).passwordHash)) {
        return NextResponse.json({ message: "Invalid current password" }, { status: 401 })
      }
    }

    // Validate new password
    if (!newPassword || newPassword.length < 6) {
      return NextResponse.json({ message: "Password must be at least 6 characters" }, { status: 400 })
    }

    const newHash = hashPassword(newPassword)
    await User.findByIdAndUpdate(userId, {
      passwordHash: newHash,
      updatedAt: new Date(),
    })

    await logActivity({
      entityType: "user",
      entityId: userId,
      action: "password_change",
      performedBy: session.userId,
      performedByType: "team",
    })

    return NextResponse.json({ success: true, message: "Password changed successfully" })
  } catch (error) {
    console.error("[v0] Change password error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
