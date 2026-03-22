import connectDB from "@/lib/mongodb"
import Ticket from "@/models/Ticket"
import Message from "@/models/Message"
import { logActivity } from "@/lib/activity-logger"
import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { ROLES } from "@/lib/constants"
import mongoose from "mongoose"

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB()
    const { id } = await params

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ message: "Invalid ticket ID" }, { status: 400 })
    }

    const ticket = await Ticket.findById(id)
      .populate("customer_id", "company_name email")
      .populate("product_id", "name product_code")
      .populate("assigned_agent_id", "full_name email")
      .lean()

    if (!ticket) {
      return NextResponse.json({ message: "Ticket not found" }, { status: 404 })
    }

    const transformed = {
      ...ticket,
      id: (ticket as any)._id.toString(),
      customer_name: (ticket as any).customer_id?.company_name || null,
      product_name: (ticket as any).product_id?.name || null,
      product_code: (ticket as any).product_id?.product_code || null,
      agent_name: (ticket as any).assigned_agent_id?.full_name || null,
      assigned_to_name: (ticket as any).assigned_agent_id?.full_name || null,
    }

    return NextResponse.json(transformed)
  } catch (error) {
    console.error("[v0] Error fetching ticket:", error)
    return NextResponse.json({ message: "Error fetching ticket", error: String(error) }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB()
    const { id } = await params
    const cookieStore = await cookies()
    const teamSession = cookieStore.get("team-session")
    const customerSession = cookieStore.get("customer-session")

    if (!teamSession && !customerSession) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    let session
    let userType = "team"
    try {
      if (teamSession) {
        session = JSON.parse(teamSession.value)
        userType = "team"
      } else if (customerSession) {
        session = JSON.parse(customerSession.value)
        userType = "customer"
      }
    } catch {
      return NextResponse.json({ message: "Unauthorized - Invalid session" }, { status: 401 })
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ message: "Invalid ticket ID" }, { status: 400 })
    }

    const body = await request.json()
    const { status, agentId, priority } = body

    const currentTicket = await Ticket.findById(id).lean()

    if (!currentTicket) {
      return NextResponse.json({ message: "Ticket not found" }, { status: 404 })
    }

    // Build update object
    const updateData: any = {}
    const oldValues: any = {}
    const newValues: any = {}

    if (status !== undefined) {
      oldValues.status = (currentTicket as any).status
      newValues.status = status
      updateData.status = status

      // Reset auto-close time when status changes
      if (status === "in_progress" || status === "open") {
        updateData.auto_close_at = new Date(Date.now() + 2 * 60 * 60 * 1000)
      } else {
        updateData.auto_close_at = null
      }
    }
    if (agentId !== undefined) {
      oldValues.assigned_agent_id = (currentTicket as any).assigned_agent_id
      newValues.assigned_agent_id = agentId
      updateData.assigned_agent_id = agentId || null
    }
    if (priority !== undefined) {
      oldValues.priority = (currentTicket as any).priority
      newValues.priority = priority
      updateData.priority = priority
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ message: "No updates provided" }, { status: 400 })
    }

    const updatedTicket = await Ticket.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true }
    )
      .populate("customer_id", "company_name email")
      .populate("product_id", "name product_code")
      .populate("assigned_agent_id", "full_name email")

    // Log activity
    await logActivity({
      entityType: "ticket",
      entityId: id,
      action: "update",
      performedBy: session.userId,
      performedByType: userType === "team" ? "user" : "customer_user",
      performedByName: session.fullName || session.companyName,
      oldValues,
      newValues,
      details: `Updated ticket ${(currentTicket as any).ticket_number}`,
    })

    const transformed = {
      ...updatedTicket?.toObject(),
      id: updatedTicket?._id.toString(),
      customer_name: (updatedTicket as any)?.customer_id?.company_name || null,
      product_name: (updatedTicket as any)?.product_id?.name || null,
      product_code: (updatedTicket as any)?.product_id?.product_code || null,
      agent_name: (updatedTicket as any)?.assigned_agent_id?.full_name || null,
      assigned_to_name: (updatedTicket as any)?.assigned_agent_id?.full_name || null,
    }

    return NextResponse.json(transformed)
  } catch (error) {
    console.error("[v0] Error updating ticket:", error)
    return NextResponse.json({ message: "Error updating ticket", error: String(error) }, { status: 500 })
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return PUT(request, { params })
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB()
    const { id } = await params
    const cookieStore = await cookies()
    const teamSession = cookieStore.get("team-session")

    if (!teamSession) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    let session
    try {
      session = JSON.parse(teamSession.value)
    } catch {
      return NextResponse.json({ message: "Unauthorized - Invalid session" }, { status: 401 })
    }

    // Only super_admin can delete tickets
    if (session.role !== ROLES.SUPER_ADMIN) {
      return NextResponse.json({ message: "Unauthorized. Only super admin can delete tickets." }, { status: 403 })
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ message: "Invalid ticket ID" }, { status: 400 })
    }

    // Get ticket data for logging
    const ticket = await Ticket.findById(id).lean()
    if (!ticket) {
      return NextResponse.json({ message: "Ticket not found" }, { status: 404 })
    }

    // Delete related messages first
    await Message.deleteMany({ ticket_id: id })

    // Delete the ticket
    await Ticket.findByIdAndDelete(id)

    // Log activity
    await logActivity({
      entityType: "ticket",
      entityId: id,
      action: "delete",
      performedBy: session.userId,
      performedByType: "user",
      performedByName: session.fullName,
      oldValues: {
        ticket_number: (ticket as any).ticket_number,
        title: (ticket as any).title,
        status: (ticket as any).status,
      },
      details: `Deleted ticket ${(ticket as any).ticket_number}`,
    })

    return NextResponse.json({ message: "Ticket deleted successfully" })
  } catch (error) {
    console.error("Error deleting ticket:", error)
    return NextResponse.json({ message: "Error deleting ticket", error: String(error) }, { status: 500 })
  }
}
