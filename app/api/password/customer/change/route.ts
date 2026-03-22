import { sql } from "@/lib/db"
import { hashPassword, verifyPassword } from "@/lib/auth"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies()
    const sessionStr = cookieStore.get("customer-session")?.value

    if (!sessionStr) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const session = JSON.parse(sessionStr)
    const { oldPassword, newPassword } = await request.json()

    const customer = await sql`
      SELECT password_hash FROM customers WHERE id = ${session.customerId}
    `

    if (customer.length === 0) {
      return NextResponse.json({ message: "Customer not found" }, { status: 404 })
    }

    if (!verifyPassword(oldPassword, customer[0].password_hash)) {
      return NextResponse.json({ message: "Invalid current password" }, { status: 401 })
    }

    const newHash = hashPassword(newPassword)
    await sql`
      UPDATE customers
      SET password_hash = ${newHash}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${session.customerId}
    `

    return NextResponse.json({ success: true, message: "Password changed successfully" })
  } catch (error) {
    console.error("[v0] Change password error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
