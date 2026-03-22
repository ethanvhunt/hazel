import { sql } from "@/lib/db"
import { NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies()
    const teamSession = cookieStore.get("team-session")
    const customerSession = cookieStore.get("customer-session")

    let userId: string | null = null
    let userType: "team" | "customer" | null = null

    if (teamSession) {
      try {
        const session = JSON.parse(teamSession.value)
        userId = session.userId // Correct property name
        userType = "team"
      } catch (e) {
        console.error("[v0] Error parsing team session:", e)
        return NextResponse.json({ message: "Invalid session" }, { status: 401 })
      }
    } else if (customerSession) {
      try {
        const session = JSON.parse(customerSession.value)
        userId = session.customerId // Correct property name
        userType = "customer"
      } catch (e) {
        console.error("[v0] Error parsing customer session:", e)
        return NextResponse.json({ message: "Invalid session" }, { status: 401 })
      }
    }

    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const limit = Number.parseInt(searchParams.get("limit") || "50")

    const notifications = await sql`
      SELECT 
        id,
        user_id,
        user_type,
        event_type,
        entity_type,
        entity_id,
        title,
        message,
        read,
        created_at
      FROM notifications
      WHERE user_id = ${userId}::uuid
      AND read = false
      ORDER BY created_at DESC
      LIMIT ${limit}
    `

    return NextResponse.json(notifications)
  } catch (error) {
    console.error("[v0] Error fetching notifications:", error)
    return NextResponse.json({ message: "Error fetching notifications" }, { status: 500 })
  }
}
