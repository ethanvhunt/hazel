import { connectToDatabase } from "@/lib/mongodb"
import { CustomerProduct, Product } from "@/models"
import { NextResponse } from "next/server"

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    
    await connectToDatabase()

    // Get all product assignments for this customer
    const assignments = await CustomerProduct.find({ customerId: id, isActive: true }).lean()
    
    // Get product details
    const productIds = assignments.map((a: any) => a.productId)
    const products = await Product.find({ _id: { $in: productIds } }).lean()

    // Transform for frontend compatibility
    const transformed = products.map((p: any) => ({
      id: p._id.toString(),
      name: p.name,
      description: p.description,
      status: p.status,
      product_code: p.productCode,
      created_at: p.createdAt,
    }))

    return NextResponse.json(transformed)
  } catch (error) {
    console.error("Error fetching products:", error)
    return NextResponse.json({ message: "Error fetching products" }, { status: 500 })
  }
}
