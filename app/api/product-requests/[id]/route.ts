import connectDB from "@/lib/mongodb"
import ProductRequest from "@/models/ProductRequest"
import Product from "@/models/Product"
import CustomerProduct from "@/models/CustomerProduct"
import { getNextSequence } from "@/models/Counter"
import { logActivity } from "@/lib/activity-logger"
import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { ROLES } from "@/lib/constants"
import mongoose from "mongoose"

// PUT - Update product request status (approve/reject)
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB()
    
    const { id } = await params
    const cookieStore = await cookies()
    const teamSession = cookieStore.get("team-session")?.value

    if (!teamSession) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const session = JSON.parse(teamSession)

    // Only super_admin, admin, manager can process product requests
    if (![ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER].includes(session.role)) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 })
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ message: "Invalid request ID" }, { status: 400 })
    }

    const { status, rejection_reason } = await request.json()

    if (!status || !["pending", "approved", "rejected"].includes(status)) {
      return NextResponse.json({ message: "Invalid status" }, { status: 400 })
    }

    // Get the product request
    const productRequest = await ProductRequest.findById(id)
      .populate("customer_id", "company_name")

    if (!productRequest) {
      return NextResponse.json({ message: "Product request not found" }, { status: 404 })
    }

    const oldStatus = productRequest.status

    // Update request status
    const updateData: any = {
      status,
      reviewed_by: new mongoose.Types.ObjectId(session.userId),
      reviewed_at: new Date(),
    }

    if (status === "rejected" && rejection_reason) {
      updateData.rejection_reason = rejection_reason
    }

    await ProductRequest.findByIdAndUpdate(id, { $set: updateData })

    // If approved, create the product and assign to customer
    if (status === "approved") {
      // Generate product code
      const nextNum = await getNextSequence("product_code")
      const productCode = `PRD-${String(nextNum).padStart(6, "0")}`

      // Create the product
      const product = await Product.create({
        product_code: productCode,
        name: productRequest.product_name,
        description: productRequest.description,
        category_id: productRequest.category_id || null,
        brand: productRequest.brand || null,
        model: productRequest.model || null,
        status: "active",
        created_by: new mongoose.Types.ObjectId(session.userId),
      })

      // Assign to customer
      await CustomerProduct.create({
        customer_id: productRequest.customer_id,
        product_id: product._id,
        assigned_by: new mongoose.Types.ObjectId(session.userId),
        assigned_at: new Date(),
        notes: `Created from product request`,
      })

      // Log product creation
      await logActivity({
        entityType: "product",
        entityId: product._id,
        action: "create",
        performedBy: session.userId,
        performedByType: "user",
        performedByName: session.fullName,
        newValues: { product_code: productCode, name: productRequest.product_name },
        details: `Created product ${productCode} from request`,
      })
    }

    // Log the approval/rejection
    await logActivity({
      entityType: "product_request",
      entityId: id,
      action: status === "approved" ? "approve" : "reject",
      performedBy: session.userId,
      performedByType: "user",
      performedByName: session.fullName,
      oldValues: { status: oldStatus },
      newValues: { status, rejection_reason: rejection_reason || null },
      details: `${status === "approved" ? "Approved" : "Rejected"} product request for ${productRequest.product_name}`,
    })

    return NextResponse.json({
      message: `Product request ${status}`,
      status,
    })
  } catch (error) {
    console.error("[v0] Error updating product request:", error)
    return NextResponse.json({ message: "Error updating product request" }, { status: 500 })
  }
}

// GET - Get single product request
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB()
    
    const { id } = await params
    const cookieStore = await cookies()
    const teamSession = cookieStore.get("team-session")?.value
    const customerSession = cookieStore.get("customer-session")?.value

    if (!teamSession && !customerSession) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ message: "Invalid request ID" }, { status: 400 })
    }

    const productRequest = await ProductRequest.findById(id)
      .populate("customer_id", "company_name email")
      .populate("category_id", "name slug")
      .populate("reviewed_by", "full_name")
      .lean()

    if (!productRequest) {
      return NextResponse.json({ message: "Product request not found" }, { status: 404 })
    }

    // If customer, verify it's their request
    if (customerSession) {
      const session = JSON.parse(customerSession)
      if ((productRequest as any).customer_id._id.toString() !== session.customerId) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 403 })
      }
    }

    return NextResponse.json({
      id: (productRequest as any)._id.toString(),
      product_name: (productRequest as any).product_name,
      description: (productRequest as any).description,
      brand: (productRequest as any).brand,
      model: (productRequest as any).model,
      category_name: (productRequest as any).category_id?.name || null,
      customer_name: (productRequest as any).customer_id?.company_name || null,
      status: (productRequest as any).status,
      rejection_reason: (productRequest as any).rejection_reason,
      reviewed_by_name: (productRequest as any).reviewed_by?.full_name || null,
      reviewed_at: (productRequest as any).reviewed_at,
      created_at: (productRequest as any).created_at,
    })
  } catch (error) {
    console.error("[v0] Error fetching product request:", error)
    return NextResponse.json({ message: "Error fetching product request" }, { status: 500 })
  }
}
