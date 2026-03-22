import connectDB from "@/lib/mongodb"
import Ticket from "@/models/Ticket"
import Notification from "@/models/Notification"
import CustomerUser from "@/models/CustomerUser"
import { logActivity } from "@/lib/activity-logger"
import { sendSMS } from "@/lib/sms"
import { NextResponse } from "next/server"

// This API should be called by a cron job every 15 minutes
// Vercel Cron: Add to vercel.json: { "crons": [{ "path": "/api/cron/auto-close-tickets", "schedule": "*/15 * * * *" }] }
export async function GET(request: Request) {
  try {
    // Verify cron secret for security
    const authHeader = request.headers.get("authorization")
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      // Allow in development
      if (process.env.NODE_ENV === "production") {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
      }
    }

    await connectDB()

    const now = new Date()

    // Find tickets that should be auto-closed
    // - Status is 'open' or 'in_progress'
    // - auto_close_at is set and has passed
    const ticketsToClose = await Ticket.find({
      status: { $in: ["open", "in_progress"] },
      auto_close_at: { $lte: now },
    })
      .populate("customer_id", "company_name")
      .populate("created_by_customer_user", "full_name mobile_number")

    if (ticketsToClose.length === 0) {
      return NextResponse.json({
        message: "No tickets to auto-close",
        closedCount: 0,
      })
    }

    const closedTickets: string[] = []

    for (const ticket of ticketsToClose) {
      // Update ticket status to closed
      await Ticket.findByIdAndUpdate(ticket._id, {
        status: "closed",
        auto_close_at: null,
      })

      closedTickets.push(ticket.ticket_number)

      // Notify the customer who created the ticket
      if (ticket.created_by_customer_user) {
        const creator = ticket.created_by_customer_user as any

        if (creator.mobile_number) {
          await sendSMS({
            to: creator.mobile_number,
            message: `Your ticket "${ticket.title}" (${ticket.ticket_number}) has been automatically closed due to inactivity (2 hours without response).`,
            type: "general",
            relatedId: ticket._id.toString(),
          })
        }

        await Notification.create({
          user_id: creator._id,
          user_type: "customer_user",
          event_type: "ticket_auto_closed",
          entity_type: "ticket",
          entity_id: ticket._id,
          title: "Ticket Auto-Closed",
          message: `Your ticket "${ticket.title}" has been automatically closed due to inactivity.`,
          read: false,
        })
      }

      // Log activity
      await logActivity({
        entityType: "ticket",
        entityId: ticket._id,
        action: "update",
        performedByType: "system",
        performedByName: "Auto-Close System",
        oldValues: { status: ticket.status },
        newValues: { status: "closed" },
        details: `Auto-closed ticket ${ticket.ticket_number} due to 2 hours of inactivity`,
      })
    }

    return NextResponse.json({
      message: `Auto-closed ${closedTickets.length} tickets`,
      closedCount: closedTickets.length,
      tickets: closedTickets,
    })
  } catch (error) {
    console.error("[v0] Error in auto-close cron:", error)
    return NextResponse.json({ message: "Error processing auto-close", error: String(error) }, { status: 500 })
  }
}
