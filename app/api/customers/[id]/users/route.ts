import connectDB from "@/lib/mongodb"
import CustomerUser from "@/models/CustomerUser"
import { logActivity } from "@/lib/activity-logger"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { hashPassword } from "@/lib/auth"
import { sendSMS, formatNewUserSMS } from "@/lib/sms"
import mongoose from "mongoose"

// GET all users for a customer
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB()
    
    const { id: customerId } = await params
    const cookieStore = await cookies()
    const teamSession = cookieStore.get("team-session")?.value
    const customerSession = cookieStore.get("customer-session")?.value

    if (!mongoose.Types.ObjectId.isValid(customerId)) {
      return NextResponse.json({ message: "Invalid customer ID" }, { status: 400 })
    }

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

    const users = await CustomerUser.find({ customer_id: new mongoose.Types.ObjectId(customerId) })
      .select("-password_hash")
      .sort({ created_at: -1 })
      .lean()

    // Transform for frontend compatibility
    const transformed = users.map((u: any) => ({
      id: u._id.toString(),
      full_name: u.full_name,
      email: u.email,
      mobile_number: u.mobile_number,
      role: u.role,
      is_active: u.is_active,
      created_at: u.created_at,
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
    await connectDB()
    
    const { id: customerId } = await params
    const cookieStore = await cookies()
    const teamSession = cookieStore.get("team-session")?.value
    const customerSession = cookieStore.get("customer-session")?.value

    if (!mongoose.Types.ObjectId.isValid(customerId)) {
      return NextResponse.json({ message: "Invalid customer ID" }, { status: 400 })
    }

    let performedBy: string | null = null
    let performedByType: "user" | "customer_user" = "user"
    let performedByName: string = ""
    let hasAccess = false
    
    // Team members can create users
    if (teamSession) {
      const sessionData = JSON.parse(teamSession)
      if (["super_admin", "admin", "manager"].includes(sessionData.role)) {
        hasAccess = true
        performedBy = sessionData.userId
        performedByType = "user"
        performedByName = sessionData.fullName
      }
    }
    
    // customer_admin can create customer_agent users
    if (customerSession) {
      const custSessionData = JSON.parse(customerSession)
      if (custSessionData.customerId === customerId && custSessionData.role === "customer_admin") {
        hasAccess = true
        performedBy = custSessionData.userId
        performedByType = "customer_user"
        performedByName = custSessionData.fullName
      }
    }

    if (!hasAccess) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const { full_name, email, mobile_number, role, password } = await request.json()

    if (!full_name || !email || !mobile_number || !role) {
      return NextResponse.json({ message: "Full name, email, mobile number, and role are required" }, { status: 400 })
    }

    // Validate mobile number format (basic check)
    const phoneRegex = /^\+?[\d\s-]{10,}$/
    if (!phoneRegex.test(mobile_number)) {
      return NextResponse.json({ message: "Please enter a valid mobile number" }, { status: 400 })
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

    // Check if email already exists for this customer
    const existing = await CustomerUser.findOne({
      customer_id: new mongoose.Types.ObjectId(customerId),
      email: email.toLowerCase(),
    })
    if (existing) {
      return NextResponse.json({ message: "Email already exists for this customer" }, { status: 400 })
    }

    // Generate temporary password if not provided
    const tempPassword = password || Math.random().toString(36).slice(-8)
    const passwordHash = hashPassword(tempPassword)

    const newUser = await CustomerUser.create({
      customer_id: new mongoose.Types.ObjectId(customerId),
      full_name,
      email: email.toLowerCase(),
      mobile_number,
      password_hash: passwordHash,
      role,
      is_active: true,
    })

    // Send SMS with credentials
    await sendSMS({
      to: mobile_number,
      message: formatNewUserSMS(full_name, tempPassword),
      type: "user_created",
      relatedId: newUser._id.toString(),
    })

    // Log activity
    await logActivity({
      entityType: "customer_user",
      entityId: newUser._id,
      action: "create",
      performedBy: performedBy || undefined,
      performedByType,
      performedByName,
      newValues: { full_name, role, email },
      details: `Created customer user ${full_name} with role ${role}`,
    })

    return NextResponse.json({
      user: {
        id: newUser._id.toString(),
        full_name: newUser.full_name,
        email: newUser.email,
        mobile_number: newUser.mobile_number,
        role: newUser.role,
        is_active: newUser.is_active,
        created_at: newUser.created_at,
      },
      tempPassword,
    }, { status: 201 })
  } catch (error) {
    console.error("[v0] Create customer user error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
