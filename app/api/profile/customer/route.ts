import { connectToDatabase } from "@/lib/mongodb"
import { Customer } from "@/models"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const cookieStore = await cookies()
    const sessionStr = cookieStore.get("customer-session")?.value

    if (!sessionStr) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const session = JSON.parse(sessionStr)
    
    await connectToDatabase()
    
    const customer = await Customer.findById(session.customerId).lean()

    if (!customer) {
      return NextResponse.json({ message: "Customer not found" }, { status: 404 })
    }

    return NextResponse.json({
      customer: {
        id: (customer as any)._id.toString(),
        email: (customer as any).email,
        company_name: (customer as any).companyName,
        contact_person: (customer as any).contactPerson,
        phone: (customer as any).phone,
        created_at: (customer as any).createdAt,
        updated_at: (customer as any).updatedAt,
      },
    })
  } catch (error) {
    console.error("[v0] Get profile error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const cookieStore = await cookies()
    const sessionStr = cookieStore.get("customer-session")?.value

    if (!sessionStr) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const session = JSON.parse(sessionStr)
    const { contactPerson, phone } = await request.json()

    await connectToDatabase()

    await Customer.findByIdAndUpdate(session.customerId, {
      contactPerson,
      phone,
      updatedAt: new Date(),
    })

    return NextResponse.json({ success: true, message: "Profile updated" })
  } catch (error) {
    console.error("[v0] Update profile error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
