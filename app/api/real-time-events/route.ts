import { connectToDatabase } from "@/lib/mongodb"
import { Ticket, Message, Customer, User } from "@/models"
import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import mongoose from "mongoose"

export async function GET(request: Request) {
  try {
    await connectToDatabase()
    
    const cookieStore = await cookies()
    const teamSession = cookieStore.get("team-session")
    const customerSession = cookieStore.get("customer-session")

    let userId: string | null = null
    let userType: "team" | "customer" | null = null

    if (teamSession) {
      const session = JSON.parse(teamSession.value)
      userId = session.userId
      userType = "team"
    } else if (customerSession) {
      const session = JSON.parse(customerSession.value)
      userId = session.customerId
      userType = "customer"
    }

    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
    const events: any[] = []

    if (userType === "team") {
      // Get recently created tickets
      const recentTickets = await Ticket.find({
        createdAt: { $gte: fiveMinutesAgo },
      })
        .populate("customerId", "companyName")
        .limit(20)
        .lean()

      recentTickets.forEach((ticket: any) => {
        events.push({
          eventType: "ticket_created",
          entityId: ticket._id,
          title: ticket.title,
          description: "New ticket created",
          timestamp: ticket.createdAt,
          fromEntity: ticket.customerId?.companyName || "Unknown",
        })
      })

      // Get recently updated tickets
      const updatedTickets = await Ticket.find({
        updatedAt: { $gte: fiveMinutesAgo },
        $expr: { $ne: ["$createdAt", "$updatedAt"] },
      })
        .populate("customerId", "companyName")
        .limit(20)
        .lean()

      updatedTickets.forEach((ticket: any) => {
        events.push({
          eventType: "ticket_updated",
          entityId: ticket._id,
          title: ticket.title,
          description: `Ticket status: ${ticket.status}`,
          timestamp: ticket.updatedAt,
          fromEntity: ticket.customerId?.companyName || "Unknown",
        })
      })

      // Get recent messages for agent's tickets
      const agentTicketIds = await Ticket.find({
        agentId: new mongoose.Types.ObjectId(userId),
      }).distinct("_id")

      const recentMessages = await Message.find({
        ticketId: { $in: agentTicketIds },
        createdAt: { $gte: fiveMinutesAgo },
      })
        .populate("ticketId", "title")
        .limit(20)
        .lean()

      for (const msg of recentMessages) {
        let fromEntity = "Unknown"
        if (msg.senderType === "customer") {
          const customer = await Customer.findById(msg.senderId).lean()
          fromEntity = (customer as any)?.companyName || "Customer"
        } else {
          const user = await User.findById(msg.senderId).lean()
          fromEntity = (user as any)?.fullName || "Agent"
        }

        events.push({
          eventType: "message_received",
          entityId: msg._id,
          title: (msg.ticketId as any)?.title || "Ticket",
          description: "New message on ticket",
          timestamp: msg.createdAt,
          fromEntity,
        })
      }
    } else if (userType === "customer") {
      // Customer events
      const customerTickets = await Ticket.find({
        customerId: new mongoose.Types.ObjectId(userId),
        updatedAt: { $gte: fiveMinutesAgo },
      })
        .populate("agentId", "fullName")
        .limit(20)
        .lean()

      customerTickets.forEach((ticket: any) => {
        events.push({
          eventType: "ticket_assigned",
          entityId: ticket._id,
          title: ticket.title,
          description: "Ticket assigned to agent",
          timestamp: ticket.updatedAt,
          fromEntity: ticket.agentId?.fullName || "Support Team",
        })
      })

      // Get messages from agents on customer tickets
      const ticketIds = customerTickets.map((t: any) => t._id)
      const agentMessages = await Message.find({
        ticketId: { $in: ticketIds },
        senderType: "agent",
        createdAt: { $gte: fiveMinutesAgo },
      })
        .populate("ticketId", "title")
        .populate("senderId", "fullName")
        .limit(20)
        .lean()

      agentMessages.forEach((msg: any) => {
        events.push({
          eventType: "message_received",
          entityId: msg._id,
          title: msg.ticketId?.title || "Ticket",
          description: "New message from support",
          timestamp: msg.createdAt,
          fromEntity: msg.senderId?.fullName || "Support",
        })
      })
    }

    // Sort events by timestamp
    events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

    return NextResponse.json({ events: events.slice(0, 50), timestamp: new Date().toISOString() })
  } catch (error) {
    console.error("Error fetching real-time events:", error)
    return NextResponse.json({ message: "Error fetching events" }, { status: 500 })
  }
}
