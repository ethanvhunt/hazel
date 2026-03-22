import { sql } from "@/lib/db"
import { hashPassword } from "@/lib/auth"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { ROLES } from "@/lib/constants"

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

    // Check if customer exists
    const customer = await sql`
      SELECT id FROM customers WHERE id = ${customerId}
    `

    if (customer.length === 0) {
      return NextResponse.json({ message: "Customer not found" }, { status: 404 })
    }

    // Update customer password
    const newHash = hashPassword(newPassword)
    await sql`
      UPDATE customers
      SET password_hash = ${newHash}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${customerId}
    `

    // Log the action
    await sql`
      INSERT INTO activity_logs (entity_type, entity_id, action, performed_by)
      VALUES ('customer', ${customerId}, 'update', ${session.userId})
    `

    return NextResponse.json({ success: true, message: "Customer password reset successfully" })
  } catch (error) {
    console.error("[v0] Admin reset password error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
