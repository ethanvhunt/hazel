import connectDB from "@/lib/mongodb"
import Message from "@/models/Message"
import Ticket from "@/models/Ticket"
import Customer from "@/models/Customer"
import User from "@/models/User"
import CustomerUser from "@/models/CustomerUser"
import Notification from "@/models/Notification"
import { sendMessageEmail } from "@/lib/email-service"
import { sendSMS } from "@/lib/sms"
import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import mongoose from "mongoose"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const ticketId = searchParams.get("ticketId")

    if (!ticketId) {
      return NextResponse.json({ message: "Ticket ID required" }, { status: 400 })
    }

    await connectDB()

    if (!mongoose.Types.ObjectId.isValid(ticketId)) {
      return NextResponse.json({ message: "Invalid ticket ID" }, { status: 400 })
    }

    const messages = await Message.find({ ticket_id: new mongoose.Types.ObjectId(ticketId) })
      .sort({ created_at: 1 })
      .lean()

    // Transform for frontend compatibility
    const transformed = messages.map((m: any) => ({
      id: m._id.toString(),
      ticket_id: m.ticket_id.toString(),
      sender_type: m.sender_type,
      sender_id: m.sender_id.toString(),
      message: m.message,
      attachments: m.attachments || [],
      created_at: m.created_at,
    }))

    return NextResponse.json(transformed)
  } catch (error) {
    console.error("[v0] Error fetching messages:", error)
    return NextResponse.json({ message: "Error fetching messages" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    await connectDB()

    const cookieStore = await cookies()
    const teamSession = cookieStore.get("team-session")?.value
    const customerSession = cookieStore.get("customer-session")?.value

    if (!teamSession && !customerSession) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    let senderType: "customer" | "customer_user" | "agent"
    let senderId: string
    let senderName: string

    if (teamSession) {
      const session = JSON.parse(teamSession)
      senderType = "agent"
      senderId = session.userId
      senderName = session.fullName || "Support Agent"
    } else {
      const session = JSON.parse(customerSession!)
      // Check if customer user or direct customer
      if (session.role === "customer_admin" || session.role === "customer_agent") {
        senderType = "customer_user"
        senderId = session.userId
        senderName = session.fullName || "Customer"
      } else {
        senderType = "customer"
        senderId = session.customerId
        senderName = session.companyName || "Customer"
      }
    }

    const { ticketId, message, attachments } = await request.json()

    if (!ticketId || !message) {
      return NextResponse.json({ message: "Ticket ID and message are required" }, { status: 400 })
    }

    if (!mongoose.Types.ObjectId.isValid(ticketId)) {
      return NextResponse.json({ message: "Invalid ticket ID" }, { status: 400 })
    }

    // Get ticket
    const ticket = await Ticket.findById(ticketId)
      .populate("customer_id", "company_name email")
      .populate("assigned_agent_id", "full_name email gmail_address mobile_number")

    if (!ticket) {
      return NextResponse.json({ message: "Ticket not found" }, { status: 404 })
    }

    // Create message
    const newMessage = await Message.create({
      ticket_id: new mongoose.Types.ObjectId(ticketId),
      sender_type: senderType,
      sender_id: new mongoose.Types.ObjectId(senderId),
      message,
      attachments: attachments || [],
    })

    // Reset auto-close timer (2 hours from now) for open/in_progress tickets
    const now = new Date()
    const autoCloseAt = new Date(now.getTime() + 2 * 60 * 60 * 1000)

    if (ticket.status === "open" || ticket.status === "in_progress") {
      await Ticket.findByIdAndUpdate(ticketId, {
        last_reply_at: now,
        auto_close_at: autoCloseAt,
      })
    }

    // Send notifications based on sender type
    if (senderType === "agent") {
      // Agent replied - notify customer
      if (ticket.created_by_customer_user) {
        const customerUser = await CustomerUser.findById(ticket.created_by_customer_user)
        if (customerUser) {
          // SMS notification
          if (customerUser.mobile_number) {
            await sendSMS({
              to: customerUser.mobile_number,
              message: `New reply on ticket ${ticket.ticket_number}: "${message.substring(0, 100)}${message.length > 100 ? "..." : ""}"`,
              type: "general",
              relatedId: ticketId,
            })
          }
          // Create notification
          await Notification.create({
            user_id: customerUser._id,
            user_type: "customer_user",
            event_type: "ticket_reply",
            entity_type: "ticket",
            entity_id: ticket._id,
            title: `Reply on ticket ${ticket.ticket_number}`,
            message: `Support agent replied to your ticket: "${message.substring(0, 100)}${message.length > 100 ? "..." : ""}"`,
            read: false,
          })
        }
      }
    } else {
      // Customer replied - notify assigned agent
      const agent = ticket.assigned_agent_id as any
      if (agent) {
        // Email notification
        if (agent.gmail_address) {
          await sendMessageEmail(
            agent.gmail_address,
            (ticket.customer_id as any)?.company_name || "Customer",
            message,
            ticket.title,
            ticketId,
          )
        }
        // SMS notification
        if (agent.mobile_number) {
          await sendSMS({
            to: agent.mobile_number,
            message: `Reply on ticket ${ticket.ticket_number} from ${senderName}: "${message.substring(0, 80)}..."`,
            type: "general",
            relatedId: ticketId,
          })
        }
        // Create notification
        await Notification.create({
          user_id: agent._id,
          user_type: "team",
          event_type: "ticket_reply",
          entity_type: "ticket",
          entity_id: ticket._id,
          title: `Customer reply on ${ticket.ticket_number}`,
          message: `${senderName} replied: "${message.substring(0, 100)}${message.length > 100 ? "..." : ""}"`,
          read: false,
        })
      }
    }

    return NextResponse.json({
      id: newMessage._id.toString(),
      ticket_id: newMessage.ticket_id.toString(),
      sender_type: newMessage.sender_type,
      sender_id: newMessage.sender_id.toString(),
      message: newMessage.message,
      attachments: newMessage.attachments,
      created_at: newMessage.created_at,
    }, { status: 201 })
  } catch (error) {
    console.error("[v0] Error creating message:", error)
    return NextResponse.json({ message: "Error creating message" }, { status: 500 })
  }
}
