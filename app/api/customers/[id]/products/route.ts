import { connectToDatabase } from "@/lib/mongodb"
import { CustomerProduct, Product } from "@/models"
import { NextResponse } from "next/server"

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    
    await connectToDatabase()

    // Get all product assignments for this customer - using correct field name
    const assignments = await CustomerProduct.find({ customer_id: id }).lean()
    
    // Get product details
    const productIds = assignments.map((a: any) => a.product_id)
    const products = await Product.find({ _id: { $in: productIds } }).lean()

    // Create a map of assignments for easy lookup
    const assignmentMap = new Map(
      assignments.map((a: any) => [a.product_id.toString(), a])
    )

    // Transform for frontend compatibility with assignment details
    const transformed = products.map((p: any) => {
      const assignment = assignmentMap.get(p._id.toString())
      return {
        id: p._id.toString(),
        catalog_product_id: p._id.toString(),
        name: p.name,
        description: p.description,
        status: p.status,
        product_code: p.productCode,
        category: p.category,
        manufacturer: p.manufacturer,
        model: p.model,
        created_at: p.createdAt,
        assigned_at: assignment?.assigned_at || assignment?.created_at,
      }
    })

    return NextResponse.json(transformed)
  } catch (error) {
    console.error("Error fetching products:", error)
    return NextResponse.json({ message: "Error fetching products" }, { status: 500 })
  }
}
