import { connectToDatabase } from "@/lib/mongodb"
import ExcelUpload from "@/models/ExcelUpload"
import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import mongoose from "mongoose"

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectToDatabase()
    
    const { id } = await params
    const cookieStore = await cookies()
    const teamSession = cookieStore.get("team-session")
    const customerSession = cookieStore.get("customer-session")

    if (!teamSession && !customerSession) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const upload = await ExcelUpload.findById(new mongoose.Types.ObjectId(id)).lean()

    if (!upload) {
      return NextResponse.json({ message: "Excel file not found" }, { status: 404 })
    }

    // Transform sheets array into object format
    const sheets: Record<string, any[][]> = {}
    upload.sheets.forEach((sheet: { sheetName: string; data: any[][] }) => {
      sheets[sheet.sheetName] = sheet.data
    })

    return NextResponse.json({
      fileName: upload.fileName,
      sheets,
    })
  } catch (error) {
    console.error("Error fetching Excel data:", error)
    return NextResponse.json({ message: "Error fetching data" }, { status: 500 })
  }
}
