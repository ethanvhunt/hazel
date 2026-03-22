import { connectToDatabase } from "@/lib/mongodb"
import { User } from "@/models"
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

    await connectToDatabase()

    let query: any = {}
    let users: any[]

    if (session.role === ROLES.AGENT) {
      // Agents cannot view user list
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 })
    } else if (session.role === ROLES.MANAGER) {
      // Managers can only view agents
      query.role = ROLES.AGENT
    } else if (session.role === ROLES.ADMIN) {
      // Admins can view all users except super admins
      query.role = { $ne: ROLES.SUPER_ADMIN }
      if (role && [ROLES.ADMIN, ROLES.MANAGER, ROLES.AGENT].includes(role)) {
        query.role = role
      }
    } else if (session.role === ROLES.SUPER_ADMIN) {
      // Super admins can view all users
      if (role && [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER, ROLES.AGENT].includes(role)) {
        query.role = role
      }
    } else {
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 })
    }

    users = await User.find(query)
      .select("-passwordHash")
      .sort({ createdAt: -1 })
      .lean()

    // Transform for frontend compatibility
    const transformed = users.map((u: any) => ({
      id: u._id.toString(),
      full_name: u.fullName,
      email: u.email,
      role: u.role,
      created_at: u.createdAt,
    }))

    return NextResponse.json(transformed)
  } catch (error) {
    console.error("[v0] Error fetching users:", error)
    return NextResponse.json({ message: "Error fetching users" }, { status: 500 })
  }
}
