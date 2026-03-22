import { sql } from "@/lib/db"
import { NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function GET() {
  try {
    const cookieStore = await cookies()
    const teamSession = cookieStore.get("team-session")

    if (!teamSession) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const stats = await sql`
      SELECT 
        (SELECT COUNT(*)::int FROM customers) as "totalCustomers",
        (SELECT COUNT(*)::int FROM tickets WHERE status = 'open') as "openTickets",
        (SELECT COUNT(*)::int FROM tickets WHERE status = 'in_progress') as "inProgressTickets",
        (SELECT COUNT(*)::int FROM tickets WHERE status = 'resolved') as "resolvedTickets",
        (SELECT COUNT(*)::int FROM products) as "totalProducts"
    `

    console.log("[v0] Stats data:", stats[0])

    return NextResponse.json(stats[0])
  } catch (error) {
    console.error("[v0] Error fetching stats:", error)
    return NextResponse.json({ message: "Error fetching stats" }, { status: 500 })
  }
}
