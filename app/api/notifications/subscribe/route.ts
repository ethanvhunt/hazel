import { connectToDatabase } from "@/lib/mongodb"
import { Notification } from "@/models"
import { NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function GET(request: Request) {
  try {
    await connectToDatabase()
    
    const cookieStore = await cookies()
    const teamSession = cookieStore.get("team-session")
    const customerSession = cookieStore.get("customer-session")

    let userId: string | null = null
    let userType: "team" | "customer" | null = null

    if (teamSession) {
      try {
        const session = JSON.parse(teamSession.value)
        userId = session.userId
        userType = "team"
      } catch (e) {
        return NextResponse.json({ message: "Invalid session" }, { status: 401 })
      }
    } else if (customerSession) {
      try {
        const session = JSON.parse(customerSession.value)
        userId = session.customerId
        userType = "customer"
      } catch (e) {
        return NextResponse.json({ message: "Invalid session" }, { status: 401 })
      }
    }

    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const limit = Number.parseInt(searchParams.get("limit") || "50")

    const notifications = await Notification.find({
      userId,
      read: false,
    })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean()

    return NextResponse.json(notifications)
  } catch (error) {
    console.error("Error fetching notifications:", error)
    return NextResponse.json({ message: "Error fetching notifications" }, { status: 500 })
  }
}
