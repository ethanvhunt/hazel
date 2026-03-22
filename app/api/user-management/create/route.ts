import { sql } from "@/lib/db"
import { hashPassword } from "@/lib/auth"
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
    const session = await checkAdminAuth()
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 })
    }

    const { email, password, fullName, role, mobile } = await request.json()

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

    const existingUsers = await sql`
      SELECT id FROM users WHERE email = ${email}
    `

    if (existingUsers.length > 0) {
      return NextResponse.json({ message: "Email already exists" }, { status: 400 })
    }

    const passwordHash = hashPassword(password)

    const result = await sql`
      INSERT INTO users (email, password_hash, full_name, role, mobile)
      VALUES (${email}, ${passwordHash}, ${fullName}, ${role}, ${mobile || null})
      RETURNING id, email, full_name, role, mobile
    `

    await sql`
      INSERT INTO activity_logs (entity_type, entity_id, action, performed_by, old_values, new_values)
      VALUES ('user', ${result[0].id}, 'create', ${session.userId}, '{}', ${JSON.stringify({
        email,
        fullName,
        role,
        mobile: mobile || null,
      })})
    `

    return NextResponse.json({
      message: "User created successfully",
      user: result[0],
    })
  } catch (error) {
    console.error("[v0] Error creating user:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
