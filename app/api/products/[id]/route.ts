import connectDB from "@/lib/mongodb"
import Product from "@/models/Product"
import CustomerProduct from "@/models/CustomerProduct"
import { logActivity } from "@/lib/activity-logger"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import mongoose from "mongoose"

// GET - Get a single product (customer view)
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB()
    
    const { id } = await params
    const cookieStore = await cookies()
    const customerSession = cookieStore.get("customer-session")?.value

    if (!customerSession) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const session = JSON.parse(customerSession)

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ message: "Invalid product ID" }, { status: 400 })
    }

    // Verify product is assigned to this customer
    const assignment = await CustomerProduct.findOne({
      product_id: new mongoose.Types.ObjectId(id),
      customer_id: new mongoose.Types.ObjectId(session.customerId),
    })

    if (!assignment) {
      return NextResponse.json({ message: "Product not found" }, { status: 404 })
    }

    // Get product details
    const product = await Product.findById(id)
      .populate("category_id", "name slug")
      .lean()

    if (!product) {
      return NextResponse.json({ message: "Product not found" }, { status: 404 })
    }

    return NextResponse.json({
      id: (product as any)._id.toString(),
      product_code: (product as any).product_code,
      name: (product as any).name,
      description: (product as any).description,
      category_name: (product as any).category_id?.name || null,
      brand: (product as any).brand,
      model: (product as any).model,
      serial_number: (product as any).serial_number,
      specifications: (product as any).specifications,
      status: (product as any).status,
      assigned_at: assignment.assigned_at,
      notes: assignment.notes,
      created_at: (product as any).created_at,
      updated_at: (product as any).updated_at,
    })
  } catch (error) {
    console.error("[v0] Get product error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

// PUT - Update product (customer can update notes on their assignment)
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB()
    
    const { id } = await params
    const cookieStore = await cookies()
    const customerSession = cookieStore.get("customer-session")?.value

    if (!customerSession) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const session = JSON.parse(customerSession)

    // Only customer_admin can update
    if (session.role !== "customer_admin") {
      return NextResponse.json({ message: "Only customer admin can update" }, { status: 403 })
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ message: "Invalid product ID" }, { status: 400 })
    }

    const { notes } = await request.json()

    // Find and update assignment
    const assignment = await CustomerProduct.findOneAndUpdate(
      {
        product_id: new mongoose.Types.ObjectId(id),
        customer_id: new mongoose.Types.ObjectId(session.customerId),
      },
      { $set: { notes } },
      { new: true }
    ).populate("product_id", "product_code name")

    if (!assignment) {
      return NextResponse.json({ message: "Product not found" }, { status: 404 })
    }

    // Log activity
    await logActivity({
      entityType: "customer_product",
      entityId: assignment._id,
      action: "update",
      performedBy: session.userId,
      performedByType: "customer_user",
      performedByName: session.fullName,
      newValues: { notes },
      details: `Updated notes for product ${(assignment.product_id as any)?.product_code}`,
    })

    return NextResponse.json({
      id: (assignment.product_id as any)?._id?.toString() || id,
      product_code: (assignment.product_id as any)?.product_code,
      name: (assignment.product_id as any)?.name,
      notes: assignment.notes,
      assigned_at: assignment.assigned_at,
    })
  } catch (error) {
    console.error("[v0] Update product error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
