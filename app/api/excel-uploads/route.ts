import { sql } from "@/lib/db"
import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { put } from "@vercel/blob"
import * as XLSX from "xlsx"

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

    if (!customerId) {
      return NextResponse.json({ message: "Customer ID required" }, { status: 400 })
    }

    const uploads = await sql`
      SELECT 
        e.id, e.customer_id, e.file_name, e.file_size, 
        e.file_type, e.description, e.created_at, e.file_path,
        u.full_name as uploaded_by_name
      FROM excel_uploads e
      LEFT JOIN users u ON e.uploaded_by = u.id
      WHERE e.customer_id = ${customerId}
      ORDER BY e.created_at DESC
    `

    return NextResponse.json({ uploads })
  } catch (error) {
    console.error("[v0] Error fetching Excel uploads:", error)
    return NextResponse.json({ message: "Error fetching uploads" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies()
    const teamSession = cookieStore.get("team-session")

    if (!teamSession) {
      return NextResponse.json({ message: "Unauthorized - Team members only" }, { status: 401 })
    }

    const session = JSON.parse(teamSession.value)
    const userId = session.userId

    const formData = await request.formData()
    const file = formData.get("file") as File
    const customerId = formData.get("customerId") as string
    const description = formData.get("description") as string

    if (!file || !customerId) {
      return NextResponse.json({ message: "File and customer ID required" }, { status: 400 })
    }

    const allowedTypes = ["xlsx", "xls", "csv"]
    const fileExtension = file.name.split(".").pop()?.toLowerCase()

    if (!fileExtension || !allowedTypes.includes(fileExtension)) {
      return NextResponse.json({ message: "Only Excel files (.xlsx, .xls, .csv) are allowed" }, { status: 400 })
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ message: "File size must be less than 10MB" }, { status: 400 })
    }

    const fileName = `${Date.now()}-${file.name}`
    let blobUrl: string

    try {
      const blob = await put(fileName, file, {
        access: "public",
      })
      blobUrl = blob.url
    } catch (blobError) {
      console.error("[v0] Error uploading to Blob storage:", blobError)
      return NextResponse.json({ message: "Error uploading file to storage" }, { status: 500 })
    }

    try {
      const arrayBuffer = await file.arrayBuffer()
      const workbook = XLSX.read(arrayBuffer, { type: "array" })

      const fileSizeInt = Math.floor(file.size)
      const descriptionText = description || null

      const upload = await sql`
        INSERT INTO excel_uploads (customer_id, uploaded_by, file_name, file_size, file_path, file_type, description)
        VALUES (${customerId}::uuid, ${userId}::uuid, ${file.name}::varchar, ${fileSizeInt}::integer, ${blobUrl}::varchar, ${fileExtension}::varchar, ${descriptionText}::text)
        RETURNING id, file_name, file_size, created_at
      `

      const uploadId = upload[0].id

      for (const sheetName of workbook.SheetNames) {
        const worksheet = workbook.Sheets[sheetName]
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "" })

        // Store each row in the database with explicit JSONB type casting
        for (let i = 0; i < jsonData.length; i++) {
          const rowData = jsonData[i] as any[]
          const rowDataJson = JSON.stringify(rowData)

          await sql`
            INSERT INTO excel_data (excel_upload_id, sheet_name, row_index, row_data)
            VALUES (${uploadId}::uuid, ${sheetName}::varchar, ${i}::integer, ${rowDataJson}::jsonb)
          `
        }
      }

      const activityData = JSON.stringify({ file_name: file.name, customer_id: customerId })
      await sql`
        INSERT INTO activity_logs (entity_type, entity_id, action, performed_by, new_values)
        VALUES ('excel_upload'::varchar, ${uploadId}::uuid, 'create'::varchar, ${userId}::uuid, ${activityData}::jsonb)
      `

      return NextResponse.json({ message: "File uploaded and parsed successfully", upload: upload[0] }, { status: 201 })
    } catch (parseError) {
      console.error("[v0] Error parsing Excel file:", parseError)
      return NextResponse.json({ message: "Error parsing Excel file" }, { status: 500 })
    }
  } catch (error) {
    console.error("[v0] Error uploading Excel file:", error)
    return NextResponse.json({ message: "Error uploading file" }, { status: 500 })
  }
}
