import connectDB from "@/lib/mongodb"
import ProductCategory from "@/models/ProductCategory"
import { logActivity } from "@/lib/activity-logger"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { ROLES } from "@/lib/constants"

// GET all categories
export async function GET() {
  try {
    await connectDB()
    
    const cookieStore = await cookies()
    const teamSession = cookieStore.get("team-session")?.value
    const customerSession = cookieStore.get("customer-session")?.value

    if (!teamSession && !customerSession) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const categories = await ProductCategory.find()
      .sort({ name: 1 })
      .lean()

    const transformed = categories.map((c: any) => ({
      ...c,
      id: c._id.toString(),
    }))

    return NextResponse.json(transformed)
  } catch (error) {
    console.error("[v0] Get categories error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

// POST - Create new category (super_admin and admin only)
export async function POST(request: Request) {
  try {
    await connectDB()
    
    const cookieStore = await cookies()
    const teamSession = cookieStore.get("team-session")?.value

    if (!teamSession) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const sessionData = JSON.parse(teamSession)
    
    if (![ROLES.SUPER_ADMIN, ROLES.ADMIN].includes(sessionData.role)) {
      return NextResponse.json({ message: "Only super admin and admin can create categories" }, { status: 403 })
    }

    const { name, description } = await request.json()

    if (!name) {
      return NextResponse.json({ message: "Name is required" }, { status: 400 })
    }

    // Check if category exists
    const existing = await ProductCategory.findOne({
      name: { $regex: new RegExp(`^${name}$`, "i") },
    })

    if (existing) {
      return NextResponse.json({ message: "Category already exists" }, { status: 400 })
    }

    const category = await ProductCategory.create({
      name,
      description: description || null,
      is_custom: true,
      created_by: sessionData.userId,
    })

    // Log activity
    await logActivity({
      entityType: "product_category",
      entityId: category._id,
      action: "create",
      performedBy: sessionData.userId,
      performedByType: "user",
      performedByName: sessionData.fullName,
      newValues: { name, slug: category.slug },
      details: `Created product category: ${name}`,
    })

    return NextResponse.json({
      category: {
        ...category.toObject(),
        id: category._id.toString(),
      },
    }, { status: 201 })
  } catch (error) {
    console.error("[v0] Create category error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
