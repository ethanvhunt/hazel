import { sql } from "@/lib/db"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const cookieStore = await cookies()
    const sessionStr = cookieStore.get("customer-session")?.value

    if (!sessionStr) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const session = JSON.parse(sessionStr)
    const customer = await sql`
      SELECT id, email, company_name, contact_person, phone, created_at, updated_at
      FROM customers
      WHERE id = ${session.customerId}
    `

    if (customer.length === 0) {
      return NextResponse.json({ message: "Customer not found" }, { status: 404 })
    }

    return NextResponse.json({ customer: customer[0] })
  } catch (error) {
    console.error("[v0] Get profile error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const cookieStore = await cookies()
    const sessionStr = cookieStore.get("customer-session")?.value

    if (!sessionStr) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const session = JSON.parse(sessionStr)
    const { contactPerson, phone } = await request.json()

    await sql`
      UPDATE customers
      SET contact_person = ${contactPerson}, phone = ${phone}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${session.customerId}
    `

    return NextResponse.json({ success: true, message: "Profile updated" })
  } catch (error) {
    console.error("[v0] Update profile error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
