import { connectToDatabase } from "@/lib/mongodb"
import { Message, Ticket, Customer, User } from "@/models"
import { NextResponse } from "next/server"
import { sendMessageEmail } from "@/lib/email-service"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const ticketId = searchParams.get("ticketId")

    if (!ticketId) {
      return NextResponse.json({ message: "Ticket ID required" }, { status: 400 })
    }

    await connectToDatabase()

    const messages = await Message.find({ ticketId })
      .sort({ createdAt: 1 })
      .lean()

    // Transform for frontend compatibility
    const transformed = messages.map((m: any) => ({
      id: m._id.toString(),
      ticket_id: m.ticketId,
      sender_type: m.senderType,
      sender_id: m.senderId,
      message: m.message,
      created_at: m.createdAt,
    }))

    return NextResponse.json(transformed)
  } catch (error) {
    console.error("Error fetching messages:", error)
    return NextResponse.json({ message: "Error fetching messages" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { ticketId, senderType, senderId, message } = await request.json()

    await connectToDatabase()

    const newMessage = await Message.create({
      ticketId,
      senderType,
      senderId,
      message,
    })

    // Update ticket's last activity
    await Ticket.findByIdAndUpdate(ticketId, {
      lastActivityAt: new Date(),
      updatedAt: new Date(),
    })

    if (senderType === "customer") {
      try {
        // Get ticket details
        const ticket = await Ticket.findById(ticketId).lean()

        if (ticket) {
          const customer = await Customer.findById((ticket as any).customerId).lean()
          const agent = await User.findById((ticket as any).agentId).lean()

          if (agent && (agent as any).gmailAddress) {
            await sendMessageEmail(
              (agent as any).gmailAddress,
              (customer as any)?.companyName || "Customer",
              message,
              (ticket as any).title,
              ticketId,
            )
          }
        }
      } catch (emailError) {
        console.error("[v0] Failed to send message email:", emailError)
      }
    }

    return NextResponse.json({
      id: newMessage._id.toString(),
      ticket_id: newMessage.ticketId,
      sender_type: newMessage.senderType,
      sender_id: newMessage.senderId,
      message: newMessage.message,
      created_at: newMessage.createdAt,
    }, { status: 201 })
  } catch (error) {
    console.error("Error creating message:", error)
    return NextResponse.json({ message: "Error creating message" }, { status: 500 })
  }
}
