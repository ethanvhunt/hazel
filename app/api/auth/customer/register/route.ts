import { sql } from "@/lib/db"
import { hashPassword } from "@/lib/auth"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { email, password, companyName, contactPerson, phone } = await request.json()

    if (!email || !password || !companyName || !contactPerson) {
      return NextResponse.json(
        { message: "Email, password, company name, and contact person are required" },
        { status: 400 },
      )
    }

    if (password.length < 6) {
      return NextResponse.json({ message: "Password must be at least 6 characters" }, { status: 400 })
    }

    const existingCustomers = await sql`
      SELECT id FROM customers WHERE email = ${email}
    `

    if (existingCustomers.length > 0) {
      return NextResponse.json({ message: "Email already exists" }, { status: 400 })
    }

    const passwordHash = hashPassword(password)

    const result = await sql`
      INSERT INTO customers (email, password_hash, company_name, contact_person, phone)
      VALUES (${email}, ${passwordHash}, ${companyName}, ${contactPerson}, ${phone})
      RETURNING id, email, company_name, contact_person
    `

    return NextResponse.json({
      message: "Registration successful",
      customer: result[0],
    })
  } catch (error) {
    console.error("[v0] Registration error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
