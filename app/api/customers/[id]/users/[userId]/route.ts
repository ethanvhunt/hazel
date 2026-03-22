import { connectToDatabase } from "@/lib/mongodb"
import { CustomerUser } from "@/models"
import { logActivity } from "@/lib/activity-logger"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { hashPassword } from "@/lib/auth"

// PUT - Update customer user
export async function PUT(request: Request, { params }: { params: Promise<{ id: string; userId: string }> }) {
  try {
    const { id: customerId, userId } = await params
    const cookieStore = await cookies()
    const teamSession = cookieStore.get("team-session")?.value
    const customerSession = cookieStore.get("customer-session")?.value

    let hasAccess = false
    
    if (teamSession) {
      const sessionData = JSON.parse(teamSession)
      if (["super_admin", "admin", "manager"].includes(sessionData.role)) {
        hasAccess = true
      }
    }
    
    if (customerSession) {
      const custSessionData = JSON.parse(customerSession)
      if (custSessionData.customerId === customerId && custSessionData.role === "customer_admin") {
        hasAccess = true
      }
    }

    if (!hasAccess) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const { full_name, mobile_number, is_active, password } = await request.json()

    await connectToDatabase()

    const updateData: any = {
      updatedAt: new Date(),
    }
    
    if (full_name !== undefined) updateData.fullName = full_name
    if (mobile_number !== undefined) updateData.mobileNumber = mobile_number
    if (is_active !== undefined) updateData.isActive = is_active
    if (password) updateData.passwordHash = hashPassword(password)

    const updatedUser = await CustomerUser.findOneAndUpdate(
      { _id: userId, customerId },
      updateData,
      { new: true }
    ).select("-passwordHash").lean()

    if (!updatedUser) {
      return NextResponse.json({ message: "User not found" }, { status: 404 })
    }

    return NextResponse.json({
      user: {
        id: (updatedUser as any)._id.toString(),
        full_name: (updatedUser as any).fullName,
        email: (updatedUser as any).email,
        mobile_number: (updatedUser as any).mobileNumber,
        role: (updatedUser as any).role,
        is_active: (updatedUser as any).isActive,
      },
    })
  } catch (error) {
    console.error("[v0] Update customer user error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

// DELETE - Delete customer user (super_admin only)
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string; userId: string }> }) {
  try {
    const { id: customerId, userId } = await params
    const cookieStore = await cookies()
    const teamSession = cookieStore.get("team-session")?.value

    if (!teamSession) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const sessionData = JSON.parse(teamSession)
    
    // Only super_admin can delete users
    if (sessionData.role !== "super_admin") {
      return NextResponse.json({ message: "Only super admin can delete users" }, { status: 403 })
    }

    await connectToDatabase()

    const user = await CustomerUser.findOne({ _id: userId, customerId }).lean()

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 })
    }

    await CustomerUser.findByIdAndDelete(userId)

    // Log activity
    await logActivity({
      entityType: "customer_user",
      entityId: userId,
      action: "delete",
      performedBy: sessionData.userId,
      performedByType: "team",
      oldValues: { fullName: (user as any).fullName, customerId },
    })

    return NextResponse.json({ message: "User deleted successfully" })
  } catch (error) {
    console.error("[v0] Delete customer user error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
