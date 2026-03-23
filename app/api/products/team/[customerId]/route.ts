import connectDB from "@/lib/mongodb"
import CustomerProduct from "@/models/CustomerProduct"
import CustomerAgentAssignment from "@/models/CustomerAgentAssignment"
import Product from "@/models/Product"
import { logActivity } from "@/lib/activity-logger"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { ROLES } from "@/lib/constants"
import mongoose from "mongoose"

// GET products assigned to a customer (for team view)
export async function GET(request: Request, { params }: { params: Promise<{ customerId: string }> }) {
  try {
    await connectDB()
    
    const { customerId } = await params
    const cookieStore = await cookies()
    const teamSession = cookieStore.get("team-session")?.value

    if (!teamSession) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const session = JSON.parse(teamSession)

    if (!mongoose.Types.ObjectId.isValid(customerId)) {
      return NextResponse.json({ message: "Invalid customer ID" }, { status: 400 })
    }

    // Agent can only view products of assigned customers
    if (session.role === ROLES.AGENT) {
      const assignment = await CustomerAgentAssignment.findOne({
        customer_id: new mongoose.Types.ObjectId(customerId),
        agent_id: new mongoose.Types.ObjectId(session.userId),
      })
      if (!assignment) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 403 })
      }
    }

    // Get products assigned to this customer
    const assignments = await CustomerProduct.find({
      customer_id: new mongoose.Types.ObjectId(customerId),
    })
      .populate("product_id", "name product_code description status category_id brand model")
      .sort({ assigned_at: -1 })
      .lean()

    // Transform for frontend
    const products = assignments.map((a: any) => ({
      id: a.product_id?._id?.toString() || a._id.toString(),
      assignment_id: a._id.toString(),
      product_code: a.product_id?.product_code || null,
      name: a.product_id?.name || "Unknown Product",
      description: a.product_id?.description || null,
      status: a.product_id?.status || "inactive",
      brand: a.product_id?.brand || null,
      model: a.product_id?.model || null,
      assigned_at: a.assigned_at,
      notes: a.notes,
    }))

    return NextResponse.json(products)
  } catch (error) {
    console.error("[v0] Error fetching customer products:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

// POST - Assign a product to a customer
export async function POST(request: Request, { params }: { params: Promise<{ customerId: string }> }) {
  try {
    await connectDB()
    
    const { customerId } = await params
    const cookieStore = await cookies()
    const teamSession = cookieStore.get("team-session")?.value

    if (!teamSession) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const session = JSON.parse(teamSession)

    // Only super_admin, admin, manager can assign products
    if (![ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER].includes(session.role)) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 })
    }

    if (!mongoose.Types.ObjectId.isValid(customerId)) {
      return NextResponse.json({ message: "Invalid customer ID" }, { status: 400 })
    }

    const { productId, notes } = await request.json()

    if (!productId) {
      return NextResponse.json({ message: "Product ID is required" }, { status: 400 })
    }

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return NextResponse.json({ message: "Invalid product ID" }, { status: 400 })
    }

    // Check if product exists
    const product = await Product.findById(productId)
    if (!product) {
      return NextResponse.json({ message: "Product not found" }, { status: 404 })
    }

    // Check if already assigned
    const existing = await CustomerProduct.findOne({
      customer_id: new mongoose.Types.ObjectId(customerId),
      product_id: new mongoose.Types.ObjectId(productId),
    })

    if (existing) {
      return NextResponse.json({ message: "Product already assigned to this customer" }, { status: 400 })
    }

    // Create assignment
    const assignment = await CustomerProduct.create({
      customer_id: new mongoose.Types.ObjectId(customerId),
      product_id: new mongoose.Types.ObjectId(productId),
      assigned_by: new mongoose.Types.ObjectId(session.userId),
      assigned_at: new Date(),
      notes: notes || null,
    })

    // Log activity
    await logActivity({
      entityType: "customer_product",
      entityId: assignment._id,
      action: "assign",
      performedBy: session.userId,
      performedByType: "user",
      performedByName: session.fullName,
      newValues: { product_code: product.product_code, product_name: product.name },
      details: `Assigned product ${product.product_code} to customer`,
    })

    return NextResponse.json({
      id: assignment._id.toString(),
      product_id: productId,
      customer_id: customerId,
      assigned_at: assignment.assigned_at,
      notes: assignment.notes,
      product: {
        id: product._id.toString(),
        product_code: product.product_code,
        name: product.name,
      },
    }, { status: 201 })
  } catch (error) {
    console.error("[v0] Error assigning product:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

// DELETE - Remove a product assignment
export async function DELETE(request: Request, { params }: { params: Promise<{ customerId: string }> }) {
  try {
    await connectDB()
    
    const { customerId } = await params
    const cookieStore = await cookies()
    const teamSession = cookieStore.get("team-session")?.value

    if (!teamSession) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const session = JSON.parse(teamSession)

    // Only super_admin can remove product assignments
    if (session.role !== ROLES.SUPER_ADMIN) {
      return NextResponse.json({ message: "Only super admin can remove product assignments" }, { status: 403 })
    }

    if (!mongoose.Types.ObjectId.isValid(customerId)) {
      return NextResponse.json({ message: "Invalid customer ID" }, { status: 400 })
    }

    const { productId } = await request.json()

    if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
      return NextResponse.json({ message: "Valid product ID is required" }, { status: 400 })
    }

    // Find and delete assignment
    const assignment = await CustomerProduct.findOneAndDelete({
      customer_id: new mongoose.Types.ObjectId(customerId),
      product_id: new mongoose.Types.ObjectId(productId),
    }).populate("product_id", "product_code name")

    if (!assignment) {
      return NextResponse.json({ message: "Product assignment not found" }, { status: 404 })
    }

    // Log activity
    await logActivity({
      entityType: "customer_product",
      entityId: assignment._id,
      action: "delete",
      performedBy: session.userId,
      performedByType: "user",
      performedByName: session.fullName,
      oldValues: {
        product_code: (assignment.product_id as any)?.product_code,
        product_name: (assignment.product_id as any)?.name,
      },
      details: `Removed product assignment`,
    })

    return NextResponse.json({ message: "Product assignment removed successfully" })
  } catch (error) {
    console.error("[v0] Error removing product assignment:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
