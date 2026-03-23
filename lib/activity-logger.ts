import connectDB from "@/lib/mongodb"
import ActivityLog from "@/models/ActivityLog"
import mongoose from "mongoose"

interface LogActivityParams {
  entityType: string
  entityId: string | mongoose.Types.ObjectId
  action: "create" | "update" | "delete" | "view" | "login" | "logout" | "approve" | "reject" | "assign" | "close" | "reopen"
  performedBy?: string | mongoose.Types.ObjectId
  performedByType: "user" | "customer" | "customer_user" | "system"
  performedByName?: string
  oldValues?: Record<string, any>
  newValues?: Record<string, any>
  details?: string
  ipAddress?: string
  userAgent?: string
}

export async function logActivity(params: LogActivityParams) {
  try {
    await connectDB()

    await ActivityLog.create({
      entity_type: params.entityType,
      entity_id: new mongoose.Types.ObjectId(params.entityId.toString()),
      action: params.action,
      performed_by: params.performedBy
        ? new mongoose.Types.ObjectId(params.performedBy.toString())
        : undefined,
      performed_by_type: params.performedByType,
      performed_by_name: params.performedByName,
      old_values: params.oldValues,
      new_values: params.newValues,
      details: params.details,
      ip_address: params.ipAddress,
      user_agent: params.userAgent,
    })
  } catch (error) {
    console.error("[ActivityLog] Failed to log activity:", error)
    // Don't throw - activity logging should not break main operations
  }
}

// Helper to get changes between old and new values
export function getChanges(
  oldObj: Record<string, any>,
  newObj: Record<string, any>,
  fieldsToTrack: string[]
): { oldValues: Record<string, any>; newValues: Record<string, any> } {
  const oldValues: Record<string, any> = {}
  const newValues: Record<string, any> = {}

  for (const field of fieldsToTrack) {
    if (oldObj[field] !== newObj[field]) {
      oldValues[field] = oldObj[field]
      newValues[field] = newObj[field]
    }
  }

  return { oldValues, newValues }
}
