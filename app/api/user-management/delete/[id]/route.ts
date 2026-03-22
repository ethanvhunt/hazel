import connectDB from "@/lib/mongodb"
import User from "@/models/User"
import { logActivity } from "@/lib/activity-logger"
import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { ROLES } from "@/lib/constants"
import mongoose from "mongoose"

async function checkSuperAdminAuth() {
  const cookieStore = await cookies()
  const teamSession = cookieStore.get("team-session")

  if (!teamSession) {
    return null
  }

  try {
    const session = JSON.parse(teamSession.value)
    // Only super_admin can delete users
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
    await connectDB()
    
    const { id } = await params
    const session = await checkSuperAdminAuth()
    
    if (!session) {
      return NextResponse.json({ message: "Unauthorized. Only super admin can delete users." }, { status: 403 })
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ message: "Invalid user ID" }, { status: 400 })
    }

    // Get user to be deleted
    const userToDelete = await User.findById(id).lean()

    if (!userToDelete) {
      return NextResponse.json({ message: "User not found" }, { status: 404 })
    }

    // Can't delete yourself
    if (id === session.userId) {
      return NextResponse.json({ message: "Cannot delete your own account" }, { status: 403 })
    }

    // Delete user
    await User.findByIdAndDelete(id)

    // Log activity
    await logActivity({
      entityType: "user",
      entityId: id,
      action: "delete",
      performedBy: session.userId,
      performedByType: "user",
      performedByName: session.fullName,
      oldValues: {
        full_name: (userToDelete as any).full_name,
        email: (userToDelete as any).email,
        role: (userToDelete as any).role,
      },
      details: `Deleted user ${(userToDelete as any).full_name}`,
    })

    return NextResponse.json({ message: "User deleted successfully" })
  } catch (error) {
    console.error("[v0] Error deleting user:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
