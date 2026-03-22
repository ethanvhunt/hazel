import { sql } from "@/lib/db"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { ROLES } from "@/lib/constants"

// GET single product
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const cookieStore = await cookies()
    const teamSession = cookieStore.get("team-session")?.value
    const customerSession = cookieStore.get("customer-session")?.value

    if (!teamSession && !customerSession) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const product = await sql`
      SELECT cp.*, pc.name as category_name, pc.slug as category_slug
      FROM catalog_products cp
      LEFT JOIN product_categories pc ON cp.category_id = pc.id
      WHERE cp.id = ${id}
    `

    if (product.length === 0) {
      return NextResponse.json({ message: "Product not found" }, { status: 404 })
    }

    // For customer session, verify they have access to this product
    if (customerSession) {
      const session = JSON.parse(customerSession)
      const assignment = await sql`
        SELECT * FROM customer_product_assignments
        WHERE product_id = ${id} AND customer_id = ${session.customerId}
      `
      if (assignment.length === 0) {
        return NextResponse.json({ message: "Product not found" }, { status: 404 })
      }

      // Include assignment info for customer view
      return NextResponse.json({
        ...product[0],
        assigned_at: assignment[0].assigned_at,
        assignment_notes: assignment[0].notes
      })
    }

    // For team session, also get assigned customers
    const assignments = await sql`
      SELECT cpa.*, c.company_name, c.contact_email
      FROM customer_product_assignments cpa
      JOIN customers c ON cpa.customer_id = c.id
      WHERE cpa.product_id = ${id}
      ORDER BY cpa.assigned_at DESC
    `

    return NextResponse.json({ product: product[0], assignments })
  } catch (error) {
    console.error("[v0] Get product error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

// PUT - Update product
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const cookieStore = await cookies()
    const teamSession = cookieStore.get("team-session")?.value

    if (!teamSession) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const sessionData = JSON.parse(teamSession)
    
    if (![ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER].includes(sessionData.role)) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 })
    }

    const body = await request.json()
    const { name, description, category_id, brand, model, serial_number, specifications, status } = body

    const result = await sql`
      UPDATE catalog_products
      SET 
        name = COALESCE(${name}, name),
        description = COALESCE(${description}, description),
        category_id = COALESCE(${category_id}, category_id),
        brand = COALESCE(${brand}, brand),
        model = COALESCE(${model}, model),
        serial_number = COALESCE(${serial_number}, serial_number),
        specifications = COALESCE(${specifications ? JSON.stringify(specifications) : null}::jsonb, specifications),
        status = COALESCE(${status}, status),
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `

    if (result.length === 0) {
      return NextResponse.json({ message: "Product not found" }, { status: 404 })
    }

    // Log activity
    await sql`
      INSERT INTO activity_logs (entity_type, entity_id, action, performed_by, new_values)
      VALUES ('product', ${id}::uuid, 'update', ${sessionData.userId}::uuid, ${JSON.stringify({ name, status })}::jsonb)
    `

    return NextResponse.json({ product: result[0] })
  } catch (error) {
    console.error("[v0] Update product error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

// DELETE - Only super_admin can delete
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const cookieStore = await cookies()
    const teamSession = cookieStore.get("team-session")?.value

    if (!teamSession) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const sessionData = JSON.parse(teamSession)
    
    // Only super_admin can delete
    if (sessionData.role !== ROLES.SUPER_ADMIN) {
      return NextResponse.json({ message: "Only super admin can delete products" }, { status: 403 })
    }

    // Get product info for logging
    const product = await sql`SELECT * FROM catalog_products WHERE id = ${id}`
    
    if (product.length === 0) {
      return NextResponse.json({ message: "Product not found" }, { status: 404 })
    }

    // Delete assignments first
    await sql`DELETE FROM customer_product_assignments WHERE product_id = ${id}`
    
    // Delete product
    await sql`DELETE FROM catalog_products WHERE id = ${id}`

    // Log activity
    await sql`
      INSERT INTO activity_logs (entity_type, entity_id, action, performed_by, old_values)
      VALUES ('product', ${id}::uuid, 'delete', ${sessionData.userId}::uuid, ${JSON.stringify({ 
        product_code: product[0].product_code, 
        name: product[0].name 
      })}::jsonb)
    `

    return NextResponse.json({ message: "Product deleted successfully" })
  } catch (error) {
    console.error("[v0] Delete product error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
