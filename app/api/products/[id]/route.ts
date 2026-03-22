import { sql } from "@/lib/db"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const cookieStore = await cookies()
    const customerSession = cookieStore.get("customer-session")?.value

    if (!customerSession) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const session = JSON.parse(customerSession)
    const product = await sql`
      SELECT id, name, description, status, created_at, updated_at
      FROM products
      WHERE id = ${id} AND customer_id = ${session.customerId}
    `

    if (product.length === 0) {
      return NextResponse.json({ message: "Product not found" }, { status: 404 })
    }

    return NextResponse.json(product[0])
  } catch (error) {
    console.error("[v0] Get product error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const cookieStore = await cookies()
    const customerSession = cookieStore.get("customer-session")?.value

    if (!customerSession) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const session = JSON.parse(customerSession)
    const { name, description, status } = await request.json()

    const result = await sql`
      UPDATE products
      SET name = ${name}, description = ${description}, status = ${status}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id} AND customer_id = ${session.customerId}
      RETURNING *
    `

    if (result.length === 0) {
      return NextResponse.json({ message: "Product not found" }, { status: 404 })
    }

    // Log activity
    await sql`
      INSERT INTO activity_logs (entity_type, entity_id, action, performed_by, old_values, new_values)
      VALUES ('product', ${id}, 'update', ${session.customerId}, NULL, ${JSON.stringify({ name, description, status })})
    `

    return NextResponse.json(result[0])
  } catch (error) {
    console.error("[v0] Update product error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
