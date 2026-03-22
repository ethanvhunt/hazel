import { sql } from "@/lib/db"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

// GET all categories
export async function GET() {
  try {
    const cookieStore = await cookies()
    const teamSession = cookieStore.get("team-session")?.value
    const customerSession = cookieStore.get("customer-session")?.value

    if (!teamSession && !customerSession) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const categories = await sql`
      SELECT * FROM product_categories ORDER BY name ASC
    `

    return NextResponse.json(categories)
  } catch (error) {
    console.error("[v0] Get categories error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

// POST - Create new category (super_admin only)
export async function POST(request: Request) {
  try {
    const cookieStore = await cookies()
    const teamSession = cookieStore.get("team-session")?.value

    if (!teamSession) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const sessionData = JSON.parse(teamSession)
    
    if (sessionData.role !== "super_admin") {
      return NextResponse.json({ message: "Only super admin can create categories" }, { status: 403 })
    }

    const { name, description } = await request.json()

    if (!name) {
      return NextResponse.json({ message: "Name is required" }, { status: 400 })
    }

    // Generate slug
    const slug = name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')

    const result = await sql`
      INSERT INTO product_categories (name, slug, description)
      VALUES (${name}, ${slug}, ${description || null})
      RETURNING *
    `

    return NextResponse.json({ category: result[0] }, { status: 201 })
  } catch (error) {
    console.error("[v0] Create category error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
