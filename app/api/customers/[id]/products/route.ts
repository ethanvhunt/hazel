import { sql } from "@/lib/db"
import { NextResponse } from "next/server"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const products = await sql`
      SELECT id, name, description, status, created_at
      FROM products
      WHERE customer_id = ${params.id}
      ORDER BY created_at DESC
    `
    return NextResponse.json(products)
  } catch (error) {
    console.error("Error fetching products:", error)
    return NextResponse.json({ message: "Error fetching products" }, { status: 500 })
  }
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const { name, description } = await request.json()

    const result = await sql`
      INSERT INTO products (customer_id, name, description)
      VALUES (${params.id}, ${name}, ${description || null})
      RETURNING *
    `

    return NextResponse.json(result[0], { status: 201 })
  } catch (error) {
    console.error("Error creating product:", error)
    return NextResponse.json({ message: "Error creating product" }, { status: 500 })
  }
}
