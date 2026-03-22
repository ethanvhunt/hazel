import mongoose, { Schema, Document, Model } from "mongoose"

export interface ITicket extends Document {
  _id: mongoose.Types.ObjectId
  ticket_number: string
  customer_id: mongoose.Types.ObjectId
  product_id?: mongoose.Types.ObjectId
  title: string
  description: string
  priority: "low" | "medium" | "high" | "urgent"
  status: "pending_approval" | "open" | "in_progress" | "resolved" | "closed" | "rejected"
  created_by_customer_user?: mongoose.Types.ObjectId
  assigned_agent_id?: mongoose.Types.ObjectId
  // Approval workflow
  customer_admin_approved: boolean
  customer_admin_approved_by?: mongoose.Types.ObjectId
  customer_admin_approved_at?: Date
  rejection_reason?: string
  // Auto-close tracking
  last_reply_at?: Date
  auto_close_at?: Date
  created_at: Date
  updated_at: Date
}

const TicketSchema = new Schema<ITicket>(
  {
    ticket_number: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    customer_id: {
      type: Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },
    product_id: {
      type: Schema.Types.ObjectId,
      ref: "Product",
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },
    status: {
      type: String,
      enum: ["pending_approval", "open", "in_progress", "resolved", "closed", "rejected"],
      default: "pending_approval",
    },
    created_by_customer_user: {
      type: Schema.Types.ObjectId,
      ref: "CustomerUser",
    },
    assigned_agent_id: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    customer_admin_approved: {
      type: Boolean,
      default: false,
    },
    customer_admin_approved_by: {
      type: Schema.Types.ObjectId,
      ref: "CustomerUser",
    },
    customer_admin_approved_at: {
      type: Date,
    },
    rejection_reason: {
      type: String,
    },
    last_reply_at: {
      type: Date,
    },
    auto_close_at: {
      type: Date,
    },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
)

TicketSchema.index({ ticket_number: 1 })
TicketSchema.index({ customer_id: 1 })
TicketSchema.index({ product_id: 1 })
TicketSchema.index({ status: 1 })
TicketSchema.index({ assigned_agent_id: 1 })
TicketSchema.index({ created_at: -1 })
TicketSchema.index({ auto_close_at: 1 })

const Ticket: Model<ITicket> = mongoose.models.Ticket || mongoose.model<ITicket>("Ticket", TicketSchema)

export default Ticket
