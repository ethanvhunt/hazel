import mongoose, { Schema, Document, Model } from "mongoose"

export interface ISMSLog extends Document {
  _id: mongoose.Types.ObjectId
  phone_number: string
  message: string
  sms_type: "ticket_created" | "ticket_approved" | "ticket_rejected" | "user_created" | "general"
  related_id?: mongoose.Types.ObjectId
  status: "pending" | "sent" | "failed" | "mock_sent" | "delivered"
  provider_response?: Record<string, any>
  sent_at?: Date
  created_at: Date
}

const SMSLogSchema = new Schema<ISMSLog>(
  {
    phone_number: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    sms_type: {
      type: String,
      enum: ["ticket_created", "ticket_approved", "ticket_rejected", "user_created", "general"],
      required: true,
    },
    related_id: {
      type: Schema.Types.ObjectId,
    },
    status: {
      type: String,
      enum: ["pending", "sent", "failed", "mock_sent", "delivered"],
      default: "pending",
    },
    provider_response: {
      type: Schema.Types.Mixed,
    },
    sent_at: {
      type: Date,
    },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: false },
  }
)

SMSLogSchema.index({ phone_number: 1 })
SMSLogSchema.index({ status: 1 })
SMSLogSchema.index({ created_at: -1 })

const SMSLog: Model<ISMSLog> = mongoose.models.SMSLog || mongoose.model<ISMSLog>("SMSLog", SMSLogSchema)

export default SMSLog
