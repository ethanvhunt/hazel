import mongoose, { Schema, Document, Model } from "mongoose"

export interface INotification extends Document {
  _id: mongoose.Types.ObjectId
  user_id: mongoose.Types.ObjectId
  user_type: "team" | "customer" | "customer_user"
  event_type: string
  entity_type: string
  entity_id: mongoose.Types.ObjectId
  title: string
  message: string
  read: boolean
  read_at?: Date
  created_at: Date
}

const NotificationSchema = new Schema<INotification>(
  {
    user_id: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    user_type: {
      type: String,
      enum: ["team", "customer", "customer_user"],
      required: true,
    },
    event_type: {
      type: String,
      required: true,
    },
    entity_type: {
      type: String,
      required: true,
    },
    entity_id: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    read: {
      type: Boolean,
      default: false,
    },
    read_at: {
      type: Date,
    },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: false },
  }
)

NotificationSchema.index({ user_id: 1, user_type: 1 })
NotificationSchema.index({ read: 1 })
NotificationSchema.index({ created_at: -1 })

const Notification: Model<INotification> =
  mongoose.models.Notification || mongoose.model<INotification>("Notification", NotificationSchema)

export default Notification
