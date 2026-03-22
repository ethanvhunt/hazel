import { sql } from "@/lib/db"
import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { del } from "@vercel/blob"

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const cookieStore = await cookies()
    const teamSession = cookieStore.get("team-session")

    if (!teamSession) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const session = JSON.parse(teamSession.value)
    const userId = session.userId
    const { id } = await params

    const fileRecord = await sql`
      SELECT file_path FROM excel_uploads 
      WHERE id = ${id} AND uploaded_by = ${userId}
    `

    if (fileRecord.length === 0) {
      return NextResponse.json({ message: "Unauthorized or file not found" }, { status: 403 })
    }

    const fileUrl = fileRecord[0].file_path
    if (fileUrl && fileUrl.includes("vercel-storage.com")) {
      try {
        await del(fileUrl)
      } catch (blobError) {
        console.error("[v0] Error deleting from Blob storage:", blobError)
        // Continue to delete from database even if blob deletion fails
      }
    }

    // Delete from database
    await sql`
      DELETE FROM excel_uploads 
      WHERE id = ${id} AND uploaded_by = ${userId}
    `

    return NextResponse.json({ message: "File deleted successfully" })
  } catch (error) {
    console.error("[v0] Error deleting Excel file:", error)
    return NextResponse.json({ message: "Error deleting file" }, { status: 500 })
  }
}
