import { sql } from "@/lib/db"
import { NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies()
    const teamSession = cookieStore.get("team-session")
    const customerSession = cookieStore.get("customer-session")

    if (!teamSession && !customerSession) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    let notifications: any[] = []

    if (teamSession) {
      try {
        const session = JSON.parse(teamSession.value)
        // Get notifications for team members (new tickets assigned, messages, etc.)
        notifications = await sql`
          SELECT 
            'ticket' as type,
            t.id,
            t.title,
            t.created_at as timestamp,
            c.company_name as source
          FROM tickets t
          JOIN customers c ON t.customer_id = c.id
          WHERE t.agent_id = ${session.userId}
          AND t.created_at > NOW() - INTERVAL '24 hours'
          ORDER BY t.created_at DESC
          LIMIT 10
        `
      } catch (e) {
        console.error("[v0] Error parsing team session:", e)
      }
    }

    if (customerSession) {
      try {
        const session = JSON.parse(customerSession.value)
        // Get notifications for customers (ticket updates, messages, etc.)
        notifications = await sql`
          SELECT 
            'ticket' as type,
            t.id,
            t.title,
            t.status,
            t.updated_at as timestamp
          FROM tickets t
          WHERE t.customer_id = ${session.customerId}
          AND t.updated_at > NOW() - INTERVAL '24 hours'
          ORDER BY t.updated_at DESC
          LIMIT 10
        `
      } catch (e) {
        console.error("[v0] Error parsing customer session:", e)
      }
    }

    return NextResponse.json(notifications)
  } catch (error) {
    console.error("[v0] Error fetching notifications:", error)
    return NextResponse.json({ message: "Error fetching notifications" }, { status: 500 })
  }
}
