import { sql } from "@/lib/db"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const cookieStore = await cookies()
    const teamSession = cookieStore.get("team-session")?.value

    if (!teamSession) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const session = JSON.parse(teamSession)
    const { userId, role } = session

    let customers

    if (role === "agent") {
      customers = await sql`
        SELECT 
          c.id, 
          c.company_name, 
          c.contact_person, 
          c.email, 
          c.phone, 
          c.created_at,
          caa.agent_id,
          u.full_name as assigned_to
        FROM customers c
        LEFT JOIN customer_agent_assignment caa ON c.id = caa.customer_id
        LEFT JOIN users u ON caa.agent_id = u.id
        WHERE caa.agent_id = ${userId}
        ORDER BY c.created_at DESC
      `
    } else {
      customers = await sql`
        SELECT 
          c.id, 
          c.company_name, 
          c.contact_person, 
          c.email, 
          c.phone, 
          c.created_at,
          caa.agent_id,
          u.full_name as assigned_to
        FROM customers c
        LEFT JOIN customer_agent_assignment caa ON c.id = caa.customer_id
        LEFT JOIN users u ON caa.agent_id = u.id
        ORDER BY c.created_at DESC
      `
    }

    return NextResponse.json(customers)
  } catch (error) {
    console.error("[v0] Error fetching customers:", error)
    return NextResponse.json({ message: "Error fetching customers" }, { status: 500 })
  }
}
