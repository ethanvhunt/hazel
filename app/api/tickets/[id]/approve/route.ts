import connectDB from "@/lib/mongodb"
import Ticket from "@/models/Ticket"
import CustomerUser from "@/models/CustomerUser"
import CustomerAgentAssignment from "@/models/CustomerAgentAssignment"
import User from "@/models/User"
import Notification from "@/models/Notification"
import { logActivity } from "@/lib/activity-logger"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { sendSMS, formatTicketApprovedSMS, formatTicketRejectedSMS } from "@/lib/sms"
import { sendTicketEmail } from "@/lib/email-service"
import { TICKET_STATUS } from "@/lib/constants"
import mongoose from "mongoose"

// POST - Approve or reject a ticket (customer_admin only)
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB()
    
    const { id: ticketId } = await params
    const cookieStore = await cookies()
    const customerSession = cookieStore.get("customer-session")?.value

    if (!customerSession) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const sessionData = JSON.parse(customerSession)

    // Only customer_admin can approve tickets
    if (sessionData.role !== "customer_admin") {
      return NextResponse.json({ message: "Only customer admin can approve tickets" }, { status: 403 })
    }

    if (!mongoose.Types.ObjectId.isValid(ticketId)) {
      return NextResponse.json({ message: "Invalid ticket ID" }, { status: 400 })
    }

    const { action, rejection_reason } = await request.json()

    if (!["approve", "reject"].includes(action)) {
      return NextResponse.json({ message: "Invalid action. Use 'approve' or 'reject'" }, { status: 400 })
    }

    // Get the ticket
    const ticket = await Ticket.findById(ticketId)
      .populate("customer_id", "company_name")
      .populate("product_id", "name product_code")
      .lean()

    if (!ticket) {
      return NextResponse.json({ message: "Ticket not found" }, { status: 404 })
    }

    // Verify ticket belongs to this customer
    if ((ticket as any).customer_id._id.toString() !== sessionData.customerId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 })
    }

    // Verify ticket is in pending_approval status
    if ((ticket as any).status !== TICKET_STATUS.PENDING_APPROVAL) {
      return NextResponse.json({ message: "Ticket is not pending approval" }, { status: 400 })
    }

    const productName = (ticket as any).product_id?.name || "General Inquiry"
    const ticketNumber = (ticket as any).ticket_number

    if (action === "approve") {
      // Update ticket status to open with auto-close time (2 hours)
      const autoCloseAt = new Date(Date.now() + 2 * 60 * 60 * 1000)
      
      await Ticket.findByIdAndUpdate(ticketId, {
        status: "open",
        customer_admin_approved: true,
        customer_admin_approved_by: sessionData.userId,
        customer_admin_approved_at: new Date(),
        auto_close_at: autoCloseAt,
      })

      // Find assigned team agent and notify them
      const assignment = await CustomerAgentAssignment.findOne({ customer_id: sessionData.customerId })

      if (assignment && assignment.agent_id) {
        const agent = await User.findById(assignment.agent_id)

        if (agent) {
          // Send SMS to team agent
          if (agent.mobile_number) {
            await sendSMS({
              to: agent.mobile_number,
              message: formatTicketApprovedSMS(ticketNumber, productName),
              type: "ticket_approved",
              relatedId: ticketId,
            })
          }

          // Send email
          if (agent.gmail_address) {
            await sendTicketEmail(
              agent.gmail_address,
              (ticket as any).title,
              (ticket as any).description,
              (ticket as any).customer_id.company_name,
              ticketId,
            )
          }

          // Create notification for team agent
          await Notification.create({
            user_id: agent._id,
            user_type: "team",
            event_type: "ticket_approved",
            entity_type: "ticket",
            entity_id: ticketId,
            title: `Ticket Approved - ${(ticket as any).customer_id.company_name}`,
            message: `Ticket "${(ticket as any).title}" has been approved and is now assigned to you.`,
            read: false,
          })

          // Assign ticket to agent
          await Ticket.findByIdAndUpdate(ticketId, { assigned_agent_id: agent._id })
        }
      }

      // Notify the customer_agent who created the ticket
      if ((ticket as any).created_by_customer_user) {
        const creator = await CustomerUser.findById((ticket as any).created_by_customer_user)
        
        if (creator) {
          if (creator.mobile_number) {
            await sendSMS({
              to: creator.mobile_number,
              message: `Your ticket "${(ticket as any).title}" has been approved and is now being handled by support.`,
              type: "ticket_approved",
              relatedId: ticketId,
            })
          }

          await Notification.create({
            user_id: creator._id,
            user_type: "customer_user",
            event_type: "ticket_approved",
            entity_type: "ticket",
            entity_id: ticketId,
            title: "Ticket Approved",
            message: `Your ticket "${(ticket as any).title}" has been approved.`,
            read: false,
          })
        }
      }

      // Log activity
      await logActivity({
        entityType: "ticket",
        entityId: ticketId,
        action: "approve",
        performedBy: sessionData.userId,
        performedByType: "customer_user",
        performedByName: sessionData.fullName,
        newValues: { status: "open" },
        details: `Approved ticket ${ticketNumber}`,
      })

      return NextResponse.json({ message: "Ticket approved successfully", status: "open" })
    } else {
      // Reject the ticket
      await Ticket.findByIdAndUpdate(ticketId, {
        status: "rejected",
        rejection_reason: rejection_reason || null,
        customer_admin_approved_by: sessionData.userId,
        customer_admin_approved_at: new Date(),
      })

      // Notify the creator
      if ((ticket as any).created_by_customer_user) {
        const creator = await CustomerUser.findById((ticket as any).created_by_customer_user)
        
        if (creator) {
          if (creator.mobile_number) {
            await sendSMS({
              to: creator.mobile_number,
              message: formatTicketRejectedSMS(ticketNumber, rejection_reason || "No reason provided"),
              type: "ticket_rejected",
              relatedId: ticketId,
            })
          }

          await Notification.create({
            user_id: creator._id,
            user_type: "customer_user",
            event_type: "ticket_rejected",
            entity_type: "ticket",
            entity_id: ticketId,
            title: "Ticket Rejected",
            message: `Your ticket "${(ticket as any).title}" has been rejected. Reason: ${rejection_reason || "Not specified"}`,
            read: false,
          })
        }
      }

      // Log activity
      await logActivity({
        entityType: "ticket",
        entityId: ticketId,
        action: "reject",
        performedBy: sessionData.userId,
        performedByType: "customer_user",
        performedByName: sessionData.fullName,
        newValues: { status: "rejected", rejection_reason },
        details: `Rejected ticket ${ticketNumber}: ${rejection_reason || "No reason"}`,
      })

      return NextResponse.json({ message: "Ticket rejected", status: "rejected" })
    }
  } catch (error) {
    console.error("[v0] Error approving/rejecting ticket:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
