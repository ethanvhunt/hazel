import { connectToDatabase } from "@/lib/mongodb"
import { CustomerProduct, Ticket } from "@/models"
import { NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    const cookieStore = await cookies()
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

    await connectToDatabase()

    const [totalProducts, openTickets, resolvedTickets] = await Promise.all([
      CustomerProduct.countDocuments({ customerId: id, isActive: true }),
      Ticket.countDocuments({ customerId: id, status: "open" }),
      Ticket.countDocuments({ customerId: id, status: "resolved" }),
    ])

    return NextResponse.json({
      totalProducts,
      openTickets,
      resolvedTickets,
    })
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
