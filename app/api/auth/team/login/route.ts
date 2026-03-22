import { sql } from "@/lib/db"
import { verifyPassword } from "@/lib/auth"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json({ message: "Email and password are required" }, { status: 400 })
    }

    const users = await sql`
      SELECT id, email, password_hash, role, full_name
      FROM users
      WHERE email = ${email}
    `

    if (users.length === 0) {
      return NextResponse.json({ message: "Invalid credentials" }, { status: 401 })
    }

    const user = users[0]

    if (!verifyPassword(password, user.password_hash)) {
      return NextResponse.json({ message: "Invalid credentials" }, { status: 401 })
    }

    const cookieStore = await cookies()
    cookieStore.set(
      "team-session",
      JSON.stringify({
        userId: user.id,
        email: user.email,
        role: user.role,
        fullName: user.full_name,
      }),
      {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 7 * 24 * 60 * 60,
      },
    )

    return NextResponse.json({
      success: true,
      message: "Login successful",
      user: { id: user.id, email: user.email, role: user.role },
    })
  } catch (error) {
    console.error("[v0] Team login error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
