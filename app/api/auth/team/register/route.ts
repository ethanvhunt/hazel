import { sql } from "@/lib/db"
import { hashPassword } from "@/lib/auth"
import { NextResponse } from "next/server"
import { ROLES } from "@/lib/constants"

export async function POST(request: Request) {
  try {
    const { email, password, fullName, role } = await request.json()

    const validRoles = [ROLES.AGENT, ROLES.MANAGER, ROLES.ADMIN, ROLES.SUPER_ADMIN]
    if (!validRoles.includes(role)) {
      return NextResponse.json({ message: "Invalid role" }, { status: 400 })
    }

    // Validate password strength
    if (password.length < 6) {
      return NextResponse.json({ message: "Password must be at least 6 characters" }, { status: 400 })
    }

    const existingUsers = await sql`
      SELECT id FROM users WHERE email = ${email}
    `

    if (existingUsers.length > 0) {
      return NextResponse.json({ message: "Email already exists" }, { status: 400 })
    }

    const passwordHash = hashPassword(password)

    const result = await sql`
      INSERT INTO users (email, password_hash, full_name, role)
      VALUES (${email}, ${passwordHash}, ${fullName}, ${role})
      RETURNING id, email, role, full_name
    `

    return NextResponse.json({
      message: "Registration successful",
      user: result[0],
    })
  } catch (error) {
    console.error("[v0] Registration error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
