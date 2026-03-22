import { connectToDatabase } from "@/lib/mongodb"
import { User, CustomerAgentAssignment } from "@/models"
import { logActivity } from "@/lib/activity-logger"
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

    await connectToDatabase()

    const user = await User.findById(id).select("-passwordHash").lean()

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 })
    }

    return NextResponse.json({
      id: (user as any)._id.toString(),
      email: (user as any).email,
      full_name: (user as any).fullName,
      role: (user as any).role,
      mobile_number: (user as any).mobileNumber,
      created_at: (user as any).createdAt,
    })
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

    await connectToDatabase()

    const currentUser = await User.findById(id).lean()
    if (!currentUser) {
      return NextResponse.json({ message: "User not found" }, { status: 404 })
    }

    // Non-super_admin cannot modify super_admin users
    if ((currentUser as any).role === ROLES.SUPER_ADMIN && session.role !== ROLES.SUPER_ADMIN) {
      return NextResponse.json({ message: "Cannot modify super admin" }, { status: 403 })
    }

    // Only super_admin can assign super_admin role
    if (role === ROLES.SUPER_ADMIN && session.role !== ROLES.SUPER_ADMIN) {
      return NextResponse.json({ message: "Only super admin can assign super admin role" }, { status: 403 })
    }

    const updatedUser = await User.findByIdAndUpdate(
      id,
      {
        fullName: fullName || (currentUser as any).fullName,
        email: email || (currentUser as any).email,
        role: role || (currentUser as any).role,
        mobileNumber: mobileNumber || (currentUser as any).mobileNumber,
        updatedAt: new Date(),
      },
      { new: true }
    ).select("-passwordHash").lean()

    // Log activity
    await logActivity({
      entityType: "user",
      entityId: id,
      action: "update",
      performedBy: session.userId,
      performedByType: "team",
      oldValues: {
        fullName: (currentUser as any).fullName,
        email: (currentUser as any).email,
        role: (currentUser as any).role,
        mobileNumber: (currentUser as any).mobileNumber,
      },
      newValues: {
        fullName: fullName || (currentUser as any).fullName,
        email: email || (currentUser as any).email,
        role: role || (currentUser as any).role,
        mobileNumber: mobileNumber || (currentUser as any).mobileNumber,
      },
    })

    return NextResponse.json({
      message: "User updated successfully",
      user: {
        id: (updatedUser as any)._id.toString(),
        email: (updatedUser as any).email,
        full_name: (updatedUser as any).fullName,
        role: (updatedUser as any).role,
        mobile_number: (updatedUser as any).mobileNumber,
        created_at: (updatedUser as any).createdAt,
      },
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

    await connectToDatabase()

    const userToDelete = await User.findById(id).lean()
    if (!userToDelete) {
      return NextResponse.json({ message: "User not found" }, { status: 404 })
    }

    // Cannot delete yourself
    if ((userToDelete as any)._id.toString() === session.userId) {
      return NextResponse.json({ message: "Cannot delete your own account" }, { status: 400 })
    }

    // Remove customer assignments first
    await CustomerAgentAssignment.deleteMany({ agentId: id })

    // Delete user
    await User.findByIdAndDelete(id)

    // Log activity
    await logActivity({
      entityType: "user",
      entityId: id,
      action: "delete",
      performedBy: session.userId,
      performedByType: "team",
      oldValues: {
        id: (userToDelete as any)._id.toString(),
        fullName: (userToDelete as any).fullName,
        email: (userToDelete as any).email,
        role: (userToDelete as any).role,
      },
      newValues: null,
    })

    return NextResponse.json({ message: "User deleted successfully" })
  } catch (error) {
    console.error("Error deleting user:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
