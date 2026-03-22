import { sql } from "@/lib/db"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { sendSMS, formatTicketApprovedSMS, formatTicketRejectedSMS } from "@/lib/sms"
import { sendTicketEmail } from "@/lib/email-service"
import { TICKET_STATUS } from "@/lib/constants"

// POST - Approve or reject a ticket (customer_admin only)
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
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

    const { action, rejection_reason } = await request.json()

    if (!["approve", "reject"].includes(action)) {
      return NextResponse.json({ message: "Invalid action. Use 'approve' or 'reject'" }, { status: 400 })
    }

    // Get the ticket
    const ticket = await sql`
      SELECT t.*, c.company_name, p.name as product_name
      FROM tickets t
      LEFT JOIN customers c ON t.customer_id = c.id
      LEFT JOIN products p ON t.product_id = p.id
      WHERE t.id = ${ticketId}
    `

    if (ticket.length === 0) {
      return NextResponse.json({ message: "Ticket not found" }, { status: 404 })
    }

    // Verify ticket belongs to this customer
    if (ticket[0].customer_id !== sessionData.customerId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 })
    }

    // Verify ticket is in pending_approval status
    if (ticket[0].status !== TICKET_STATUS.PENDING_APPROVAL) {
      return NextResponse.json({ message: "Ticket is not pending approval" }, { status: 400 })
    }

    const productName = ticket[0].product_name || "General Inquiry"

    if (action === "approve") {
      // Update ticket status to open
      await sql`
        UPDATE tickets
        SET 
          status = 'open',
          approved_by = ${sessionData.userId},
          approved_at = NOW(),
          updated_at = NOW()
        WHERE id = ${ticketId}
      `

      // Find assigned team agent and notify them
      const assignment = await sql`
        SELECT agent_id FROM customer_agent_assignment 
        WHERE customer_id = ${sessionData.customerId} LIMIT 1
      `

      if (assignment.length > 0 && assignment[0].agent_id) {
        const agent = await sql`
          SELECT id, full_name, gmail_address, mobile_number FROM users WHERE id = ${assignment[0].agent_id}
        `

        if (agent.length > 0) {
          // Send SMS to team agent
          if (agent[0].mobile_number) {
            await sendSMS({
              to: agent[0].mobile_number,
              message: formatTicketApprovedSMS(ticketId.slice(0, 8), productName),
              type: "ticket_approved",
              relatedId: ticketId,
            })
          }

          // Send email
          if (agent[0].gmail_address) {
            await sendTicketEmail(
              agent[0].gmail_address,
              ticket[0].title,
              ticket[0].description,
              ticket[0].company_name,
              ticketId,
            )
          }

          // Create notification for team agent
          await sql`
            INSERT INTO notifications (user_id, user_type, event_type, entity_type, entity_id, title, message, read)
            VALUES (
              ${agent[0].id},
              'team',
              'ticket_approved',
              'ticket',
              ${ticketId},
              'Ticket Approved - ${ticket[0].company_name}',
              'Ticket "${ticket[0].title}" has been approved and is now assigned to you.',
              false
            )
          `

          // Assign ticket to agent
          await sql`
            UPDATE tickets SET assigned_agent_id = ${agent[0].id} WHERE id = ${ticketId}
          `
        }
      }

      // Notify the customer_agent who created the ticket
      if (ticket[0].created_by_customer_user) {
        const creator = await sql`
          SELECT id, full_name, mobile_number FROM customer_users WHERE id = ${ticket[0].created_by_customer_user}
        `
        if (creator.length > 0) {
          if (creator[0].mobile_number) {
            await sendSMS({
              to: creator[0].mobile_number,
              message: `Your ticket "${ticket[0].title}" has been approved and is now being handled by support.`,
              type: "ticket_approved",
              relatedId: ticketId,
            })
          }

          await sql`
            INSERT INTO notifications (user_id, user_type, event_type, entity_type, entity_id, title, message, read)
            VALUES (
              ${creator[0].id},
              'customer_user',
              'ticket_approved',
              'ticket',
              ${ticketId},
              'Ticket Approved',
              'Your ticket "${ticket[0].title}" has been approved.',
              false
            )
          `
        }
      }

      // Log activity
      await sql`
        INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details)
        VALUES (${sessionData.userId}, 'approve', 'ticket', ${ticketId}, ${JSON.stringify({ title: ticket[0].title })})
      `

      return NextResponse.json({ message: "Ticket approved successfully", status: "open" })
    } else {
      // Reject the ticket
      await sql`
        UPDATE tickets
        SET 
          status = 'rejected',
          rejection_reason = ${rejection_reason || null},
          approved_by = ${sessionData.userId},
          approved_at = NOW(),
          updated_at = NOW()
        WHERE id = ${ticketId}
      `

      // Notify the creator
      if (ticket[0].created_by_customer_user) {
        const creator = await sql`
          SELECT id, full_name, mobile_number FROM customer_users WHERE id = ${ticket[0].created_by_customer_user}
        `
        if (creator.length > 0) {
          if (creator[0].mobile_number) {
            await sendSMS({
              to: creator[0].mobile_number,
              message: formatTicketRejectedSMS(ticketId.slice(0, 8), rejection_reason || "No reason provided"),
              type: "ticket_rejected",
              relatedId: ticketId,
            })
          }

          await sql`
            INSERT INTO notifications (user_id, user_type, event_type, entity_type, entity_id, title, message, read)
            VALUES (
              ${creator[0].id},
              'customer_user',
              'ticket_rejected',
              'ticket',
              ${ticketId},
              'Ticket Rejected',
              'Your ticket "${ticket[0].title}" has been rejected. Reason: ${rejection_reason || "Not specified"}',
              false
            )
          `
        }
      }

      // Log activity
      await sql`
        INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details)
        VALUES (${sessionData.userId}, 'reject', 'ticket', ${ticketId}, ${JSON.stringify({ title: ticket[0].title, reason: rejection_reason })})
      `

      return NextResponse.json({ message: "Ticket rejected", status: "rejected" })
    }
  } catch (error) {
    console.error("[v0] Error approving/rejecting ticket:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
