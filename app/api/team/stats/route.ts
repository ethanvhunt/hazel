import { connectToDatabase } from "@/lib/mongodb"
import { Customer, Ticket, Product } from "@/models"
import { NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function GET() {
  try {
    const cookieStore = await cookies()
    const teamSession = cookieStore.get("team-session")

    if (!teamSession) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    await connectToDatabase()

    const [
      totalCustomers,
      openTickets,
      inProgressTickets,
      resolvedTickets,
      totalProducts,
    ] = await Promise.all([
      Customer.countDocuments({ isActive: true }),
      Ticket.countDocuments({ status: "open" }),
      Ticket.countDocuments({ status: "in_progress" }),
      Ticket.countDocuments({ status: "resolved" }),
      Product.countDocuments({ status: "active" }),
    ])

    const stats = {
      totalCustomers,
      openTickets,
      inProgressTickets,
      resolvedTickets,
      totalProducts,
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error("[v0] Error fetching stats:", error)
    return NextResponse.json({ message: "Error fetching stats" }, { status: 500 })
  }
}
