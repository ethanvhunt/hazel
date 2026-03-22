import { sql } from "@/lib/db"
import { NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies()
    const teamSession = cookieStore.get("team-session")
    const customerSession = cookieStore.get("customer-session")

    if (!teamSession && !customerSession) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const customerId = searchParams.get("customerId")

    let requests
    if (customerId) {
      requests = await sql`
        SELECT pr.*, c.company_name
        FROM product_requests pr
        JOIN customers c ON pr.customer_id = c.id
        WHERE pr.customer_id = ${customerId}
        ORDER BY pr.created_at DESC
      `
    } else {
      // Fetch all requests for team members
      requests = await sql`
        SELECT pr.*, c.company_name, u.full_name as reviewer_name
        FROM product_requests pr
        JOIN customers c ON pr.customer_id = c.id
        LEFT JOIN users u ON pr.reviewed_by = u.id
        ORDER BY pr.created_at DESC
      `
    }

    return NextResponse.json(requests)
  } catch (error) {
    console.error("[v0] Error fetching product requests:", error)
    return NextResponse.json({ message: "Error fetching product requests" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies()
    const customerSession = cookieStore.get("customer-session")

    if (!customerSession) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    let sessionData
    try {
      sessionData = JSON.parse(customerSession.value)
    } catch {
      return NextResponse.json({ message: "Invalid session" }, { status: 401 })
    }

    const customerId = sessionData.customerId

    if (!customerId) {
      return NextResponse.json({ message: "Customer ID not found in session" }, { status: 401 })
    }

    const { productName, description } = await request.json()

    if (!productName || !description) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 })
    }

    const result = await sql`
      INSERT INTO product_requests (customer_id, product_name, description, status)
      VALUES (${customerId}, ${productName}, ${description}, 'pending')
      RETURNING *
    `

    await sql`
      INSERT INTO activity_logs (entity_type, entity_id, action, performed_by, new_values)
      VALUES ('product_request', ${result[0].id}, 'create', ${customerId}, ${JSON.stringify({ productName, description })})
    `

    return NextResponse.json(result[0], { status: 201 })
  } catch (error) {
    console.error("[v0] Error creating product request:", error)
    return NextResponse.json({ message: "Error creating product request" }, { status: 500 })
  }
}
