import connectDB from "@/lib/mongodb"
import User from "@/models/User"
import { hashPassword } from "@/lib/auth"
import { logActivity } from "@/lib/activity-logger"
import { NextResponse } from "next/server"
import { ROLES } from "@/lib/constants"

export async function POST(request: Request) {
  try {
    await connectDB()
    
    const { email, password, fullName, role, mobileNumber } = await request.json()

    const validRoles = [ROLES.AGENT, ROLES.MANAGER, ROLES.ADMIN, ROLES.SUPER_ADMIN]
    if (!validRoles.includes(role)) {
      return NextResponse.json({ message: "Invalid role" }, { status: 400 })
    }

    // Validate password strength
    if (password.length < 6) {
      return NextResponse.json({ message: "Password must be at least 6 characters" }, { status: 400 })
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() })

    if (existingUser) {
      return NextResponse.json({ message: "Email already exists" }, { status: 400 })
    }

    const passwordHash = hashPassword(password)

    const user = await User.create({
      email: email.toLowerCase(),
      password_hash: passwordHash,
      full_name: fullName,
      role,
      mobile_number: mobileNumber || null,
      is_active: true,
    })

    // Log the activity
    await logActivity({
      entityType: "user",
      entityId: user._id,
      action: "create",
      performedByType: "system",
      performedByName: "System",
      newValues: { email: user.email, full_name: user.full_name, role: user.role },
      details: `New team member ${user.full_name} registered`,
    })

    return NextResponse.json({
      message: "Registration successful",
      user: {
        id: user._id.toString(),
        email: user.email,
        role: user.role,
        full_name: user.full_name,
      },
    })
  } catch (error) {
    console.error("[v0] Registration error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
