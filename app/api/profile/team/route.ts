import { connectToDatabase } from "@/lib/mongodb"
import { User } from "@/models"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const cookieStore = await cookies()
    const sessionStr = cookieStore.get("team-session")?.value

    if (!sessionStr) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const session = JSON.parse(sessionStr)
    
    await connectToDatabase()
    
    const user = await User.findById(session.userId)
      .select("-passwordHash")
      .lean()

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 })
    }

    return NextResponse.json({
      user: {
        id: (user as any)._id.toString(),
        email: (user as any).email,
        full_name: (user as any).fullName,
        role: (user as any).role,
        created_at: (user as any).createdAt,
        updated_at: (user as any).updatedAt,
        gmail_address: (user as any).gmailAddress,
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
    const sessionStr = cookieStore.get("team-session")?.value

    if (!sessionStr) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const session = JSON.parse(sessionStr)
    const { fullName, gmailAddress } = await request.json()

    await connectToDatabase()

    await User.findByIdAndUpdate(session.userId, {
      fullName,
      gmailAddress: gmailAddress || null,
      updatedAt: new Date(),
    })

    return NextResponse.json({ success: true, message: "Profile updated" })
  } catch (error) {
    console.error("[v0] Update profile error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
