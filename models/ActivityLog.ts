import mongoose, { Schema, Document, Model } from "mongoose"

export interface IActivityLog extends Document {
  _id: mongoose.Types.ObjectId
  entity_type: string
  entity_id: mongoose.Types.ObjectId
  action: "create" | "update" | "delete" | "view" | "login" | "logout" | "approve" | "reject" | "assign" | "close" | "reopen"
  performed_by?: mongoose.Types.ObjectId
  performed_by_type: "user" | "customer" | "customer_user" | "system"
  performed_by_name?: string
  old_values?: Record<string, any>
  new_values?: Record<string, any>
  details?: string
  ip_address?: string
  user_agent?: string
  created_at: Date
}

const ActivityLogSchema = new Schema<IActivityLog>(
  {
    entity_type: {
      type: String,
      required: true,
      index: true,
    },
    entity_id: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    action: {
      type: String,
      enum: ["create", "update", "delete", "view", "login", "logout", "approve", "reject", "assign", "close", "reopen"],
      required: true,
      index: true,
    },
    performed_by: {
      type: Schema.Types.ObjectId,
    },
    performed_by_type: {
      type: String,
      enum: ["user", "customer", "customer_user", "system"],
      required: true,
    },
    performed_by_name: {
      type: String,
    },
    old_values: {
      type: Schema.Types.Mixed,
    },
    new_values: {
      type: Schema.Types.Mixed,
    },
    details: {
      type: String,
    },
    ip_address: {
      type: String,
    },
    user_agent: {
      type: String,
    },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: false },
  }
)

ActivityLogSchema.index({ entity_type: 1, entity_id: 1 })
ActivityLogSchema.index({ performed_by: 1 })
ActivityLogSchema.index({ created_at: -1 })
ActivityLogSchema.index({ action: 1 })

const ActivityLog: Model<IActivityLog> =
  mongoose.models.ActivityLog || mongoose.model<IActivityLog>("ActivityLog", ActivityLogSchema)

export default ActivityLog
