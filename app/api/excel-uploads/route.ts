import { connectToDatabase } from "@/lib/mongodb"
import ExcelUpload from "@/models/ExcelUpload"
import { User, ActivityLog } from "@/models"
import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { put } from "@vercel/blob"
import * as XLSX from "xlsx"
import mongoose from "mongoose"

export async function GET(request: Request) {
  try {
    await connectToDatabase()
    
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

    const uploads = await ExcelUpload.aggregate([
      { $match: { customerId: new mongoose.Types.ObjectId(customerId) } },
      {
        $lookup: {
          from: "users",
          localField: "uploadedBy",
          foreignField: "_id",
          as: "uploader",
        },
      },
      { $unwind: { path: "$uploader", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          id: "$_id",
          customerId: 1,
          fileName: 1,
          fileSize: 1,
          fileType: 1,
          description: 1,
          createdAt: 1,
          filePath: 1,
          uploadedByName: "$uploader.fullName",
        },
      },
      { $sort: { createdAt: -1 } },
    ])

    return NextResponse.json({ uploads })
  } catch (error) {
    console.error("Error fetching Excel uploads:", error)
    return NextResponse.json({ message: "Error fetching uploads" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    await connectToDatabase()
    
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
      console.error("Error uploading to Blob storage:", blobError)
      return NextResponse.json({ message: "Error uploading file to storage" }, { status: 500 })
    }

    try {
      const arrayBuffer = await file.arrayBuffer()
      const workbook = XLSX.read(arrayBuffer, { type: "array" })

      const sheets = workbook.SheetNames.map((sheetName) => {
        const worksheet = workbook.Sheets[sheetName]
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "" })
        return {
          sheetName,
          data: jsonData as any[][],
        }
      })

      const upload = await ExcelUpload.create({
        customerId: new mongoose.Types.ObjectId(customerId),
        uploadedBy: new mongoose.Types.ObjectId(userId),
        fileName: file.name,
        fileSize: Math.floor(file.size),
        filePath: blobUrl,
        fileType: fileExtension,
        description: description || undefined,
        sheets,
      })

      await ActivityLog.create({
        entityType: "excel_upload",
        entityId: upload._id,
        action: "create",
        performedBy: new mongoose.Types.ObjectId(userId),
        performedByType: "team",
        newValues: { fileName: file.name, customerId },
      })

      return NextResponse.json(
        {
          message: "File uploaded and parsed successfully",
          upload: {
            id: upload._id,
            fileName: upload.fileName,
            fileSize: upload.fileSize,
            createdAt: upload.createdAt,
          },
        },
        { status: 201 }
      )
    } catch (parseError) {
      console.error("Error parsing Excel file:", parseError)
      return NextResponse.json({ message: "Error parsing Excel file" }, { status: 500 })
    }
  } catch (error) {
    console.error("Error uploading Excel file:", error)
    return NextResponse.json({ message: "Error uploading file" }, { status: 500 })
  }
}
