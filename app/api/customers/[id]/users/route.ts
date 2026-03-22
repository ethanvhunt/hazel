import { connectToDatabase } from "@/lib/mongodb"
import { CustomerUser } from "@/models"
import { logActivity } from "@/lib/activity-logger"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { hashPassword } from "@/lib/auth"
import { sendSMS, formatNewUserSMS } from "@/lib/sms"

// GET all users for a customer
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: customerId } = await params
    const cookieStore = await cookies()
    const teamSession = cookieStore.get("team-session")?.value
    const customerSession = cookieStore.get("customer-session")?.value

    // Team members or customer_admin can view users
    let hasAccess = false
    
    if (teamSession) {
      const sessionData = JSON.parse(teamSession)
      if (["super_admin", "admin", "manager", "agent"].includes(sessionData.role)) {
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

    await connectToDatabase()

    const users = await CustomerUser.find({ customerId })
      .select("-passwordHash")
      .sort({ createdAt: -1 })
      .lean()

    // Transform for frontend compatibility
    const transformed = users.map((u: any) => ({
      id: u._id.toString(),
      full_name: u.fullName,
      email: u.email,
      mobile_number: u.mobileNumber,
      role: u.role,
      is_active: u.isActive,
      created_at: u.createdAt,
    }))

    return NextResponse.json(transformed)
  } catch (error) {
    console.error("[v0] Get customer users error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

// POST - Create a new customer user
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: customerId } = await params
    const cookieStore = await cookies()
    const teamSession = cookieStore.get("team-session")?.value
    const customerSession = cookieStore.get("customer-session")?.value

    let createdBy: string | null = null
    let hasAccess = false
    
    // Team members can create users
    if (teamSession) {
      const sessionData = JSON.parse(teamSession)
      if (["super_admin", "admin", "manager"].includes(sessionData.role)) {
        hasAccess = true
        createdBy = sessionData.userId
      }
    }
    
    // customer_admin can create customer_agent users
    if (customerSession) {
      const custSessionData = JSON.parse(customerSession)
      if (custSessionData.customerId === customerId && custSessionData.role === "customer_admin") {
        hasAccess = true
        createdBy = custSessionData.userId
      }
    }

    if (!hasAccess) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const { full_name, email, mobile_number, role, password } = await request.json()

    if (!full_name || !email || !mobile_number || !role) {
      return NextResponse.json({ message: "All fields are required" }, { status: 400 })
    }

    // Validate role
    if (!["customer_admin", "customer_agent"].includes(role)) {
      return NextResponse.json({ message: "Invalid role" }, { status: 400 })
    }

    // If customer_admin is creating, they can only create customer_agent
    if (customerSession) {
      const custSessionData = JSON.parse(customerSession)
      if (custSessionData.role === "customer_admin" && role !== "customer_agent") {
        return NextResponse.json({ message: "You can only create customer agents" }, { status: 403 })
      }
    }

    await connectToDatabase()

    // Check if email already exists
    const existing = await CustomerUser.findOne({ email })
    if (existing) {
      return NextResponse.json({ message: "Email already exists" }, { status: 400 })
    }

    // Generate temporary password if not provided
    const tempPassword = password || Math.random().toString(36).slice(-8)
    const passwordHash = hashPassword(tempPassword)

    const newUser = await CustomerUser.create({
      customerId,
      fullName: full_name,
      email,
      mobileNumber: mobile_number,
      passwordHash,
      role,
      createdBy,
    })

    // Send SMS with credentials
    await sendSMS({
      to: mobile_number,
      message: formatNewUserSMS(full_name, tempPassword),
      type: "user_created",
      relatedId: newUser._id.toString(),
    })

    // Log activity
    if (teamSession) {
      const sessionData = JSON.parse(teamSession)
      await logActivity({
        entityType: "customer_user",
        entityId: newUser._id.toString(),
        action: "create",
        performedBy: sessionData.userId,
        performedByType: "team",
        newValues: { fullName: full_name, role, customerId },
      })
    }

    return NextResponse.json({
      user: {
        id: newUser._id.toString(),
        full_name: newUser.fullName,
        email: newUser.email,
        mobile_number: newUser.mobileNumber,
        role: newUser.role,
        is_active: newUser.isActive,
        created_at: newUser.createdAt,
      },
      tempPassword,
    }, { status: 201 })
  } catch (error) {
    console.error("[v0] Create customer user error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
