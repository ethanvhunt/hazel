import { connectToDatabase } from "@/lib/mongodb"
import ExcelUpload from "@/models/ExcelUpload"
import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { del } from "@vercel/blob"
import mongoose from "mongoose"

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectToDatabase()
    
    const cookieStore = await cookies()
    const teamSession = cookieStore.get("team-session")

    if (!teamSession) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const session = JSON.parse(teamSession.value)
    const userId = session.userId
    const { id } = await params

    // Only superadmin can delete
    if (session.role !== "super_admin") {
      return NextResponse.json({ message: "Only superadmin can delete files" }, { status: 403 })
    }

    const fileRecord = await ExcelUpload.findOne({
      _id: new mongoose.Types.ObjectId(id),
    })

    if (!fileRecord) {
      return NextResponse.json({ message: "File not found" }, { status: 404 })
    }

    const fileUrl = fileRecord.filePath
    if (fileUrl && fileUrl.includes("vercel-storage.com")) {
      try {
        await del(fileUrl)
      } catch (blobError) {
        console.error("Error deleting from Blob storage:", blobError)
      }
    }

    await ExcelUpload.deleteOne({ _id: new mongoose.Types.ObjectId(id) })

    return NextResponse.json({ message: "File deleted successfully" })
  } catch (error) {
    console.error("Error deleting Excel file:", error)
    return NextResponse.json({ message: "Error deleting file" }, { status: 500 })
  }
}
