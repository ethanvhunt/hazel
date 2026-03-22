import { connectToDatabase } from "@/lib/mongodb"
import { Notification } from "@/models"
import { NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function POST(request: Request) {
  try {
    await connectToDatabase()
    
    const cookieStore = await cookies()
    const teamSession = cookieStore.get("team-session")
    const customerSession = cookieStore.get("customer-session")

    if (!teamSession && !customerSession) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const { notificationIds } = await request.json()

    if (!notificationIds || notificationIds.length === 0) {
      return NextResponse.json({ message: "No notification IDs provided" }, { status: 400 })
    }

    await Notification.updateMany(
      { _id: { $in: notificationIds } },
      { $set: { read: true } }
    )

    return NextResponse.json({ message: "Notifications marked as read", success: true })
  } catch (error) {
    console.error("Error marking notifications as read:", error)
    return NextResponse.json({ message: "Error marking notifications" }, { status: 500 })
  }
}
