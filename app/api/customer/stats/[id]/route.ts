import { sql } from "@/lib/db"
import { NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params

    const cookieStore = cookies()
    const customerSession = cookieStore.get("customer-session")

    if (!customerSession) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    try {
      const session = JSON.parse(customerSession.value)
      if (session.customerId !== id) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 403 })
      }
    } catch {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const stats = await sql.query(
      `
      SELECT 
        (SELECT COUNT(*)::int FROM products WHERE customer_id = $1) as "totalProducts",
        (SELECT COUNT(*)::int FROM tickets WHERE customer_id = $1 AND status = $2) as "openTickets",
        (SELECT COUNT(*)::int FROM tickets WHERE customer_id = $1 AND status = $3) as "resolvedTickets"
    `,
      [id, "open", "resolved"],
    )

    if (!stats || stats.length === 0) {
      return NextResponse.json({
        totalProducts: 0,
        openTickets: 0,
        resolvedTickets: 0,
      })
    }

    return NextResponse.json(stats[0])
  } catch (error) {
    console.error("[v0] Error fetching customer stats:", error)
    return NextResponse.json(
      {
        totalProducts: 0,
        openTickets: 0,
        resolvedTickets: 0,
      },
      { status: 200 },
    )
  }
}
