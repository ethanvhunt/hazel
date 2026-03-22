import connectDB from "@/lib/mongodb"
import Product from "@/models/Product"
import ProductCategory from "@/models/ProductCategory"
import { getNextSequence } from "@/models/Counter"
import { logActivity } from "@/lib/activity-logger"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { ROLES } from "@/lib/constants"

// GET all products in the global catalog (for team members)
export async function GET(request: Request) {
  try {
    await connectDB()
    
    const cookieStore = await cookies()
    const teamSession = cookieStore.get("team-session")?.value

    if (!teamSession) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const sessionData = JSON.parse(teamSession)
    
    // Only team members can view global catalog
    if (![ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER, ROLES.AGENT].includes(sessionData.role)) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const categorySlug = searchParams.get("category")
    const status = searchParams.get("status")
    const condition = searchParams.get("condition")
    const brand = searchParams.get("brand")
    const search = searchParams.get("search")

    // Build query
    const query: any = {}

    // Handle category filter
    if (categorySlug && categorySlug !== "all") {
      const category = await ProductCategory.findOne({ slug: categorySlug })
      if (category) {
        query.category_id = category._id
      }
    }

    // Handle status filter
    if (status && status !== "all") {
      query.status = status
    }

    // Handle condition filter
    if (condition && condition !== "all") {
      query.condition = condition
    }

    // Handle brand filter
    if (brand && brand !== "all") {
      query.brand = { $regex: brand, $options: "i" }
    }

    // Handle search
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { product_code: { $regex: search, $options: "i" } },
        { brand: { $regex: search, $options: "i" } },
        { model: { $regex: search, $options: "i" } },
        { serial_number: { $regex: search, $options: "i" } },
      ]
    }

    const products = await Product.find(query)
      .populate("category_id", "name slug")
      .sort({ created_at: -1 })
      .lean()

    // Transform for frontend compatibility
    const transformedProducts = products.map((p: any) => ({
      ...p,
      id: p._id.toString(),
      category_name: p.category_id?.name || null,
      category_slug: p.category_id?.slug || null,
      category_id: p.category_id?._id?.toString() || null,
    }))

    return NextResponse.json(transformedProducts)
  } catch (error) {
    console.error("[v0] Get catalog products error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

// POST - Create new product in global catalog
export async function POST(request: Request) {
  try {
    await connectDB()
    
    const cookieStore = await cookies()
    const teamSession = cookieStore.get("team-session")?.value

    if (!teamSession) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const sessionData = JSON.parse(teamSession)
    
    // Only super_admin, admin, manager can create products
    if (![ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER].includes(sessionData.role)) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 })
    }

    const body = await request.json()
    const {
      name,
      description,
      category_id,
      brand,
      model,
      manufacturer,
      serial_number,
      part_number,
      sku,
      asset_tag,
      condition,
      warranty_months,
      warranty_info,
      purchase_date,
      purchase_price,
      vendor,
      location,
      notes,
      specifications,
      status,
    } = body

    if (!name) {
      return NextResponse.json({ message: "Name is required" }, { status: 400 })
    }

    // Generate product code: PRD-XXXXXX
    const nextNum = await getNextSequence("product_code")
    const productCode = `PRD-${String(nextNum).padStart(6, "0")}`

    const product = await Product.create({
      product_code: productCode,
      name,
      description: description || null,
      category_id: category_id || null,
      brand: brand || null,
      model: model || null,
      manufacturer: manufacturer || null,
      serial_number: serial_number || null,
      part_number: part_number || null,
      sku: sku || null,
      asset_tag: asset_tag || null,
      condition: condition || "new",
      warranty_months: warranty_months || null,
      warranty_info: warranty_info || null,
      purchase_date: purchase_date || null,
      purchase_price: purchase_price || null,
      vendor: vendor || null,
      location: location || null,
      notes: notes || null,
      specifications: specifications || {},
      status: status || "active",
      created_by: sessionData.userId,
    })

    // Log activity
    await logActivity({
      entityType: "product",
      entityId: product._id,
      action: "create",
      performedBy: sessionData.userId,
      performedByType: "user",
      performedByName: sessionData.fullName,
      newValues: { product_code: productCode, name },
      details: `Created product ${productCode} - ${name}`,
    })

    return NextResponse.json({
      product: {
        ...product.toObject(),
        id: product._id.toString(),
      },
    }, { status: 201 })
  } catch (error) {
    console.error("[v0] Create product error:", error)
    return NextResponse.json({ message: "Internal server error", error: String(error) }, { status: 500 })
  }
}
