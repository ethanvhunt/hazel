import { connectToDatabase } from "@/lib/mongodb"
import { CustomerUser } from "@/models"
import { hashPassword, verifyPassword } from "@/lib/auth"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies()
    const sessionStr = cookieStore.get("customer-session")?.value

    if (!sessionStr) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const session = JSON.parse(sessionStr)
    const { oldPassword, newPassword } = await request.json()

    await connectToDatabase()

    const customerUser = await CustomerUser.findById(session.userId).lean()

    if (!customerUser) {
      return NextResponse.json({ message: "User not found" }, { status: 404 })
    }

    if (!verifyPassword(oldPassword, (customerUser as any).passwordHash)) {
      return NextResponse.json({ message: "Invalid current password" }, { status: 401 })
    }

    const newHash = hashPassword(newPassword)
    await CustomerUser.findByIdAndUpdate(session.userId, {
      passwordHash: newHash,
      updatedAt: new Date(),
    })

    return NextResponse.json({ success: true, message: "Password changed successfully" })
  } catch (error) {
    console.error("[v0] Change password error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
