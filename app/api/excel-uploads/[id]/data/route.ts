import { sql } from "@/lib/db"
import { NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const cookieStore = await cookies()
    const teamSession = cookieStore.get("team-session")
    const customerSession = cookieStore.get("customer-session")

    if (!teamSession && !customerSession) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    // Get the upload info
    const upload = await sql`
      SELECT id, file_name FROM excel_uploads WHERE id = ${id}::uuid
    `

    if (upload.length === 0) {
      return NextResponse.json({ message: "Excel file not found" }, { status: 404 })
    }

    // Get all data for this upload
    const data = await sql`
      SELECT sheet_name, row_index, row_data
      FROM excel_data
      WHERE excel_upload_id = ${id}::uuid
      ORDER BY sheet_name, row_index
    `

    // Group data by sheet
    const sheets: Record<string, any[]> = {}
    data.forEach((row: any) => {
      if (!sheets[row.sheet_name]) {
        sheets[row.sheet_name] = []
      }
      sheets[row.sheet_name].push(row.row_data)
    })

    return NextResponse.json({
      fileName: upload[0].file_name,
      sheets,
    })
  } catch (error) {
    console.error("[v0] Error fetching Excel data:", error)
    return NextResponse.json({ message: "Error fetching data" }, { status: 500 })
  }
}
