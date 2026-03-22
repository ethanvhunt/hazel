import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const cookieStore = await cookies()
    const teamSession = cookieStore.get("team-session")
    const customerSession = cookieStore.get("customer-session")

    if (teamSession) {
      try {
        const session = JSON.parse(teamSession.value)
        return NextResponse.json({ session, type: "team" })
      } catch {
        return NextResponse.json({ session: null }, { status: 401 })
      }
    }

    if (customerSession) {
      try {
        const session = JSON.parse(customerSession.value)
        return NextResponse.json({ session, type: "customer" })
      } catch {
        return NextResponse.json({ session: null }, { status: 401 })
      }
    }

    return NextResponse.json({ session: null }, { status: 401 })
  } catch (error) {
    console.error("[v0] Session check error:", error)
    return NextResponse.json({ session: null }, { status: 401 })
  }
}
