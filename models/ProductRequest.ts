import mongoose, { Schema, Document, Model } from "mongoose"

export interface IProductRequest extends Document {
  _id: mongoose.Types.ObjectId
  customer_id: mongoose.Types.ObjectId
  product_name: string
  description: string
  category_id?: mongoose.Types.ObjectId
  brand?: string
  model?: string
  status: "pending" | "approved" | "rejected"
  reviewed_by?: mongoose.Types.ObjectId
  reviewed_at?: Date
  rejection_reason?: string
  created_at: Date
  updated_at: Date
}

const ProductRequestSchema = new Schema<IProductRequest>(
  {
    customer_id: {
      type: Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
      index: true,
    },
    product_name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    category_id: {
      type: Schema.Types.ObjectId,
      ref: "ProductCategory",
    },
    brand: {
      type: String,
      trim: true,
    },
    model: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    reviewed_by: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    reviewed_at: {
      type: Date,
    },
    rejection_reason: {
      type: String,
    },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
)

ProductRequestSchema.index({ status: 1 })
ProductRequestSchema.index({ created_at: -1 })

const ProductRequest: Model<IProductRequest> =
  mongoose.models.ProductRequest || mongoose.model<IProductRequest>("ProductRequest", ProductRequestSchema)

export default ProductRequest
