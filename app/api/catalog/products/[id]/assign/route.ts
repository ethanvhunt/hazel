import { sql } from "@/lib/db"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

// POST - Assign product to customer
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: productId } = await params
    const cookieStore = await cookies()
    const session = cookieStore.get("session")?.value

    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const sessionData = JSON.parse(session)
    
    if (!["super_admin", "admin", "manager"].includes(sessionData.role)) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 })
    }

    const { customer_id, notes } = await request.json()

    if (!customer_id) {
      return NextResponse.json({ message: "Customer ID is required" }, { status: 400 })
    }

    // Check if product exists
    const product = await sql`SELECT * FROM products WHERE id = ${productId}`
    if (product.length === 0) {
      return NextResponse.json({ message: "Product not found" }, { status: 404 })
    }

    // Check if customer exists
    const customer = await sql`SELECT * FROM customers WHERE id = ${customer_id}`
    if (customer.length === 0) {
      return NextResponse.json({ message: "Customer not found" }, { status: 404 })
    }

    // Check if already assigned
    const existing = await sql`
      SELECT * FROM customer_product_assignments 
      WHERE product_id = ${productId} AND customer_id = ${customer_id}
    `
    if (existing.length > 0) {
      return NextResponse.json({ message: "Product already assigned to this customer" }, { status: 400 })
    }

    const result = await sql`
      INSERT INTO customer_product_assignments (product_id, customer_id, assigned_by, notes)
      VALUES (${productId}, ${customer_id}, ${sessionData.userId}, ${notes || null})
      RETURNING *
    `

    // Log activity
    await sql`
      INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details)
      VALUES (
        ${sessionData.userId}, 
        'assign', 
        'product_assignment', 
        ${result[0].id}, 
        ${JSON.stringify({ product_id: product[0].product_id, customer: customer[0].company_name })}
      )
    `

    return NextResponse.json({ assignment: result[0] }, { status: 201 })
  } catch (error) {
    console.error("[v0] Assign product error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

// DELETE - Unassign product from customer
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: productId } = await params
    const cookieStore = await cookies()
    const session = cookieStore.get("session")?.value

    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const sessionData = JSON.parse(session)
    
    if (!["super_admin", "admin", "manager"].includes(sessionData.role)) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const customerId = searchParams.get("customer_id")

    if (!customerId) {
      return NextResponse.json({ message: "Customer ID is required" }, { status: 400 })
    }

    await sql`
      DELETE FROM customer_product_assignments 
      WHERE product_id = ${productId} AND customer_id = ${customerId}
    `

    // Log activity
    await sql`
      INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details)
      VALUES (
        ${sessionData.userId}, 
        'unassign', 
        'product_assignment', 
        ${productId}, 
        ${JSON.stringify({ customer_id: customerId })}
      )
    `

    return NextResponse.json({ message: "Product unassigned successfully" })
  } catch (error) {
    console.error("[v0] Unassign product error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
