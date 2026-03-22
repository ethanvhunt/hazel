import { sql } from "@/lib/db"
import { NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const cookieStore = await cookies()
    const sessionId = cookieStore.get("sessionId")?.value

    if (!sessionId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const { status, assignedAgentId } = await request.json()

    if (!status || !["pending", "approved", "rejected"].includes(status)) {
      return NextResponse.json({ message: "Invalid status" }, { status: 400 })
    }

    // Update request status
    const result = await sql`
      UPDATE product_requests
      SET status = ${status}, 
          reviewed_by = (SELECT id FROM users WHERE email = (SELECT email FROM product_requests WHERE id = ${params.id})),
          reviewed_at = NOW(),
          assigned_agent_id = ${assignedAgentId || null}
      WHERE id = ${params.id}
      RETURNING *
    `

    // If approved, create the product automatically
    if (status === "approved" && result.length > 0) {
      const req = result[0]
      const productResult = await sql`
        INSERT INTO products (customer_id, name, description, status)
        VALUES (${req.customer_id}, ${req.product_name}, ${req.description}, 'active')
        RETURNING *
      `

      await sql`
        INSERT INTO activity_logs (entity_type, entity_id, action, performed_by, new_values)
        VALUES ('product', ${productResult[0].id}, 'create', 
          (SELECT reviewed_by FROM product_requests WHERE id = ${params.id}),
          ${JSON.stringify({ name: req.product_name, description: req.description })})
      `
    }

    return NextResponse.json(result[0])
  } catch (error) {
    console.error("[v0] Error updating product request:", error)
    return NextResponse.json({ message: "Error updating product request" }, { status: 500 })
  }
}
