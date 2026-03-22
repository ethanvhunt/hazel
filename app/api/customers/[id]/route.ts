import connectDB from "@/lib/mongodb"
import Customer from "@/models/Customer"
import CustomerUser from "@/models/CustomerUser"
import CustomerProduct from "@/models/CustomerProduct"
import CustomerAgentAssignment from "@/models/CustomerAgentAssignment"
import Ticket from "@/models/Ticket"
import Message from "@/models/Message"
import { logActivity } from "@/lib/activity-logger"
import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { ROLES } from "@/lib/constants"
import mongoose from "mongoose"

async function checkSuperAdminAuth() {
  const cookieStore = await cookies()
  const teamSession = cookieStore.get("team-session")

  if (!teamSession) {
    return null
  }

  try {
    const session = JSON.parse(teamSession.value)
    if (session.role !== ROLES.SUPER_ADMIN) {
      return null
    }
    return session
  } catch {
    return null
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB()
    
    const { id } = await params
    const session = await checkSuperAdminAuth()

    if (!session) {
      return NextResponse.json({ message: "Unauthorized. Only super admin can delete customers." }, { status: 403 })
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ message: "Invalid customer ID" }, { status: 400 })
    }

    const customerToDelete = await Customer.findById(id).lean()

    if (!customerToDelete) {
      return NextResponse.json({ message: "Customer not found" }, { status: 404 })
    }

    // Delete all related data
    const tickets = await Ticket.find({ customer_id: id })
    const ticketIds = tickets.map(t => t._id)
    
    await Message.deleteMany({ ticket_id: { $in: ticketIds } })
    await Ticket.deleteMany({ customer_id: id })
    await CustomerUser.deleteMany({ customer_id: id })
    await CustomerProduct.deleteMany({ customer_id: id })
    await CustomerAgentAssignment.deleteMany({ customer_id: id })
    
    // Delete the customer
    await Customer.findByIdAndDelete(id)

    // Log activity
    await logActivity({
      entityType: "customer",
      entityId: id,
      action: "delete",
      performedBy: session.userId,
      performedByType: "user",
      performedByName: session.fullName,
      oldValues: {
        company_name: (customerToDelete as any).company_name,
        contact_person: (customerToDelete as any).contact_person,
        email: (customerToDelete as any).email,
      },
      details: `Deleted customer ${(customerToDelete as any).company_name}`,
    })

    return NextResponse.json({ message: "Customer deleted successfully" })
  } catch (error) {
    console.error("[v0] Error deleting customer:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB()
    
    const { id } = await params
    const cookieStore = await cookies()
    const teamSession = cookieStore.get("team-session")?.value

    if (!teamSession) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ message: "Invalid customer ID" }, { status: 400 })
    }

    const session = JSON.parse(teamSession)

    let customer
    if (session.role === "agent") {
      // Check if agent is assigned to this customer
      const assignment = await CustomerAgentAssignment.findOne({
        customer_id: id,
        agent_id: session.userId,
      })
      
      if (!assignment) {
        return NextResponse.json({ message: "Customer not found or unauthorized" }, { status: 404 })
      }
      
      customer = await Customer.findById(id).lean()
    } else {
      customer = await Customer.findById(id).lean()
    }

    if (!customer) {
      return NextResponse.json({ message: "Customer not found" }, { status: 404 })
    }

    // Fetch assigned agent
    const assignment = await CustomerAgentAssignment.findOne({ customer_id: id })
      .populate("agent_id", "full_name")
      .lean()

    return NextResponse.json({
      ...customer,
      id: (customer as any)._id.toString(),
      assigned_agent: assignment ? {
        id: (assignment as any).agent_id?._id?.toString(),
        full_name: (assignment as any).agent_id?.full_name,
      } : null,
    })
  } catch (error) {
    console.error("[v0] Error fetching customer:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB()
    
    const { id } = await params
    const cookieStore = await cookies()
    const teamSession = cookieStore.get("team-session")?.value

    if (!teamSession) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ message: "Invalid customer ID" }, { status: 400 })
    }

    const session = JSON.parse(teamSession)
    const { companyName, contactPerson, phone } = await request.json()

    // Fetch current customer
    const currentCustomer = await Customer.findById(id).lean()
    if (!currentCustomer) {
      return NextResponse.json({ message: "Customer not found" }, { status: 404 })
    }

    if (session.role === "agent") {
      const assignment = await CustomerAgentAssignment.findOne({
        customer_id: id,
        agent_id: session.userId,
      })
      if (!assignment) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 403 })
      }
    }

    const updateData: any = {}
    if (companyName) updateData.company_name = companyName
    if (contactPerson) updateData.contact_person = contactPerson
    if (phone !== undefined) updateData.phone = phone

    const updatedCustomer = await Customer.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true }
    ).lean()

    // Log activity
    await logActivity({
      entityType: "customer",
      entityId: id,
      action: "update",
      performedBy: session.userId,
      performedByType: "user",
      performedByName: session.fullName,
      oldValues: {
        company_name: (currentCustomer as any).company_name,
        contact_person: (currentCustomer as any).contact_person,
        phone: (currentCustomer as any).phone,
      },
      newValues: updateData,
      details: `Updated customer ${(updatedCustomer as any).company_name}`,
    })

    return NextResponse.json({
      message: "Customer updated successfully",
      customer: {
        ...updatedCustomer,
        id: (updatedCustomer as any)._id.toString(),
      },
    })
  } catch (error) {
    console.error("[v0] Error updating customer:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
