import connectDB from "@/lib/mongodb"
import ActivityLog from "@/models/ActivityLog"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { ROLES } from "@/lib/constants"

export async function GET(request: Request) {
  try {
    await connectDB()
    
    const cookieStore = await cookies()
    const teamSession = cookieStore.get("team-session")?.value

    if (!teamSession) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const sessionData = JSON.parse(teamSession)
    
    // Only super_admin and admin can view activity logs
    if (![ROLES.SUPER_ADMIN, ROLES.ADMIN].includes(sessionData.role)) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const limit = Number.parseInt(searchParams.get("limit") || "100")
    const offset = Number.parseInt(searchParams.get("offset") || "0")
    const entityType = searchParams.get("entity_type")
    const action = searchParams.get("action")
    const userId = searchParams.get("user_id")
    const startDate = searchParams.get("start_date")
    const endDate = searchParams.get("end_date")

    // Build query
    const query: any = {}

    if (entityType) {
      query.entity_type = entityType
    }
    if (action) {
      query.action = action
    }
    if (userId) {
      query.performed_by = userId
    }
    if (startDate || endDate) {
      query.created_at = {}
      if (startDate) {
        query.created_at.$gte = new Date(startDate)
      }
      if (endDate) {
        const end = new Date(endDate)
        end.setDate(end.getDate() + 1)
        query.created_at.$lt = end
      }
    }

    const logs = await ActivityLog.find(query)
      .sort({ created_at: -1 })
      .skip(offset)
      .limit(limit)
      .lean()

    // Get total count for pagination
    const total = await ActivityLog.countDocuments(query)

    // Get available entity types for filter dropdown
    const entityTypes = await ActivityLog.distinct("entity_type")

    // Get available actions for filter dropdown
    const actions = await ActivityLog.distinct("action")

    // Transform for frontend
    const transformedLogs = logs.map((log: any) => ({
      id: log._id.toString(),
      entity_type: log.entity_type,
      entity_id: log.entity_id?.toString(),
      action: log.action,
      performed_by: log.performed_by?.toString(),
      performed_by_name: log.performed_by_name,
      performed_by_type: log.performed_by_type,
      old_values: log.old_values,
      new_values: log.new_values,
      details: log.details,
      created_at: log.created_at,
    }))

    return NextResponse.json({
      logs: transformedLogs,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + logs.length < total,
      },
      filters: {
        entityTypes: entityTypes.sort(),
        actions: actions.sort(),
      },
    })
  } catch (error) {
    console.error("Error fetching activity logs:", error)
    return NextResponse.json({ message: "Error fetching logs" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    await connectDB()
    
    const { entityType, entityId, action, userId, userType, userName, details, oldValues, newValues } = await request.json()

    const log = await ActivityLog.create({
      entity_type: entityType,
      entity_id: entityId,
      action,
      performed_by: userId || null,
      performed_by_type: userType || "system",
      performed_by_name: userName,
      old_values: oldValues,
      new_values: newValues,
      details,
    })

    return NextResponse.json({
      id: log._id.toString(),
      ...log.toObject(),
    }, { status: 201 })
  } catch (error) {
    console.error("Error logging activity:", error)
    return NextResponse.json({ message: "Error logging activity" }, { status: 500 })
  }
}
