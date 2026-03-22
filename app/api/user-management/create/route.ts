import connectDB from "@/lib/mongodb"
import User from "@/models/User"
import { hashPassword } from "@/lib/auth"
import { logActivity } from "@/lib/activity-logger"
import { sendSMS, formatNewUserSMS } from "@/lib/sms"
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
    if (![ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER].includes(session.role)) {
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
    
    const session = await checkAdminAuth()
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 })
    }

    const { email, password, fullName, role, mobileNumber } = await request.json()

    const roleHierarchy: Record<string, number> = {
      super_admin: 4,
      admin: 3,
      manager: 2,
      agent: 1,
    }

    // Check if trying to create a role higher than or equal to their own
    if (roleHierarchy[role] >= roleHierarchy[session.role]) {
      return NextResponse.json(
        { message: `You can only create users with a lower role than ${session.role}` },
        { status: 403 },
      )
    }

    // Additional validation
    if (![ROLES.AGENT, ROLES.MANAGER, ROLES.ADMIN, ROLES.SUPER_ADMIN].includes(role)) {
      return NextResponse.json({ message: "Invalid role" }, { status: 400 })
    }

    // Validate inputs
    if (!email || !password || !fullName) {
      return NextResponse.json({ message: "Email, password, and full name are required" }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ message: "Password must be at least 6 characters" }, { status: 400 })
    }

    // Check for existing user
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

    // Send SMS notification if mobile number provided
    if (mobileNumber) {
      await sendSMS({
        to: mobileNumber,
        message: formatNewUserSMS(fullName, password),
        type: "user_created",
        relatedId: user._id.toString(),
      })
    }

    // Log activity
    await logActivity({
      entityType: "user",
      entityId: user._id,
      action: "create",
      performedBy: session.userId,
      performedByType: "user",
      performedByName: session.fullName,
      newValues: {
        email,
        full_name: fullName,
        role,
        mobile_number: mobileNumber || null,
      },
      details: `Created team member ${fullName} with role ${role}`,
    })

    return NextResponse.json({
      message: "User created successfully",
      user: {
        id: user._id.toString(),
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        mobile_number: user.mobile_number,
      },
    })
  } catch (error) {
    console.error("[v0] Error creating user:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
