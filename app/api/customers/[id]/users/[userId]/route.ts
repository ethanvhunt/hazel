import { sql } from "@/lib/db"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { hashPassword } from "@/lib/auth"

// PUT - Update customer user
export async function PUT(request: Request, { params }: { params: Promise<{ id: string; userId: string }> }) {
  try {
    const { id: customerId, userId } = await params
    const cookieStore = await cookies()
    const session = cookieStore.get("session")?.value
    const customerSession = cookieStore.get("customer-session")?.value

    let hasAccess = false
    
    if (session) {
      const sessionData = JSON.parse(session)
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

    let updateQuery
    if (password) {
      const passwordHash = hashPassword(password)
      updateQuery = await sql`
        UPDATE customer_users
        SET 
          full_name = COALESCE(${full_name}, full_name),
          mobile_number = COALESCE(${mobile_number}, mobile_number),
          is_active = COALESCE(${is_active}, is_active),
          password_hash = ${passwordHash},
          updated_at = NOW()
        WHERE id = ${userId} AND customer_id = ${customerId}
        RETURNING id, full_name, email, mobile_number, role, is_active
      `
    } else {
      updateQuery = await sql`
        UPDATE customer_users
        SET 
          full_name = COALESCE(${full_name}, full_name),
          mobile_number = COALESCE(${mobile_number}, mobile_number),
          is_active = COALESCE(${is_active}, is_active),
          updated_at = NOW()
        WHERE id = ${userId} AND customer_id = ${customerId}
        RETURNING id, full_name, email, mobile_number, role, is_active
      `
    }

    if (updateQuery.length === 0) {
      return NextResponse.json({ message: "User not found" }, { status: 404 })
    }

    return NextResponse.json({ user: updateQuery[0] })
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
    const session = cookieStore.get("session")?.value

    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const sessionData = JSON.parse(session)
    
    // Only super_admin can delete users
    if (sessionData.role !== "super_admin") {
      return NextResponse.json({ message: "Only super admin can delete users" }, { status: 403 })
    }

    const user = await sql`
      SELECT * FROM customer_users WHERE id = ${userId} AND customer_id = ${customerId}
    `

    if (user.length === 0) {
      return NextResponse.json({ message: "User not found" }, { status: 404 })
    }

    await sql`DELETE FROM customer_users WHERE id = ${userId}`

    // Log activity
    await sql`
      INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details)
      VALUES (${sessionData.userId}, 'delete', 'customer_user', ${userId}, ${JSON.stringify({ full_name: user[0].full_name, customer_id: customerId })})
    `

    return NextResponse.json({ message: "User deleted successfully" })
  } catch (error) {
    console.error("[v0] Delete customer user error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
