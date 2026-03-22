import connectDB from "@/lib/mongodb"
import Product from "@/models/Product"
import CustomerProduct from "@/models/CustomerProduct"
import { logActivity } from "@/lib/activity-logger"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { ROLES } from "@/lib/constants"
import mongoose from "mongoose"

// GET single product
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
      return NextResponse.json({ message: "Invalid product ID" }, { status: 400 })
    }

    const product = await Product.findById(id)
      .populate("category_id", "name slug")
      .lean()

    if (!product) {
      return NextResponse.json({ message: "Product not found" }, { status: 404 })
    }

    const transformedProduct = {
      ...product,
      id: (product as any)._id.toString(),
      category_name: (product as any).category_id?.name || null,
      category_slug: (product as any).category_id?.slug || null,
    }

    // For customer session, verify they have access to this product
    if (customerSession) {
      const session = JSON.parse(customerSession)
      const assignment = await CustomerProduct.findOne({
        product_id: id,
        customer_id: session.customerId,
      }).lean()

      if (!assignment) {
        return NextResponse.json({ message: "Product not found" }, { status: 404 })
      }

      return NextResponse.json({
        ...transformedProduct,
        assigned_at: (assignment as any).assigned_at,
        assignment_notes: (assignment as any).notes,
      })
    }

    // For team session, also get assigned customers
    const assignments = await CustomerProduct.find({ product_id: id })
      .populate("customer_id", "company_name email")
      .sort({ assigned_at: -1 })
      .lean()

    const transformedAssignments = assignments.map((a: any) => ({
      id: a._id.toString(),
      customer_id: a.customer_id?._id?.toString(),
      company_name: a.customer_id?.company_name,
      assigned_at: a.assigned_at,
      notes: a.notes,
    }))

    return NextResponse.json({ product: transformedProduct, assignments: transformedAssignments })
  } catch (error) {
    console.error("[v0] Get product error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

// PUT - Update product
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB()
    
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

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ message: "Invalid product ID" }, { status: 400 })
    }

    const body = await request.json()
    const { name, description, category_id, brand, model, serial_number, specifications, status } = body

    // Get old values for logging
    const oldProduct = await Product.findById(id).lean()
    if (!oldProduct) {
      return NextResponse.json({ message: "Product not found" }, { status: 404 })
    }

    const updateData: any = {}
    if (name !== undefined) updateData.name = name
    if (description !== undefined) updateData.description = description
    if (category_id !== undefined) updateData.category_id = category_id
    if (brand !== undefined) updateData.brand = brand
    if (model !== undefined) updateData.model = model
    if (serial_number !== undefined) updateData.serial_number = serial_number
    if (specifications !== undefined) updateData.specifications = specifications
    if (status !== undefined) updateData.status = status

    const product = await Product.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true }
    ).populate("category_id", "name slug")

    // Log activity
    await logActivity({
      entityType: "product",
      entityId: id,
      action: "update",
      performedBy: sessionData.userId,
      performedByType: "user",
      performedByName: sessionData.fullName,
      oldValues: { name: (oldProduct as any).name, status: (oldProduct as any).status },
      newValues: { name: product?.name, status: product?.status },
      details: `Updated product ${product?.product_code}`,
    })

    return NextResponse.json({
      product: {
        ...product?.toObject(),
        id: product?._id.toString(),
        category_name: (product as any)?.category_id?.name || null,
        category_slug: (product as any)?.category_id?.slug || null,
      },
    })
  } catch (error) {
    console.error("[v0] Update product error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

// DELETE - Only super_admin can delete
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB()
    
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

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ message: "Invalid product ID" }, { status: 400 })
    }

    // Get product info for logging
    const product = await Product.findById(id).lean()
    
    if (!product) {
      return NextResponse.json({ message: "Product not found" }, { status: 404 })
    }

    // Delete assignments first
    await CustomerProduct.deleteMany({ product_id: id })
    
    // Delete product
    await Product.findByIdAndDelete(id)

    // Log activity
    await logActivity({
      entityType: "product",
      entityId: id,
      action: "delete",
      performedBy: sessionData.userId,
      performedByType: "user",
      performedByName: sessionData.fullName,
      oldValues: { product_code: (product as any).product_code, name: (product as any).name },
      details: `Deleted product ${(product as any).product_code} - ${(product as any).name}`,
    })

    return NextResponse.json({ message: "Product deleted successfully" })
  } catch (error) {
    console.error("[v0] Delete product error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
