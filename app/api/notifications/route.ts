import { connectToDatabase } from "@/lib/mongodb"
import { Ticket, Customer, Notification } from "@/models"
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

    await connectToDatabase()

    let notifications: any[] = []
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)

    if (teamSession) {
      try {
        const session = JSON.parse(teamSession.value)
        
        // Get notifications from notification collection
        const dbNotifications = await Notification.find({
          userId: session.userId,
          userType: "team",
          createdAt: { $gte: twentyFourHoursAgo }
        })
        .sort({ createdAt: -1 })
        .limit(10)
        .lean()

        // Also get recent tickets assigned
        const tickets = await Ticket.find({
          agentId: session.userId,
          createdAt: { $gte: twentyFourHoursAgo }
        })
        .sort({ createdAt: -1 })
        .limit(10)
        .lean()

        for (const ticket of tickets) {
          const customer = await Customer.findById((ticket as any).customerId).lean()
          notifications.push({
            type: "ticket",
            id: (ticket as any)._id.toString(),
            title: (ticket as any).title,
            timestamp: (ticket as any).createdAt,
            source: (customer as any)?.companyName || "Unknown Customer",
          })
        }

        // Add db notifications
        for (const notif of dbNotifications) {
          notifications.push({
            type: (notif as any).type,
            id: (notif as any)._id.toString(),
            title: (notif as any).title,
            message: (notif as any).message,
            timestamp: (notif as any).createdAt,
            read: (notif as any).read,
          })
        }
      } catch (e) {
        console.error("[v0] Error parsing team session:", e)
      }
    }

    if (customerSession) {
      try {
        const session = JSON.parse(customerSession.value)
        
        // Get tickets with recent updates
        const tickets = await Ticket.find({
          customerId: session.customerId,
          updatedAt: { $gte: twentyFourHoursAgo }
        })
        .sort({ updatedAt: -1 })
        .limit(10)
        .lean()

        notifications = tickets.map((t: any) => ({
          type: "ticket",
          id: t._id.toString(),
          title: t.title,
          status: t.status,
          timestamp: t.updatedAt,
        }))
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
