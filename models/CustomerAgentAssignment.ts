import mongoose, { Schema, Document, Model } from "mongoose"

export interface ICustomerAgentAssignment extends Document {
  _id: mongoose.Types.ObjectId
  customer_id: mongoose.Types.ObjectId
  agent_id: mongoose.Types.ObjectId
  assigned_by: mongoose.Types.ObjectId
  assigned_at: Date
  created_at: Date
  updated_at: Date
}

const CustomerAgentAssignmentSchema = new Schema<ICustomerAgentAssignment>(
  {
    customer_id: {
      type: Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },
    agent_id: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    assigned_by: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    assigned_at: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
)

// Unique constraint for customer-agent pair
CustomerAgentAssignmentSchema.index({ customer_id: 1, agent_id: 1 }, { unique: true })
CustomerAgentAssignmentSchema.index({ customer_id: 1 })
CustomerAgentAssignmentSchema.index({ agent_id: 1 })

const CustomerAgentAssignment: Model<ICustomerAgentAssignment> =
  mongoose.models.CustomerAgentAssignment ||
  mongoose.model<ICustomerAgentAssignment>("CustomerAgentAssignment", CustomerAgentAssignmentSchema)

export default CustomerAgentAssignment
