import connectDB from "@/lib/mongodb"
import Customer from "@/models/Customer"
import { hashPassword } from "@/lib/auth"
import { logActivity } from "@/lib/activity-logger"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { ROLES } from "@/lib/constants"
import mongoose from "mongoose"

async function checkSuperAdminAuth() {
  const cookieStore = await cookies()
  const sessionStr = cookieStore.get("team-session")?.value

  if (!sessionStr) {
    return null
  }

  try {
    const session = JSON.parse(sessionStr)
    if (session.role !== ROLES.SUPER_ADMIN) {
      return null
    }
    return session
  } catch {
    return null
  }
}

export async function POST(request: Request) {
  try {
    await connectDB()
    
    const session = await checkSuperAdminAuth()

    if (!session) {
      return NextResponse.json(
        { message: "Unauthorized. Only super admins can reset customer passwords." },
        { status: 403 },
      )
    }

    const { customerId, newPassword } = await request.json()

    // Validate inputs
    if (!customerId || !newPassword) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 })
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ message: "Password must be at least 6 characters" }, { status: 400 })
    }

    if (!mongoose.Types.ObjectId.isValid(customerId)) {
      return NextResponse.json({ message: "Invalid customer ID" }, { status: 400 })
    }

    // Check if customer exists
    const customer = await Customer.findById(customerId)

    if (!customer) {
      return NextResponse.json({ message: "Customer not found" }, { status: 404 })
    }

    // Update customer password
    const newHash = hashPassword(newPassword)
    await Customer.findByIdAndUpdate(customerId, {
      $set: { password_hash: newHash },
    })

    // Log the action
    await logActivity({
      entityType: "customer",
      entityId: customerId,
      action: "update",
      performedBy: session.userId,
      performedByType: "user",
      performedByName: session.fullName,
      details: `Admin reset password for customer ${customer.company_name}`,
    })

    return NextResponse.json({ success: true, message: "Customer password reset successfully" })
  } catch (error) {
    console.error("[v0] Admin reset password error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
