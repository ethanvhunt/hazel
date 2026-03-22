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

    // Check if already assigned
    const existing = await CustomerProduct.findOne({
      productId,
      customerId: customer_id,
    })
    if (existing) {
      return NextResponse.json({ message: "Product already assigned to this customer" }, { status: 400 })
    }

    const assignment = await CustomerProduct.create({
      productId,
      customerId: customer_id,
      assignedBy: sessionData.userId,
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
        product_id: assignment.productId,
        customer_id: assignment.customerId,
        assigned_by: assignment.assignedBy,
        notes: assignment.notes,
        created_at: assignment.createdAt,
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

    await CustomerProduct.deleteOne({
      productId,
      customerId,
    })

    // Log activity
    await logActivity({
      entityType: "product_assignment",
      entityId: productId,
      action: "unassign",
      performedBy: sessionData.userId,
      performedByType: "team",
      oldValues: { customerId },
    })

    return NextResponse.json({ message: "Product unassigned successfully" })
  } catch (error) {
    console.error("[v0] Unassign product error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
