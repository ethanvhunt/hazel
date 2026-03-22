import mongoose, { Schema, Document } from "mongoose"

export interface IProductRequest extends Document {
  customerId: string
  productName: string
  description: string
  status: "pending" | "approved" | "rejected"
  reviewedBy?: string
  reviewNotes?: string
  createdAt: Date
  updatedAt: Date
}

const ProductRequestSchema = new Schema<IProductRequest>(
  {
    customerId: {
      type: String,
      required: true,
      index: true,
    },
    productName: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    reviewedBy: {
      type: String,
    },
    reviewNotes: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
)

export default mongoose.models.ProductRequest ||
  mongoose.model<IProductRequest>("ProductRequest", ProductRequestSchema)
