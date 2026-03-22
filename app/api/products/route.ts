import { sql } from "@/lib/db"
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

    // Customer portal - fetch assigned products via customer_product_assignments
    if (customerSession) {
      const session = JSON.parse(customerSession)
      const cid = customerId || session.customerId

      let query = sql`
        SELECT 
          cp.id,
          cp.product_code,
          cp.name,
          cp.description,
          cp.category_id,
          cp.brand,
          cp.model,
          cp.serial_number,
          cp.specifications,
          cp.status,
          cp.created_at,
          cp.updated_at,
          pc.name as category_name,
          cpa.assigned_at,
          cpa.notes as assignment_notes
        FROM catalog_products cp
        JOIN customer_product_assignments cpa ON cp.id = cpa.product_id
        LEFT JOIN product_categories pc ON cp.category_id = pc.id
        WHERE cpa.customer_id = ${cid}
      `

      if (search) {
        query = sql`
          SELECT 
            cp.id,
            cp.product_code,
            cp.name,
            cp.description,
            cp.category_id,
            cp.brand,
            cp.model,
            cp.serial_number,
            cp.specifications,
            cp.status,
            cp.created_at,
            cp.updated_at,
            pc.name as category_name,
            cpa.assigned_at,
            cpa.notes as assignment_notes
          FROM catalog_products cp
          JOIN customer_product_assignments cpa ON cp.id = cpa.product_id
          LEFT JOIN product_categories pc ON cp.category_id = pc.id
          WHERE cpa.customer_id = ${cid}
            AND (LOWER(cp.name) LIKE ${`%${search.toLowerCase()}%`} 
                 OR LOWER(cp.product_code) LIKE ${`%${search.toLowerCase()}%`}
                 OR LOWER(cp.brand) LIKE ${`%${search.toLowerCase()}%`}
                 OR LOWER(cp.model) LIKE ${`%${search.toLowerCase()}%`})
          ORDER BY cp.name ASC
        `
      } else {
        query = sql`
          SELECT 
            cp.id,
            cp.product_code,
            cp.name,
            cp.description,
            cp.category_id,
            cp.brand,
            cp.model,
            cp.serial_number,
            cp.specifications,
            cp.status,
            cp.created_at,
            cp.updated_at,
            pc.name as category_name,
            cpa.assigned_at,
            cpa.notes as assignment_notes
          FROM catalog_products cp
          JOIN customer_product_assignments cpa ON cp.id = cpa.product_id
          LEFT JOIN product_categories pc ON cp.category_id = pc.id
          WHERE cpa.customer_id = ${cid}
          ORDER BY cp.name ASC
        `
      }

      const products = await query
      return NextResponse.json(products)
    }

    // Team portal - fetch all products or by customer
    if (teamSession) {
      if (customerId) {
        // Get assigned products for a specific customer
        const products = await sql`
          SELECT 
            cp.id,
            cp.product_code,
            cp.name,
            cp.description,
            cp.category_id,
            cp.brand,
            cp.model,
            cp.serial_number,
            cp.specifications,
            cp.status,
            cp.created_at,
            cp.updated_at,
            pc.name as category_name,
            cpa.assigned_at,
            cpa.notes as assignment_notes
          FROM catalog_products cp
          JOIN customer_product_assignments cpa ON cp.id = cpa.product_id
          LEFT JOIN product_categories pc ON cp.category_id = pc.id
          WHERE cpa.customer_id = ${customerId}
          ORDER BY cp.name ASC
        `
        return NextResponse.json(products)
      }

      // Get all catalog products
      const products = await sql`
        SELECT 
          cp.id,
          cp.product_code,
          cp.name,
          cp.description,
          cp.category_id,
          cp.brand,
          cp.model,
          cp.serial_number,
          cp.specifications,
          cp.status,
          cp.created_at,
          cp.updated_at,
          pc.name as category_name
        FROM catalog_products cp
        LEFT JOIN product_categories pc ON cp.category_id = pc.id
        ORDER BY cp.created_at DESC
      `
      return NextResponse.json(products)
    }

    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  } catch (error) {
    console.error("[v0] Get products error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies()
    const customerSession = cookieStore.get("customer-session")?.value

    if (!customerSession) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const session = JSON.parse(customerSession)
    const { name, description } = await request.json()

    // Legacy - create product in old products table (if still needed)
    const result = await sql`
      INSERT INTO products (customer_id, name, description, status)
      VALUES (${session.customerId}, ${name}, ${description}, 'active')
      RETURNING id, name, description, status, created_at, updated_at
    `

    return NextResponse.json({ product: result[0] }, { status: 201 })
  } catch (error) {
    console.error("[v0] Create product error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
