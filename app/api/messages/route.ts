import { sql } from "@/lib/db"
import { NextResponse } from "next/server"
import { sendMessageEmail } from "@/lib/email-service"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const ticketId = searchParams.get("ticketId")

    if (!ticketId) {
      return NextResponse.json({ message: "Ticket ID required" }, { status: 400 })
    }

    const messages = await sql`
      SELECT id, ticket_id, sender_type, sender_id, message, created_at
      FROM messages
      WHERE ticket_id = ${ticketId}
      ORDER BY created_at ASC
    `

    return NextResponse.json(messages)
  } catch (error) {
    console.error("Error fetching messages:", error)
    return NextResponse.json({ message: "Error fetching messages" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { ticketId, senderType, senderId, message } = await request.json()

    const result = await sql`
      INSERT INTO messages (ticket_id, sender_type, sender_id, message)
      VALUES (${ticketId}, ${senderType}, ${senderId}, ${message})
      RETURNING *
    `

    if (senderType === "customer") {
      try {
        // Get ticket details
        const ticket = await sql`
          SELECT t.*, c.company_name FROM tickets t
          LEFT JOIN customers c ON t.customer_id = c.id
          WHERE t.id = ${ticketId}
        `

        if (ticket.length > 0) {
          // Get agent's email
          const agent = await sql`
            SELECT full_name, gmail_address FROM users WHERE id = ${ticket[0].agent_id}
          `

          if (agent.length > 0 && agent[0].gmail_address) {
            await sendMessageEmail(
              agent[0].gmail_address,
              ticket[0].company_name || "Customer",
              message,
              ticket[0].title,
              ticketId,
            )
          }
        }
      } catch (emailError) {
        console.error("[v0] Failed to send message email:", emailError)
        // Don't fail the message creation if email fails
      }
    }

    return NextResponse.json(result[0], { status: 201 })
  } catch (error) {
    console.error("Error creating message:", error)
    return NextResponse.json({ message: "Error creating message" }, { status: 500 })
  }
}
