import { sql } from "@/lib/db"
import { verifyPassword } from "@/lib/auth"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json({ message: "Email and password are required" }, { status: 400 })
    }

    // First check customer_users table (customer_admin and customer_agent)
    const customerUsers = await sql`
      SELECT cu.id, cu.email, cu.password_hash, cu.full_name, cu.mobile_number, cu.role, cu.is_active, cu.customer_id,
             c.company_name
      FROM customer_users cu
      JOIN customers c ON cu.customer_id = c.id
      WHERE cu.email = ${email}
    `

    if (customerUsers.length > 0) {
      const customerUser = customerUsers[0]

      if (!customerUser.is_active) {
        return NextResponse.json({ message: "Account is deactivated. Contact your admin." }, { status: 401 })
      }

      if (!verifyPassword(password, customerUser.password_hash)) {
        return NextResponse.json({ message: "Invalid credentials" }, { status: 401 })
      }

      const cookieStore = await cookies()
      cookieStore.set(
        "customer-session",
        JSON.stringify({
          userId: customerUser.id,
          customerId: customerUser.customer_id,
          email: customerUser.email,
          fullName: customerUser.full_name,
          companyName: customerUser.company_name,
          mobileNumber: customerUser.mobile_number,
          role: customerUser.role, // customer_admin or customer_agent
          userType: "customer_user",
        }),
        {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          path: "/",
          maxAge: 7 * 24 * 60 * 60,
        },
      )

      return NextResponse.json({
        success: true,
        message: "Login successful",
        customer: { 
          id: customerUser.customer_id, 
          email: customerUser.email,
          role: customerUser.role,
        },
      })
    }

    // Fall back to checking the main customers table (legacy login)
    const customers = await sql`
      SELECT id, email, password_hash, company_name, contact_person
      FROM customers
      WHERE email = ${email}
    `

    if (customers.length === 0) {
      return NextResponse.json({ message: "Invalid credentials" }, { status: 401 })
    }

    const customer = customers[0]

    if (!verifyPassword(password, customer.password_hash)) {
      return NextResponse.json({ message: "Invalid credentials" }, { status: 401 })
    }

    const cookieStore = await cookies()
    cookieStore.set(
      "customer-session",
      JSON.stringify({
        customerId: customer.id,
        email: customer.email,
        companyName: customer.company_name,
        contactPerson: customer.contact_person,
        role: "customer_admin", // Main customer login gets admin access
        userType: "customer",
      }),
      {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 7 * 24 * 60 * 60,
      },
    )

    return NextResponse.json({
      success: true,
      message: "Login successful",
      customer: { id: customer.id, email: customer.email, role: "customer_admin" },
    })
  } catch (error) {
    console.error("[v0] Customer login error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
