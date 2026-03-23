import connectDB from "@/lib/mongodb"
import Ticket from "@/models/Ticket"
import CustomerUser from "@/models/CustomerUser"
import User from "@/models/User"
import Notification from "@/models/Notification"
import { logActivity } from "@/lib/activity-logger"
import { sendSMS } from "@/lib/sms"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { ROLES, TICKET_STATUS } from "@/lib/constants"
import mongoose from "mongoose"

// POST - Close a ticket (team members or customer_admin)
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB()

    const { id: ticketId } = await params
    const cookieStore = await cookies()
    const teamSession = cookieStore.get("team-session")?.value
    const customerSession = cookieStore.get("customer-session")?.value

    if (!teamSession && !customerSession) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    let performedBy: string
    let performedByType: "user" | "customer_user"
    let performedByName: string

    if (teamSession) {
      const session = JSON.parse(teamSession)
      performedBy = session.userId
      performedByType = "user"
      performedByName = session.fullName || "Team Member"
    } else {
      const session = JSON.parse(customerSession!)
      // Only customer_admin can close tickets
      if (session.role !== "customer_admin") {
        return NextResponse.json({ message: "Only customer admin can close tickets" }, { status: 403 })
      }
      performedBy = session.userId
      performedByType = "customer_user"
      performedByName = session.fullName || "Customer Admin"
    }

    if (!mongoose.Types.ObjectId.isValid(ticketId)) {
      return NextResponse.json({ message: "Invalid ticket ID" }, { status: 400 })
    }

    const { resolution_notes } = await request.json().catch(() => ({}))

    // Get the ticket
    const ticket = await Ticket.findById(ticketId)
      .populate("customer_id", "company_name")
      .populate("created_by_customer_user", "full_name mobile_number")
      .populate("assigned_agent_id", "full_name mobile_number")

    if (!ticket) {
      return NextResponse.json({ message: "Ticket not found" }, { status: 404 })
    }

    // Verify ticket is not already closed
    if (ticket.status === TICKET_STATUS.CLOSED) {
      return NextResponse.json({ message: "Ticket is already closed" }, { status: 400 })
    }

    // Verify customer_admin can only close their company's tickets
    if (customerSession) {
      const session = JSON.parse(customerSession)
      if (ticket.customer_id._id.toString() !== session.customerId) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 403 })
      }
    }

    const oldStatus = ticket.status

    // Update ticket status to closed
    await Ticket.findByIdAndUpdate(ticketId, {
      status: TICKET_STATUS.CLOSED,
      auto_close_at: null,
    })

    // Notify customer who created the ticket (if closed by agent)
    if (performedByType === "user" && ticket.created_by_customer_user) {
      const creator = ticket.created_by_customer_user as any
      if (creator.mobile_number) {
        await sendSMS({
          to: creator.mobile_number,
          message: `Your ticket "${ticket.title}" (${ticket.ticket_number}) has been closed by support.${resolution_notes ? ` Note: ${resolution_notes}` : ""}`,
          type: "general",
          relatedId: ticketId,
        })
      }
      await Notification.create({
        user_id: creator._id,
        user_type: "customer_user",
        event_type: "ticket_closed",
        entity_type: "ticket",
        entity_id: ticket._id,
        title: "Ticket Closed",
        message: `Your ticket "${ticket.title}" has been closed.`,
        read: false,
      })
    }

    // Notify assigned agent (if closed by customer)
    if (performedByType === "customer_user" && ticket.assigned_agent_id) {
      const agent = ticket.assigned_agent_id as any
      if (agent.mobile_number) {
        await sendSMS({
          to: agent.mobile_number,
          message: `Ticket ${ticket.ticket_number} has been closed by the customer.`,
          type: "general",
          relatedId: ticketId,
        })
      }
      await Notification.create({
        user_id: agent._id,
        user_type: "team",
        event_type: "ticket_closed",
        entity_type: "ticket",
        entity_id: ticket._id,
        title: "Ticket Closed by Customer",
        message: `Ticket "${ticket.title}" has been closed by the customer.`,
        read: false,
      })
    }

    // Log activity
    await logActivity({
      entityType: "ticket",
      entityId: ticketId,
      action: "close",
      performedBy,
      performedByType,
      performedByName,
      oldValues: { status: oldStatus },
      newValues: { status: TICKET_STATUS.CLOSED, resolution_notes },
      details: `Closed ticket ${ticket.ticket_number}${resolution_notes ? `: ${resolution_notes}` : ""}`,
    })

    return NextResponse.json({
      message: "Ticket closed successfully",
      status: TICKET_STATUS.CLOSED,
    })
  } catch (error) {
    console.error("[v0] Error closing ticket:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
