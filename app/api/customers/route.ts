import connectDB from "@/lib/mongodb"
import Customer from "@/models/Customer"
import CustomerAgentAssignment from "@/models/CustomerAgentAssignment"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    await connectDB()
    
    const cookieStore = await cookies()
    const teamSession = cookieStore.get("team-session")?.value

    if (!teamSession) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const session = JSON.parse(teamSession)
    const { userId, role } = session

    let customers

    if (role === "agent") {
      // Agents only see their assigned customers
      const assignments = await CustomerAgentAssignment.find({ agent_id: userId })
        .populate({
          path: "customer_id",
          select: "company_name contact_person email phone created_at is_active",
        })
        .populate("agent_id", "full_name")
        .lean()

      customers = assignments.map((a: any) => ({
        id: a.customer_id._id.toString(),
        company_name: a.customer_id.company_name,
        contact_person: a.customer_id.contact_person,
        email: a.customer_id.email,
        phone: a.customer_id.phone,
        created_at: a.customer_id.created_at,
        is_active: a.customer_id.is_active,
        agent_id: a.agent_id?._id?.toString(),
        assigned_to: a.agent_id?.full_name,
      }))
    } else {
      // Super admin, admin, manager see all customers
      const allCustomers = await Customer.find()
        .sort({ created_at: -1 })
        .lean()

      // Get assignments for each customer
      const customerIds = allCustomers.map((c: any) => c._id)
      const assignments = await CustomerAgentAssignment.find({ customer_id: { $in: customerIds } })
        .populate("agent_id", "full_name")
        .lean()

      const assignmentMap = new Map()
      assignments.forEach((a: any) => {
        assignmentMap.set(a.customer_id.toString(), {
          agent_id: a.agent_id?._id?.toString(),
          assigned_to: a.agent_id?.full_name,
        })
      })

      customers = allCustomers.map((c: any) => ({
        id: c._id.toString(),
        company_name: c.company_name,
        contact_person: c.contact_person,
        email: c.email,
        phone: c.phone,
        created_at: c.created_at,
        is_active: c.is_active,
        agent_id: assignmentMap.get(c._id.toString())?.agent_id,
        assigned_to: assignmentMap.get(c._id.toString())?.assigned_to,
      }))
    }

    return NextResponse.json(customers)
  } catch (error) {
    console.error("[v0] Error fetching customers:", error)
    return NextResponse.json({ message: "Error fetching customers" }, { status: 500 })
  }
}
