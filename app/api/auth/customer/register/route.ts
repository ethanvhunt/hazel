import connectDB from "@/lib/mongodb"
import Customer from "@/models/Customer"
import { hashPassword } from "@/lib/auth"
import { logActivity } from "@/lib/activity-logger"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    await connectDB()
    
    const { email, password, companyName, contactPerson, phone, address } = await request.json()

    if (!email || !password || !companyName || !contactPerson) {
      return NextResponse.json(
        { message: "Email, password, company name, and contact person are required" },
        { status: 400 },
      )
    }

    if (password.length < 6) {
      return NextResponse.json({ message: "Password must be at least 6 characters" }, { status: 400 })
    }

    // Check if customer already exists
    const existingCustomer = await Customer.findOne({ email: email.toLowerCase() })

    if (existingCustomer) {
      return NextResponse.json({ message: "Email already exists" }, { status: 400 })
    }

    const passwordHash = hashPassword(password)

    // Create customer
    const customer = await Customer.create({
      email: email.toLowerCase(),
      password_hash: passwordHash,
      company_name: companyName,
      contact_person: contactPerson,
      phone: phone || null,
      address: address || null,
      is_active: true,
    })

    // Log activity
    await logActivity({
      entityType: "customer",
      entityId: customer._id,
      action: "create",
      performedBy: customer._id,
      performedByType: "customer",
      performedByName: companyName,
      newValues: { email, company_name: companyName },
      details: `New customer registration: ${companyName}`,
    })

    return NextResponse.json({
      message: "Registration successful",
      customer: {
        id: customer._id.toString(),
        email: customer.email,
        company_name: customer.company_name,
        contact_person: customer.contact_person,
      },
    })
  } catch (error) {
    console.error("[v0] Registration error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
