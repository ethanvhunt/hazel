import { sql } from "@/lib/db"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { ROLES } from "@/lib/constants"

// GET all products in the global catalog (for team members)
export async function GET(request: Request) {
  try {
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
    const categoryParam = searchParams.get("category")
    const statusParam = searchParams.get("status")
    const search = searchParams.get("search")
    
    // Treat "all" as no filter
    const category = categoryParam === "all" ? null : categoryParam
    const status = statusParam === "all" ? null : statusParam

    let products
    if (category && status && search) {
      products = await sql`
        SELECT cp.*, pc.name as category_name, pc.slug as category_slug
        FROM catalog_products cp
        LEFT JOIN product_categories pc ON cp.category_id = pc.id
        WHERE pc.slug = ${category} AND cp.status = ${status} 
          AND (cp.name ILIKE ${'%' + search + '%'} OR cp.product_code ILIKE ${'%' + search + '%'})
        ORDER BY cp.created_at DESC
      `
    } else if (category && status) {
      products = await sql`
        SELECT cp.*, pc.name as category_name, pc.slug as category_slug
        FROM catalog_products cp
        LEFT JOIN product_categories pc ON cp.category_id = pc.id
        WHERE pc.slug = ${category} AND cp.status = ${status}
        ORDER BY cp.created_at DESC
      `
    } else if (category && search) {
      products = await sql`
        SELECT cp.*, pc.name as category_name, pc.slug as category_slug
        FROM catalog_products cp
        LEFT JOIN product_categories pc ON cp.category_id = pc.id
        WHERE pc.slug = ${category} 
          AND (cp.name ILIKE ${'%' + search + '%'} OR cp.product_code ILIKE ${'%' + search + '%'})
        ORDER BY cp.created_at DESC
      `
    } else if (status && search) {
      products = await sql`
        SELECT cp.*, pc.name as category_name, pc.slug as category_slug
        FROM catalog_products cp
        LEFT JOIN product_categories pc ON cp.category_id = pc.id
        WHERE cp.status = ${status} 
          AND (cp.name ILIKE ${'%' + search + '%'} OR cp.product_code ILIKE ${'%' + search + '%'})
        ORDER BY cp.created_at DESC
      `
    } else if (category) {
      products = await sql`
        SELECT cp.*, pc.name as category_name, pc.slug as category_slug
        FROM catalog_products cp
        LEFT JOIN product_categories pc ON cp.category_id = pc.id
        WHERE pc.slug = ${category}
        ORDER BY cp.created_at DESC
      `
    } else if (status) {
      products = await sql`
        SELECT cp.*, pc.name as category_name, pc.slug as category_slug
        FROM catalog_products cp
        LEFT JOIN product_categories pc ON cp.category_id = pc.id
        WHERE cp.status = ${status}
        ORDER BY cp.created_at DESC
      `
    } else if (search) {
      products = await sql`
        SELECT cp.*, pc.name as category_name, pc.slug as category_slug
        FROM catalog_products cp
        LEFT JOIN product_categories pc ON cp.category_id = pc.id
        WHERE cp.name ILIKE ${'%' + search + '%'} OR cp.product_code ILIKE ${'%' + search + '%'}
        ORDER BY cp.created_at DESC
      `
    } else {
      products = await sql`
        SELECT cp.*, pc.name as category_name, pc.slug as category_slug
        FROM catalog_products cp
        LEFT JOIN product_categories pc ON cp.category_id = pc.id
        ORDER BY cp.created_at DESC
      `
    }

    return NextResponse.json(products)
  } catch (error) {
    console.error("[v0] Get catalog products error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

// POST - Create new product in global catalog
export async function POST(request: Request) {
  try {
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
    const { name, description, category_id, brand, model, serial_number, specifications, status } = body

    if (!name) {
      return NextResponse.json({ message: "Name is required" }, { status: 400 })
    }

    // Generate product code: PRD-XXXXXX using the sequence
    const codeResult = await sql`SELECT nextval('product_code_seq') as next_val`
    const nextNum = parseInt(codeResult[0].next_val)
    const productCode = `PRD-${String(nextNum).padStart(6, '0')}`

    const result = await sql`
      INSERT INTO catalog_products (
        product_code, name, description, category_id, brand, model,
        serial_number, specifications, status, created_by
      )
      VALUES (
        ${productCode}, ${name}, ${description || null}, ${category_id || null}, 
        ${brand || null}, ${model || null}, ${serial_number || null},
        ${specifications ? JSON.stringify(specifications) : null}::jsonb,
        ${status || 'active'}, ${sessionData.userId}
      )
      RETURNING *
    `

    // Log activity
    await sql`
      INSERT INTO activity_logs (entity_type, entity_id, action, performed_by, new_values)
      VALUES ('product', ${result[0].id}::uuid, 'create', ${sessionData.userId}::uuid, 
        ${JSON.stringify({ product_code: productCode, name })}::jsonb)
    `

    return NextResponse.json({ product: result[0] }, { status: 201 })
  } catch (error) {
    console.error("[v0] Create product error:", error)
    return NextResponse.json({ message: "Internal server error", error: String(error) }, { status: 500 })
  }
}
