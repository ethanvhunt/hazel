import connectDB from "@/lib/mongodb"
import Customer from "@/models/Customer"
import CustomerUser from "@/models/CustomerUser"
import { verifyPassword } from "@/lib/auth"
import { logActivity } from "@/lib/activity-logger"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    await connectDB()
    
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json({ message: "Email and password are required" }, { status: 400 })
    }

    // First check customer_users table (customer_admin and customer_agent)
    const customerUser = await CustomerUser.findOne({ email: email.toLowerCase() })
      .populate("customer_id", "company_name")

    if (customerUser) {
      if (!customerUser.is_active) {
        return NextResponse.json({ message: "Account is deactivated. Contact your admin." }, { status: 401 })
      }

      if (!verifyPassword(password, customerUser.password_hash)) {
        return NextResponse.json({ message: "Invalid credentials" }, { status: 401 })
      }

      const customer = customerUser.customer_id as any

      const cookieStore = await cookies()
      cookieStore.set(
        "customer-session",
        JSON.stringify({
          userId: customerUser._id.toString(),
          customerId: customer._id.toString(),
          email: customerUser.email,
          fullName: customerUser.full_name,
          companyName: customer.company_name,
          mobileNumber: customerUser.mobile_number,
          role: customerUser.role,
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

      // Log the login activity
      await logActivity({
        entityType: "customer_user",
        entityId: customerUser._id,
        action: "login",
        performedBy: customerUser._id,
        performedByType: "customer_user",
        performedByName: customerUser.full_name,
        details: `Customer user ${customerUser.full_name} logged in`,
      })

      return NextResponse.json({
        success: true,
        message: "Login successful",
        customer: { 
          id: customer._id.toString(), 
          email: customerUser.email,
          role: customerUser.role,
        },
      })
    }

    // Fall back to checking the main customers table (legacy login)
    const customer = await Customer.findOne({ email: email.toLowerCase() })

    if (!customer) {
      return NextResponse.json({ message: "Invalid credentials" }, { status: 401 })
    }

    if (!customer.is_active) {
      return NextResponse.json({ message: "Account is deactivated. Contact your admin." }, { status: 401 })
    }

    if (!verifyPassword(password, customer.password_hash)) {
      return NextResponse.json({ message: "Invalid credentials" }, { status: 401 })
    }

    const cookieStore = await cookies()
    cookieStore.set(
      "customer-session",
      JSON.stringify({
        customerId: customer._id.toString(),
        email: customer.email,
        companyName: customer.company_name,
        contactPerson: customer.contact_person,
        role: "customer_admin",
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

    // Log the login activity
    await logActivity({
      entityType: "customer",
      entityId: customer._id,
      action: "login",
      performedBy: customer._id,
      performedByType: "customer",
      performedByName: customer.company_name,
      details: `Customer ${customer.company_name} logged in`,
    })

    return NextResponse.json({
      success: true,
      message: "Login successful",
      customer: { id: customer._id.toString(), email: customer.email, role: "customer_admin" },
    })
  } catch (error) {
    console.error("[v0] Customer login error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
