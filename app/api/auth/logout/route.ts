import { NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function POST(request: Request) {
  try {
    const { type } = await request.json()
    const cookieStore = await cookies()

    if (type === "team") {
      cookieStore.delete("team-session")
    } else {
      cookieStore.delete("customer-session")
    }

    return NextResponse.json({ success: true, message: "Logged out successfully" })
  } catch (error) {
    console.error("[v0] Logout error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
