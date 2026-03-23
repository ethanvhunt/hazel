import connectDB from "@/lib/mongodb"
import User from "@/models/User"
import { logActivity } from "@/lib/activity-logger"
import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { ROLES } from "@/lib/constants"
import mongoose from "mongoose"

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
    await connectDB()
    
    const { id } = await params
    const session = await checkAdminAuth()
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 })
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ message: "Invalid user ID" }, { status: 400 })
    }

    const { fullName, role, mobile_number, gmail_address } = await request.json()

    // Get current user for activity logging
    const currentUser = await User.findById(id).lean()

    if (!currentUser) {
      return NextResponse.json({ message: "User not found" }, { status: 404 })
    }

    // Permission check - managers can only modify agents
    if (session.role === ROLES.MANAGER && (currentUser as any).role !== ROLES.AGENT) {
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

    // Build update object
    const updateData: any = {}
    const oldValues: any = {}
    const newValues: any = {}

    if (fullName !== undefined) {
      oldValues.full_name = (currentUser as any).full_name
      newValues.full_name = fullName
      updateData.full_name = fullName
    }

    if (role !== undefined) {
      oldValues.role = (currentUser as any).role
      newValues.role = role
      updateData.role = role
    }

    if (mobile_number !== undefined) {
      oldValues.mobile_number = (currentUser as any).mobile_number
      newValues.mobile_number = mobile_number
      updateData.mobile_number = mobile_number
    }

    if (gmail_address !== undefined) {
      oldValues.gmail_address = (currentUser as any).gmail_address
      newValues.gmail_address = gmail_address
      updateData.gmail_address = gmail_address
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ message: "No updates provided" }, { status: 400 })
    }

    const updatedUser = await User.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true }
    ).select("-password_hash")

    // Log activity
    await logActivity({
      entityType: "user",
      entityId: id,
      action: "update",
      performedBy: session.userId,
      performedByType: "user",
      performedByName: session.fullName,
      oldValues,
      newValues,
      details: `Updated user ${(currentUser as any).email}`,
    })

    return NextResponse.json({
      message: "User updated successfully",
      user: {
        id: updatedUser?._id.toString(),
        email: updatedUser?.email,
        full_name: updatedUser?.full_name,
        role: updatedUser?.role,
        mobile_number: updatedUser?.mobile_number,
        gmail_address: updatedUser?.gmail_address,
      },
    })
  } catch (error) {
    console.error("[v0] Error updating user:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
