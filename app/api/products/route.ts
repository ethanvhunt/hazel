import { connectToDatabase } from "@/lib/mongodb"
import { Product, CustomerProduct, ProductCategory } from "@/models"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies()
    const customerSession = cookieStore.get("customer-session")?.value
    const teamSession = cookieStore.get("team-session")?.value

    const { searchParams } = new URL(request.url)
    const customerId = searchParams.get("customerId")
    const search = searchParams.get("search")

    await connectToDatabase()

    // Customer portal - fetch assigned products via customer_product_assignments
    if (customerSession) {
      const session = JSON.parse(customerSession)
      const cid = customerId || session.customerId

      // Get all product assignments for this customer using correct field names
      const assignments = await CustomerProduct.find({ customer_id: cid, is_active: true }).lean()
      const productIds = assignments.map((a: any) => a.product_id)

      let query: any = { _id: { $in: productIds } }
      
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: "i" } },
          { productCode: { $regex: search, $options: "i" } },
          { brand: { $regex: search, $options: "i" } },
          { model: { $regex: search, $options: "i" } },
        ]
      }

      const products = await Product.find(query).sort({ name: 1 }).lean()

      // Get category info and merge with assignment data
      const categoryIds = products.map((p: any) => p.categoryId).filter(Boolean)
      const categories = await ProductCategory.find({ _id: { $in: categoryIds } }).lean()
      const categoryMap = new Map(categories.map((c: any) => [c._id.toString(), c]))

      const assignmentMap = new Map(assignments.map((a: any) => [a.product_id.toString(), a]))

      const transformed = products.map((p: any) => {
        const category = categoryMap.get(p.categoryId?.toString())
        const assignment = assignmentMap.get(p._id.toString())
        return {
          id: p._id.toString(),
          product_code: p.productCode,
          name: p.name,
          description: p.description,
          category_id: p.categoryId,
          brand: p.brand,
          model: p.model,
          serial_number: p.serialNumber,
          specifications: p.specifications,
          status: p.status,
          created_at: p.createdAt,
          updated_at: p.updatedAt,
          category_name: (category as any)?.name,
          assigned_at: (assignment as any)?.assigned_at,
          assignment_notes: (assignment as any)?.notes,
        }
      })

      return NextResponse.json(transformed)
    }

    // Team portal - fetch all products or by customer
    if (teamSession) {
      if (customerId) {
        // Get assigned products for a specific customer using correct field names
        const assignments = await CustomerProduct.find({ customer_id: customerId, is_active: true }).lean()
        const productIds = assignments.map((a: any) => a.product_id)
        
        const products = await Product.find({ _id: { $in: productIds } }).sort({ name: 1 }).lean()
        
        const categoryIds = products.map((p: any) => p.categoryId).filter(Boolean)
        const categories = await ProductCategory.find({ _id: { $in: categoryIds } }).lean()
        const categoryMap = new Map(categories.map((c: any) => [c._id.toString(), c]))
        const assignmentMap = new Map(assignments.map((a: any) => [a.product_id.toString(), a]))

        const transformed = products.map((p: any) => {
          const category = categoryMap.get(p.categoryId?.toString())
          const assignment = assignmentMap.get(p._id.toString())
          return {
            id: p._id.toString(),
            product_code: p.productCode,
            name: p.name,
            description: p.description,
            category_id: p.categoryId,
            brand: p.brand,
            model: p.model,
            serial_number: p.serialNumber,
            specifications: p.specifications,
            status: p.status,
            created_at: p.createdAt,
            updated_at: p.updatedAt,
            category_name: (category as any)?.name,
            assigned_at: (assignment as any)?.assigned_at,
            assignment_notes: (assignment as any)?.notes,
          }
        })

        return NextResponse.json(transformed)
      }

      // Get all catalog products
      const products = await Product.find().sort({ createdAt: -1 }).lean()
      
      const categoryIds = products.map((p: any) => p.categoryId).filter(Boolean)
      const categories = await ProductCategory.find({ _id: { $in: categoryIds } }).lean()
      const categoryMap = new Map(categories.map((c: any) => [c._id.toString(), c]))

      const transformed = products.map((p: any) => {
        const category = categoryMap.get(p.categoryId?.toString())
        return {
          id: p._id.toString(),
          product_code: p.productCode,
          name: p.name,
          description: p.description,
          category_id: p.categoryId,
          brand: p.brand,
          model: p.model,
          serial_number: p.serialNumber,
          specifications: p.specifications,
          status: p.status,
          created_at: p.createdAt,
          updated_at: p.updatedAt,
          category_name: (category as any)?.name,
        }
      })

      return NextResponse.json(transformed)
    }

    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  } catch (error) {
    console.error("[v0] Get products error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
