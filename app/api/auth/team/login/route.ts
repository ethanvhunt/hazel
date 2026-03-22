import connectDB from "@/lib/mongodb"
import User from "@/models/User"
import { verifyPassword } from "@/lib/auth"
import { logActivity } from "@/lib/activity-logger"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    await connectDB()
    
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json({ message: "Email and password are required" }, { status: 400 })
    }

    const user = await User.findOne({ email: email.toLowerCase() })

    if (!user) {
      return NextResponse.json({ message: "Invalid credentials" }, { status: 401 })
    }

    if (!user.is_active) {
      return NextResponse.json({ message: "Account is deactivated. Contact your admin." }, { status: 401 })
    }

    if (!verifyPassword(password, user.password_hash)) {
      return NextResponse.json({ message: "Invalid credentials" }, { status: 401 })
    }

    const cookieStore = await cookies()
    cookieStore.set(
      "team-session",
      JSON.stringify({
        userId: user._id.toString(),
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

    // Log the login activity
    await logActivity({
      entityType: "user",
      entityId: user._id,
      action: "login",
      performedBy: user._id,
      performedByType: "user",
      performedByName: user.full_name,
      details: `User ${user.full_name} logged in`,
    })

    return NextResponse.json({
      success: true,
      message: "Login successful",
      user: { id: user._id.toString(), email: user.email, role: user.role },
    })
  } catch (error) {
    console.error("[v0] Team login error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
