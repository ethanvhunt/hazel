import { sql } from "@/lib/db"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const cookieStore = await cookies()
    const sessionStr = cookieStore.get("team-session")?.value

    if (!sessionStr) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const session = JSON.parse(sessionStr)
    const user = await sql`
      SELECT id, email, full_name, role, created_at, updated_at, gmail_address
      FROM users
      WHERE id = ${session.userId}
    `

    if (user.length === 0) {
      return NextResponse.json({ message: "User not found" }, { status: 404 })
    }

    return NextResponse.json({ user: user[0] })
  } catch (error) {
    console.error("[v0] Get profile error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const cookieStore = await cookies()
    const sessionStr = cookieStore.get("team-session")?.value

    if (!sessionStr) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const session = JSON.parse(sessionStr)
    const { fullName, gmailAddress } = await request.json()

    await sql`
      UPDATE users
      SET full_name = ${fullName}, gmail_address = ${gmailAddress || null}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${session.userId}
    `

    return NextResponse.json({ success: true, message: "Profile updated" })
  } catch (error) {
    console.error("[v0] Update profile error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
