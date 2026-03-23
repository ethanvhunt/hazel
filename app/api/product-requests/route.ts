import { connectToDatabase } from "@/lib/mongodb"
import { ProductRequest, Customer, User, CustomerUser } from "@/models"
import { logActivity } from "@/lib/activity-logger"
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

    await connectToDatabase()

    let requests: any[]
    
    // Customer portal - fetch requests for their customer account
    if (customerSession) {
      let sessionData
      try {
        sessionData = JSON.parse(customerSession.value)
      } catch {
        return NextResponse.json({ message: "Invalid session" }, { status: 401 })
      }

      const custId = sessionData.customerId
      
      requests = await ProductRequest.find({ customerId: custId }).sort({ createdAt: -1 }).lean()
      const customer = await Customer.findById(custId).lean()
      
      requests = requests.map((r: any) => ({
        id: r._id.toString(),
        customer_id: r.customerId,
        product_name: r.productName,
        description: r.description,
        status: r.status,
        reviewed_by: r.reviewedBy,
        review_notes: r.reviewNotes,
        created_at: r.createdAt,
        updated_at: r.updatedAt,
        company_name: (customer as any)?.company_name,
      }))

      return NextResponse.json(requests)
    }
    
    // Team portal
    if (customerId) {
      requests = await ProductRequest.find({ customerId }).sort({ createdAt: -1 }).lean()
      const customer = await Customer.findById(customerId).lean()
      
      requests = requests.map((r: any) => ({
        id: r._id.toString(),
        customer_id: r.customerId,
        product_name: r.productName,
        description: r.description,
        status: r.status,
        reviewed_by: r.reviewedBy,
        review_notes: r.reviewNotes,
        created_at: r.createdAt,
        updated_at: r.updatedAt,
        company_name: (customer as any)?.company_name,
      }))
    } else {
      // Fetch all requests for team members
      requests = await ProductRequest.find().sort({ createdAt: -1 }).lean()
      
      // Get customer and reviewer info
      const customerIds = [...new Set(requests.map((r: any) => r.customerId))]
      const reviewerIds = [...new Set(requests.filter((r: any) => r.reviewedBy).map((r: any) => r.reviewedBy))]
      
      const customers = await Customer.find({ _id: { $in: customerIds } }).lean()
      const reviewers = await User.find({ _id: { $in: reviewerIds } }).lean()
      
      const customerMap = new Map(customers.map((c: any) => [c._id.toString(), c]))
      const reviewerMap = new Map(reviewers.map((r: any) => [r._id.toString(), r]))

      requests = requests.map((r: any) => {
        const customer = customerMap.get(r.customerId)
        const reviewer = reviewerMap.get(r.reviewedBy)
        return {
          id: r._id.toString(),
          customer_id: r.customerId,
          product_name: r.productName,
          description: r.description,
          status: r.status,
          reviewed_by: r.reviewedBy,
          review_notes: r.reviewNotes,
          created_at: r.createdAt,
          updated_at: r.updatedAt,
          company_name: (customer as any)?.company_name,
          reviewer_name: (reviewer as any)?.full_name,
        }
      })
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
    const customerUserId = sessionData.userId // The customer_user who created the request

    if (!customerId) {
      return NextResponse.json({ message: "Customer ID not found in session" }, { status: 401 })
    }

    const { productName, description } = await request.json()

    if (!productName || !description) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 })
    }

    await connectToDatabase()

    const newRequest = await ProductRequest.create({
      customerId,
      productName,
      description,
      status: "pending",
      createdBy: customerUserId || customerId,
    })

    await logActivity({
      entityType: "product_request",
      entityId: newRequest._id.toString(),
      action: "create",
      performedBy: customerUserId || customerId,
      performedByType: customerUserId ? "customer_user" : "customer",
      performedByName: sessionData.fullName || sessionData.companyName,
      newValues: { productName, description },
      details: `Created product request: ${productName}`,
    })

    return NextResponse.json({
      id: newRequest._id.toString(),
      customer_id: newRequest.customerId,
      product_name: newRequest.productName,
      description: newRequest.description,
      status: newRequest.status,
      created_at: newRequest.createdAt,
    }, { status: 201 })
  } catch (error) {
    console.error("[v0] Error creating product request:", error)
    return NextResponse.json({ message: "Error creating product request" }, { status: 500 })
  }
}
