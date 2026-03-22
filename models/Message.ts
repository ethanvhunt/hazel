import mongoose, { Schema, Document, Model } from "mongoose"

export interface IMessage extends Document {
  _id: mongoose.Types.ObjectId
  ticket_id: mongoose.Types.ObjectId
  sender_type: "customer" | "customer_user" | "agent"
  sender_id: mongoose.Types.ObjectId
  message: string
  attachments?: string[]
  created_at: Date
}

const MessageSchema = new Schema<IMessage>(
  {
    ticket_id: {
      type: Schema.Types.ObjectId,
      ref: "Ticket",
      required: true,
    },
    sender_type: {
      type: String,
      enum: ["customer", "customer_user", "agent"],
      required: true,
    },
    sender_id: {
      type: Schema.Types.ObjectId,
      required: true,
      refPath: "sender_type_ref",
    },
    message: {
      type: String,
      required: true,
    },
    attachments: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: false },
  }
)

MessageSchema.index({ ticket_id: 1 })
MessageSchema.index({ created_at: -1 })

const Message: Model<IMessage> = mongoose.models.Message || mongoose.model<IMessage>("Message", MessageSchema)

export default Message
