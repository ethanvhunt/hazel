import { sql } from "@/lib/db"
import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { ROLES } from "@/lib/constants"

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
    const { id } = await params
    const session = await checkSuperAdminAuth()

    if (!session) {
      return NextResponse.json({ message: "Unauthorized. Only super admin can delete customers." }, { status: 403 })
    }

    const customers = await sql`SELECT * FROM customers WHERE id = ${id}`
    const customerToDelete = customers[0]

    if (!customerToDelete) {
      return NextResponse.json({ message: "Customer not found" }, { status: 404 })
    }

    await sql`DELETE FROM messages WHERE ticket_id IN (SELECT id FROM tickets WHERE customer_id = ${id})`
    await sql`DELETE FROM tickets WHERE customer_id = ${id}`
    await sql`DELETE FROM products WHERE customer_id = ${id}`
    await sql`DELETE FROM product_requests WHERE customer_id = ${id}`
    await sql`DELETE FROM customer_users WHERE customer_id = ${id}`
    await sql`DELETE FROM customer_product_assignments WHERE customer_id = ${id}`

    await sql`DELETE FROM customers WHERE id = ${id}`

    await sql`
      INSERT INTO activity_logs (entity_type, entity_id, action, performed_by, old_values, new_values)
      VALUES ('customer', ${id}, 'delete', ${session.id}, ${JSON.stringify({
        id: customerToDelete.id,
        companyName: customerToDelete.company_name,
        contactPerson: customerToDelete.contact_person,
        email: customerToDelete.email,
      })}, null)
    `

    return NextResponse.json({ message: "Customer deleted successfully" })
  } catch (error) {
    console.error("[v0] Error deleting customer:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const cookieStore = await cookies()
    const teamSession = cookieStore.get("team-session")?.value

    if (!teamSession) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const session = JSON.parse(teamSession)

    let customer
    if (session.role === "agent") {
      const result = await sql`
        SELECT c.* FROM customers c
        JOIN customer_agent_assignment ca ON c.id = ca.customer_id
        WHERE c.id = ${id} AND ca.agent_id = ${session.userId}
      `
      if (result.length === 0) {
        return NextResponse.json({ message: "Customer not found or unauthorized" }, { status: 404 })
      }
      customer = result[0]
    } else {
      const result = await sql`SELECT * FROM customers WHERE id = ${id}`
      if (result.length === 0) {
        return NextResponse.json({ message: "Customer not found" }, { status: 404 })
      }
      customer = result[0]
    }

    // Fetch assigned agent
    const assignment = await sql`
      SELECT u.id, u.full_name FROM customer_agent_assignment ca
      JOIN users u ON ca.agent_id = u.id
      WHERE ca.customer_id = ${id}
      LIMIT 1
    `

    return NextResponse.json({
      ...customer,
      assigned_agent: assignment.length > 0 ? assignment[0] : null,
    })
  } catch (error) {
    console.error("[v0] Error fetching customer:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const cookieStore = await cookies()
    const teamSession = cookieStore.get("team-session")?.value

    if (!teamSession) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const session = JSON.parse(teamSession)
    const { companyName, contactPerson, phone } = await request.json()

    // Fetch current customer
    const currentResult = await sql`SELECT * FROM customers WHERE id = ${id}`
    if (currentResult.length === 0) {
      return NextResponse.json({ message: "Customer not found" }, { status: 404 })
    }

    const currentCustomer = currentResult[0]

    if (session.role === "agent") {
      const assignment = await sql`
        SELECT * FROM customer_agent_assignment
        WHERE customer_id = ${id} AND agent_id = ${session.userId}
      `
      if (assignment.length === 0) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 403 })
      }
    }

    const updatedResult = await sql`
      UPDATE customers 
      SET company_name = ${companyName || currentCustomer.company_name},
          contact_person = ${contactPerson || currentCustomer.contact_person},
          phone = ${phone || currentCustomer.phone}
      WHERE id = ${id}
      RETURNING *
    `

    await sql`
      INSERT INTO activity_logs (entity_type, entity_id, action, performed_by, old_values, new_values)
      VALUES ('customer', ${id}, 'update', ${session.userId}, ${JSON.stringify({
        companyName: currentCustomer.company_name,
        contactPerson: currentCustomer.contact_person,
        phone: currentCustomer.phone,
      })}, ${JSON.stringify({
        companyName: companyName || currentCustomer.company_name,
        contactPerson: contactPerson || currentCustomer.contact_person,
        phone: phone || currentCustomer.phone,
      })})
    `

    return NextResponse.json({
      message: "Customer updated successfully",
      customer: updatedResult[0],
    })
  } catch (error) {
    console.error("[v0] Error updating customer:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
