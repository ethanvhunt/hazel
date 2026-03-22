import { sql } from "@/lib/db"
import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { ROLES } from "@/lib/constants"

async function checkTeamAuth() {
  const cookieStore = await cookies()
  const teamSession = cookieStore.get("team-session")

  if (!teamSession) {
    return null
  }

  try {
    const session = JSON.parse(teamSession.value)
    return session
  } catch {
    return null
  }
}

export async function GET(request: Request) {
  try {
    const session = await checkTeamAuth()
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const role = searchParams.get("role")

    let users

    if (session.role === ROLES.AGENT) {
      // Agents cannot view user list
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 })
    } else if (session.role === ROLES.MANAGER) {
      // Managers can only view agents
      if (role && role === ROLES.AGENT) {
        users = await sql`
          SELECT id, full_name, email, role, created_at
          FROM users
          WHERE role = ${ROLES.AGENT}
          ORDER BY created_at DESC
        `
      } else {
        users = await sql`
          SELECT id, full_name, email, role, created_at
          FROM users
          WHERE role = ${ROLES.AGENT}
          ORDER BY created_at DESC
        `
      }
    } else if (session.role === ROLES.ADMIN) {
      // Admins can view all users except super admins
      if (role && [ROLES.ADMIN, ROLES.MANAGER, ROLES.AGENT].includes(role)) {
        users = await sql`
          SELECT id, full_name, email, role, created_at
          FROM users
          WHERE role != ${ROLES.SUPER_ADMIN} AND role = ${role}
          ORDER BY created_at DESC
        `
      } else {
        users = await sql`
          SELECT id, full_name, email, role, created_at
          FROM users
          WHERE role != ${ROLES.SUPER_ADMIN}
          ORDER BY created_at DESC
        `
      }
    } else if (session.role === ROLES.SUPER_ADMIN) {
      // Super admins can view all users
      if (role && [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER, ROLES.AGENT].includes(role)) {
        users = await sql`
          SELECT id, full_name, email, role, created_at
          FROM users
          WHERE role = ${role}
          ORDER BY created_at DESC
        `
      } else {
        users = await sql`
          SELECT id, full_name, email, role, created_at
          FROM users
          ORDER BY created_at DESC
        `
      }
    } else {
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 })
    }

    return NextResponse.json(users)
  } catch (error) {
    console.error("[v0] Error fetching users:", error)
    return NextResponse.json({ message: "Error fetching users" }, { status: 500 })
  }
}
