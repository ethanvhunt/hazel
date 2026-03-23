import { connectToDatabase } from "@/lib/mongodb"
import { Product, Customer, CustomerProduct } from "@/models"
import { logActivity } from "@/lib/activity-logger"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

// POST - Assign product to customer
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: productId } = await params
    const cookieStore = await cookies()
    const teamSession = cookieStore.get("team-session")?.value

    if (!teamSession) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const sessionData = JSON.parse(teamSession)
    
    if (!["super_admin", "admin", "manager"].includes(sessionData.role)) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 })
    }

    const { customer_id, notes } = await request.json()

    if (!customer_id) {
      return NextResponse.json({ message: "Customer ID is required" }, { status: 400 })
    }

    await connectToDatabase()

    // Check if product exists
    const product = await Product.findById(productId).lean()
    if (!product) {
      return NextResponse.json({ message: "Product not found" }, { status: 404 })
    }

    // Check if customer exists
    const customer = await Customer.findById(customer_id).lean()
    if (!customer) {
      return NextResponse.json({ message: "Customer not found" }, { status: 404 })
    }

    // Check if already assigned - using correct field names
    const existing = await CustomerProduct.findOne({
      product_id: productId,
      customer_id: customer_id,
    })
    if (existing) {
      return NextResponse.json({ message: "Product already assigned to this customer" }, { status: 400 })
    }

    // Create assignment with correct field names matching the model
    const assignment = await CustomerProduct.create({
      product_id: productId,
      customer_id: customer_id,
      assigned_by: sessionData.userId,
      notes: notes || null,
    })

    // Log activity
    await logActivity({
      entityType: "product_assignment",
      entityId: assignment._id.toString(),
      action: "assign",
      performedBy: sessionData.userId,
      performedByType: "team",
      newValues: {
        productCode: (product as any).productCode,
        customer: (customer as any).companyName,
      },
    })

    return NextResponse.json({
      assignment: {
        id: assignment._id.toString(),
        product_id: assignment.product_id,
        customer_id: assignment.customer_id,
        assigned_by: assignment.assigned_by,
        notes: assignment.notes,
        created_at: assignment.created_at,
      },
    }, { status: 201 })
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
    const teamSession = cookieStore.get("team-session")?.value

    if (!teamSession) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const sessionData = JSON.parse(teamSession)
    
    if (!["super_admin", "admin", "manager"].includes(sessionData.role)) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const customerId = searchParams.get("customer_id")

    if (!customerId) {
      return NextResponse.json({ message: "Customer ID is required" }, { status: 400 })
    }

    await connectToDatabase()

    // Use correct field names matching the model
    await CustomerProduct.deleteOne({
      product_id: productId,
      customer_id: customerId,
    })

    // Log activity
    await logActivity({
      entityType: "product_assignment",
      entityId: productId,
      action: "unassign",
      performedBy: sessionData.userId,
      performedByType: "team",
      oldValues: { customer_id: customerId },
    })

    return NextResponse.json({ message: "Product unassigned successfully" })
  } catch (error) {
    console.error("[v0] Unassign product error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
