import { sql } from "@/lib/db"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function GET(request: Request, { params }: { params: Promise<{ customerId: string }> }) {
  try {
    const { customerId } = await params
    const cookieStore = await cookies()
    const teamSession = cookieStore.get("team-session")?.value

    if (!teamSession) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const session = JSON.parse(teamSession)

    // Agent can only view products of assigned customers
    if (session.role === "agent") {
      const assignment = await sql`
        SELECT * FROM customer_agent_assignment
        WHERE customer_id = ${customerId} AND agent_id = ${session.userId}
      `
      if (assignment.length === 0) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 403 })
      }
    }

    const products = await sql`
      SELECT id, name, description, status, created_at, updated_at
      FROM products
      WHERE customer_id = ${customerId}
      ORDER BY created_at DESC
    `

    return NextResponse.json(products)
  } catch (error) {
    console.error("[v0] Error fetching products:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ customerId: string }> }) {
  try {
    const { customerId } = await params
    const cookieStore = await cookies()
    const teamSession = cookieStore.get("team-session")?.value

    if (!teamSession) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const session = JSON.parse(teamSession)

    // super_admin, admin, manager can add to any customer. agent only to assigned
    if (session.role === "agent") {
      const assignment = await sql`
        SELECT * FROM customer_agent_assignment
        WHERE customer_id = ${customerId} AND agent_id = ${session.userId}
      `
      if (assignment.length === 0) {
        return NextResponse.json({ message: "You can only add products to assigned customers" }, { status: 403 })
      }
    }

    const { name, description } = await request.json()

    if (!name || !description) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 })
    }

    const result = await sql`
      INSERT INTO products (customer_id, name, description, status)
      VALUES (${customerId}, ${name}, ${description}, 'active')
      RETURNING id, name, description, status, created_at, updated_at
    `

    // Log activity
    await sql`
      INSERT INTO activity_logs (entity_type, entity_id, action, performed_by, old_values, new_values)
      VALUES ('product', ${result[0].id}, 'create', ${session.userId}, null, ${JSON.stringify({ name, description })})
    `

    return NextResponse.json(result[0], { status: 201 })
  } catch (error) {
    console.error("[v0] Error creating product:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ customerId: string }> }) {
  try {
    const { customerId } = await params
    const cookieStore = await cookies()
    const teamSession = cookieStore.get("team-session")?.value

    if (!teamSession) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const session = JSON.parse(teamSession)
    const { productId } = await request.json()

    if (!productId) {
      return NextResponse.json({ message: "Product ID is required" }, { status: 400 })
    }

    // Fetch product to verify it belongs to the customer
    const productResult = await sql`SELECT * FROM products WHERE id = ${productId} AND customer_id = ${customerId}`
    if (productResult.length === 0) {
      return NextResponse.json({ message: "Product not found" }, { status: 404 })
    }

    const product = productResult[0]

    // Agent can only delete products from assigned customers
    if (session.role === "agent") {
      const assignment = await sql`
        SELECT * FROM customer_agent_assignment
        WHERE customer_id = ${customerId} AND agent_id = ${session.userId}
      `
      if (assignment.length === 0) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 403 })
      }
    }

    // Log activity before deletion
    await sql`
      INSERT INTO activity_logs (entity_type, entity_id, action, performed_by, old_values, new_values)
      VALUES ('product', ${productId}, 'delete', ${session.userId}, ${JSON.stringify({
        name: product.name,
        description: product.description,
      })}, null)
    `

    await sql`DELETE FROM products WHERE id = ${productId}`

    return NextResponse.json({ message: "Product deleted successfully" })
  } catch (error) {
    console.error("[v0] Error deleting product:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
