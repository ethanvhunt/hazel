import { sql } from "@/lib/db"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { hashPassword } from "@/lib/auth"
import crypto from "crypto"

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies()
    const teamSession = cookieStore.get("team-session")?.value

    if (!teamSession) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const session = JSON.parse(teamSession)

    // Only team members can create customers
    if (!["super_admin", "admin", "manager", "agent"].includes(session.role)) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 })
    }

    const { companyName, contactPerson, email, phone, products } = await request.json()

    if (!companyName || !contactPerson || !email) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 })
    }

    // Generate random password for customer
    const generatedPassword = crypto.randomBytes(8).toString("hex")
    const passwordHash = hashPassword(generatedPassword)

    const customerResult = await sql`
      INSERT INTO customers (email, password_hash, company_name, contact_person, phone)
      VALUES (${email}, ${passwordHash}, ${companyName}, ${contactPerson}, ${phone || null})
      RETURNING id, email, company_name, contact_person, phone, created_at
    `

    const customerId = customerResult[0].id

    if (products && products.length > 0) {
      for (const product of products) {
        await sql`
          INSERT INTO products (customer_id, name, description, status)
          VALUES (${customerId}, ${product.name}, ${product.description}, 'active')
        `
      }
    }

    await sql`
      INSERT INTO activity_logs (entity_type, entity_id, action, performed_by, old_values, new_values)
      VALUES ('customer', ${customerId}, 'create', ${session.userId}, null, ${JSON.stringify({
        companyName,
        contactPerson,
        email,
      })})
    `

    return NextResponse.json(
      {
        message: "Customer created successfully",
        customer: customerResult[0],
        generatedPassword,
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("[v0] Error creating customer:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
