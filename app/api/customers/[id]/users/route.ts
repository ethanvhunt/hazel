import { sql } from "@/lib/db"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { hashPassword } from "@/lib/auth"
import { sendSMS, formatNewUserSMS } from "@/lib/sms"

// GET all users for a customer
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: customerId } = await params
    const cookieStore = await cookies()
    const session = cookieStore.get("session")?.value
    const customerSession = cookieStore.get("customer-session")?.value

    // Team members or customer_admin can view users
    let hasAccess = false
    
    if (session) {
      const sessionData = JSON.parse(session)
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

    const users = await sql`
      SELECT id, full_name, email, mobile_number, role, is_active, created_at
      FROM customer_users
      WHERE customer_id = ${customerId}
      ORDER BY created_at DESC
    `

    return NextResponse.json(users)
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
    const session = cookieStore.get("session")?.value
    const customerSession = cookieStore.get("customer-session")?.value

    let createdBy: string | null = null
    let hasAccess = false
    
    // Team members can create users
    if (session) {
      const sessionData = JSON.parse(session)
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

    // Check if email already exists
    const existing = await sql`
      SELECT id FROM customer_users WHERE email = ${email}
    `
    if (existing.length > 0) {
      return NextResponse.json({ message: "Email already exists" }, { status: 400 })
    }

    // Generate temporary password if not provided
    const tempPassword = password || Math.random().toString(36).slice(-8)
    const passwordHash = hashPassword(tempPassword)

    const result = await sql`
      INSERT INTO customer_users (customer_id, full_name, email, mobile_number, password_hash, role, created_by)
      VALUES (${customerId}, ${full_name}, ${email}, ${mobile_number}, ${passwordHash}, ${role}, ${createdBy})
      RETURNING id, full_name, email, mobile_number, role, is_active, created_at
    `

    // Send SMS with credentials
    await sendSMS({
      to: mobile_number,
      message: formatNewUserSMS(full_name, tempPassword),
      type: "user_created",
      relatedId: result[0].id,
    })

    // Log activity
    if (session) {
      const sessionData = JSON.parse(session)
      await sql`
        INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details)
        VALUES (${sessionData.userId}, 'create', 'customer_user', ${result[0].id}, ${JSON.stringify({ full_name, role, customer_id: customerId })})
      `
    }

    return NextResponse.json({ user: result[0], tempPassword }, { status: 201 })
  } catch (error) {
    console.error("[v0] Create customer user error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
