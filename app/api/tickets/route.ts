import connectDB from "@/lib/mongodb"
import Ticket from "@/models/Ticket"
import CustomerUser from "@/models/CustomerUser"
import CustomerAgentAssignment from "@/models/CustomerAgentAssignment"
import User from "@/models/User"
import Customer from "@/models/Customer"
import Notification from "@/models/Notification"
import { getNextSequence } from "@/models/Counter"
import { logActivity } from "@/lib/activity-logger"
import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { ROLES, TICKET_STATUS } from "@/lib/constants"
import { sendTicketEmail } from "@/lib/email-service"
import { sendSMS, formatTicketCreatedSMS, formatTicketApprovedSMS } from "@/lib/sms"
import mongoose from "mongoose"

export async function GET(request: Request) {
  try {
    await connectDB()
    
    const cookieStore = await cookies()
    const teamSession = cookieStore.get("team-session")
    const customerSession = cookieStore.get("customer-session")

    if (!teamSession && !customerSession) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    let sessionData
    let userType = "team"
    
    try {
      if (teamSession) {
        sessionData = JSON.parse(teamSession.value)
        userType = "team"
      } else if (customerSession) {
        sessionData = JSON.parse(customerSession.value)
        userType = "customer"
      }
    } catch {
      return NextResponse.json({ message: "Invalid session" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const customerId = searchParams.get("customerId")
    const agentId = searchParams.get("agentId")
    const status = searchParams.get("status")
    const pendingApproval = searchParams.get("pendingApproval")

    let query: any = {}
    let tickets

    if (userType === "customer") {
      const custId = sessionData.customerId
      query.customer_id = new mongoose.Types.ObjectId(custId)

      if (sessionData.role === "customer_agent") {
        // customer_agent can only see approved/open tickets, not pending_approval (unless they created them)
        if (status) {
          query.status = status
          query.$or = [
            { status: { $ne: "pending_approval" } },
            { created_by_customer_user: new mongoose.Types.ObjectId(sessionData.userId) },
          ]
        } else {
          query.$or = [
            { status: { $ne: "pending_approval" } },
            { created_by_customer_user: new mongoose.Types.ObjectId(sessionData.userId) },
          ]
        }
      } else {
        // customer_admin can see all
        if (pendingApproval === "true") {
          query.status = "pending_approval"
        } else if (status) {
          query.status = status
        }
      }

      tickets = await Ticket.find(query)
        .populate("product_id", "name product_code")
        .populate("customer_id", "company_name")
        .populate("assigned_agent_id", "full_name")
        .populate("created_by_customer_user", "full_name")
        .sort({ created_at: -1 })
        .lean()

    } else if (sessionData.role === ROLES.AGENT) {
      // Team agents only see tickets for assigned customers
      const assignments = await CustomerAgentAssignment.find({ agent_id: sessionData.userId })
      const customerIds = assignments.map((a: any) => a.customer_id)

      if (customerIds.length === 0) {
        return NextResponse.json([])
      }

      query.customer_id = { $in: customerIds }
      query.status = { $nin: ["pending_approval", "rejected"] }

      if (status) {
        query.status = status
      }

      tickets = await Ticket.find(query)
        .populate("product_id", "name product_code")
        .populate("customer_id", "company_name")
        .populate("assigned_agent_id", "full_name")
        .sort({ created_at: -1 })
        .lean()

    } else {
      // Super admin, admin, manager can see all tickets
      if (customerId) {
        query.customer_id = new mongoose.Types.ObjectId(customerId)
      }
      if (agentId) {
        query.assigned_agent_id = new mongoose.Types.ObjectId(agentId)
      }
      if (status) {
        query.status = status
      }

      tickets = await Ticket.find(query)
        .populate("product_id", "name product_code")
        .populate("customer_id", "company_name")
        .populate("assigned_agent_id", "full_name")
        .sort({ created_at: -1 })
        .lean()
    }

    // Transform for frontend
    const transformed = tickets.map((t: any) => ({
      ...t,
      id: t._id.toString(),
      product_name: t.product_id?.name || null,
      product_code: t.product_id?.product_code || null,
      company_name: t.customer_id?.company_name || null,
      assigned_to_name: t.assigned_agent_id?.full_name || null,
      created_by_name: t.created_by_customer_user?.full_name || null,
    }))

    return NextResponse.json(transformed)
  } catch (error) {
    console.error("[v0] Error fetching tickets:", error)
    return NextResponse.json({ message: "Error fetching tickets" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    await connectDB()
    
    const cookieStore = await cookies()
    const customerSession = cookieStore.get("customer-session")

    if (!customerSession) {
      return NextResponse.json({ message: "Unauthorized. Please login." }, { status: 401 })
    }

    let sessionData
    try {
      sessionData = JSON.parse(customerSession.value)
    } catch {
      return NextResponse.json({ message: "Invalid session. Please login again." }, { status: 401 })
    }

    const { productId, title, description, priority } = await request.json()

    if (!title || !description) {
      return NextResponse.json(
        { message: "Missing required fields. Title and description are required." },
        { status: 400 },
      )
    }

    const customerId = sessionData.customerId
    const isCustomerUser = sessionData.role === "customer_agent" || sessionData.role === "customer_admin"
    const customerUserId = isCustomerUser ? sessionData.userId : null
    
    // Determine initial status based on who creates the ticket
    const initialStatus = sessionData.role === "customer_agent" ? TICKET_STATUS.PENDING_APPROVAL : TICKET_STATUS.OPEN

    // Generate ticket number
    const ticketNum = await getNextSequence("ticket_number")
    const ticketNumber = `TKT-${String(ticketNum).padStart(6, "0")}`

    // Set auto-close time (2 hours from creation for open tickets)
    const autoCloseAt = initialStatus === TICKET_STATUS.OPEN ? new Date(Date.now() + 2 * 60 * 60 * 1000) : undefined

    const ticket = await Ticket.create({
      ticket_number: ticketNumber,
      customer_id: customerId,
      product_id: productId || null,
      title,
      description,
      priority: priority || "medium",
      status: initialStatus,
      created_by_customer_user: customerUserId,
      auto_close_at: autoCloseAt,
    })

    // Get customer info
    const customer = await Customer.findById(customerId)

    // Get product info if exists
    let productName = "General Inquiry"
    let productCode = ""
    if (productId) {
      const Product = (await import("@/models/Product")).default
      const product = await Product.findById(productId)
      if (product) {
        productName = product.name
        productCode = product.product_code
      }
    }

    // Log activity
    await logActivity({
      entityType: "ticket",
      entityId: ticket._id,
      action: "create",
      performedBy: customerUserId || customerId,
      performedByType: isCustomerUser ? "customer_user" : "customer",
      performedByName: sessionData.fullName || sessionData.companyName,
      newValues: { ticket_number: ticketNumber, title, status: initialStatus },
      details: `Created ticket ${ticketNumber}: ${title}`,
    })

    if (initialStatus === TICKET_STATUS.PENDING_APPROVAL) {
      // SMS notification to customer_admin for approval
      const customerAdmins = await CustomerUser.find({
        customer_id: customerId,
        role: "customer_admin",
        is_active: true,
      })

      for (const admin of customerAdmins) {
        if (admin.mobile_number) {
          await sendSMS({
            to: admin.mobile_number,
            message: formatTicketCreatedSMS(
              ticketNumber,
              productCode ? `${productCode} - ${productName}` : productName,
              sessionData.fullName || "Agent"
            ),
            type: "ticket_created",
            relatedId: ticket._id.toString(),
          })
        }

        // Create notification
        await Notification.create({
          user_id: admin._id,
          user_type: "customer_user",
          event_type: "ticket_pending_approval",
          entity_type: "ticket",
          entity_id: ticket._id,
          title: "New Ticket Pending Approval",
          message: `A new ticket "${title}" requires your approval.`,
          read: false,
        })
      }

      return NextResponse.json({
        ...ticket.toObject(),
        id: ticket._id.toString(),
        message: "Ticket submitted for approval. Your customer admin will be notified via SMS.",
      }, { status: 201 })
    } else {
      // Direct ticket - notify team agent
      const assignment = await CustomerAgentAssignment.findOne({ customer_id: customerId })

      if (assignment && assignment.agent_id) {
        try {
          const agent = await User.findById(assignment.agent_id)

          if (agent) {
            // Send email if available
            if (agent.gmail_address) {
              await sendTicketEmail(
                agent.gmail_address,
                title,
                description,
                customer?.company_name || "Customer",
                ticket._id.toString(),
              )
            }

            // Send SMS if mobile available
            if (agent.mobile_number) {
              await sendSMS({
                to: agent.mobile_number,
                message: `New ticket from ${customer?.company_name}: ${title}. ID: ${ticketNumber}`,
                type: "ticket_created",
                relatedId: ticket._id.toString(),
              })
            }

            // Update ticket with assigned agent
            await Ticket.findByIdAndUpdate(ticket._id, { assigned_agent_id: agent._id })

            // Create notification
            await Notification.create({
              user_id: agent._id,
              user_type: "team",
              event_type: "ticket_created",
              entity_type: "ticket",
              entity_id: ticket._id,
              title: `New Ticket from ${customer?.company_name || "Customer"}`,
              message: `Customer ${customer?.company_name || "Customer"} created a new ticket: ${title}`,
              read: false,
            })
          }
        } catch (emailError) {
          console.error("[v0] Failed to send ticket notifications:", emailError)
        }
      }

      return NextResponse.json({
        ...ticket.toObject(),
        id: ticket._id.toString(),
        message: "Ticket created successfully",
      }, { status: 201 })
    }
  } catch (error) {
    console.error("[v0] Error creating ticket:", error)
    return NextResponse.json({ message: "Error creating ticket" }, { status: 500 })
  }
}
