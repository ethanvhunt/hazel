import { sql } from "@/lib/db"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies()
    const session = cookieStore.get("session")?.value

    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const sessionData = JSON.parse(session)
    
    // Only super_admin, admin, manager can view activity logs
    if (!["super_admin", "admin", "manager"].includes(sessionData.role)) {
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

    let logs

    // Build dynamic query based on filters
    if (entityType && action && userId && startDate && endDate) {
      logs = await sql`
        SELECT 
          al.id, al.entity_type, al.entity_id, al.action, al.details,
          al.created_at,
          u.full_name as performed_by_name
        FROM activity_logs al
        LEFT JOIN users u ON al.user_id = u.id
        WHERE al.entity_type = ${entityType}
          AND al.action = ${action}
          AND al.user_id = ${userId}
          AND al.created_at >= ${startDate}::timestamp
          AND al.created_at <= ${endDate}::timestamp + interval '1 day'
        ORDER BY al.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `
    } else if (entityType && action) {
      logs = await sql`
        SELECT 
          al.id, al.entity_type, al.entity_id, al.action, al.details,
          al.created_at,
          u.full_name as performed_by_name
        FROM activity_logs al
        LEFT JOIN users u ON al.user_id = u.id
        WHERE al.entity_type = ${entityType} AND al.action = ${action}
        ORDER BY al.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `
    } else if (entityType) {
      logs = await sql`
        SELECT 
          al.id, al.entity_type, al.entity_id, al.action, al.details,
          al.created_at,
          u.full_name as performed_by_name
        FROM activity_logs al
        LEFT JOIN users u ON al.user_id = u.id
        WHERE al.entity_type = ${entityType}
        ORDER BY al.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `
    } else if (action) {
      logs = await sql`
        SELECT 
          al.id, al.entity_type, al.entity_id, al.action, al.details,
          al.created_at,
          u.full_name as performed_by_name
        FROM activity_logs al
        LEFT JOIN users u ON al.user_id = u.id
        WHERE al.action = ${action}
        ORDER BY al.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `
    } else if (userId) {
      logs = await sql`
        SELECT 
          al.id, al.entity_type, al.entity_id, al.action, al.details,
          al.created_at,
          u.full_name as performed_by_name
        FROM activity_logs al
        LEFT JOIN users u ON al.user_id = u.id
        WHERE al.user_id = ${userId}
        ORDER BY al.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `
    } else if (startDate && endDate) {
      logs = await sql`
        SELECT 
          al.id, al.entity_type, al.entity_id, al.action, al.details,
          al.created_at,
          u.full_name as performed_by_name
        FROM activity_logs al
        LEFT JOIN users u ON al.user_id = u.id
        WHERE al.created_at >= ${startDate}::timestamp
          AND al.created_at <= ${endDate}::timestamp + interval '1 day'
        ORDER BY al.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `
    } else {
      logs = await sql`
        SELECT 
          al.id, al.entity_type, al.entity_id, al.action, al.details,
          al.created_at,
          u.full_name as performed_by_name
        FROM activity_logs al
        LEFT JOIN users u ON al.user_id = u.id
        ORDER BY al.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `
    }

    // Get total count for pagination
    const countResult = await sql`SELECT COUNT(*) as total FROM activity_logs`
    const total = parseInt(countResult[0].total)

    // Get available entity types for filter dropdown
    const entityTypes = await sql`
      SELECT DISTINCT entity_type FROM activity_logs ORDER BY entity_type
    `

    // Get available actions for filter dropdown
    const actions = await sql`
      SELECT DISTINCT action FROM activity_logs ORDER BY action
    `

    return NextResponse.json({
      logs,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + logs.length < total,
      },
      filters: {
        entityTypes: entityTypes.map((e: any) => e.entity_type),
        actions: actions.map((a: any) => a.action),
      },
    })
  } catch (error) {
    console.error("Error fetching activity logs:", error)
    return NextResponse.json({ message: "Error fetching logs" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { entityType, entityId, action, userId, details } = await request.json()

    const result = await sql`
      INSERT INTO activity_logs (entity_type, entity_id, action, user_id, details)
      VALUES (${entityType}, ${entityId}, ${action}, ${userId || null}, ${details ? JSON.stringify(details) : null})
      RETURNING *
    `

    return NextResponse.json(result[0], { status: 201 })
  } catch (error) {
    console.error("Error logging activity:", error)
    return NextResponse.json({ message: "Error logging activity" }, { status: 500 })
  }
}
