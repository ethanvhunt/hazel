import mongoose, { Schema, Document, Model } from "mongoose"

export interface IProduct extends Document {
  _id: mongoose.Types.ObjectId
  product_code: string
  name: string
  description?: string
  category_id?: mongoose.Types.ObjectId
  brand?: string
  model?: string
  serial_number?: string
  specifications?: Record<string, any>
  status: "active" | "inactive"
  created_by?: mongoose.Types.ObjectId
  created_at: Date
  updated_at: Date
}

const ProductSchema = new Schema<IProduct>(
  {
    product_code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
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
    serial_number: {
      type: String,
      trim: true,
    },
    specifications: {
      type: Schema.Types.Mixed,
      default: {},
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
    created_by: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
)

ProductSchema.index({ product_code: 1 })
ProductSchema.index({ name: "text" })
ProductSchema.index({ category_id: 1 })
ProductSchema.index({ status: 1 })
ProductSchema.index({ created_at: -1 })

const Product: Model<IProduct> = mongoose.models.Product || mongoose.model<IProduct>("Product", ProductSchema)

export default Product
