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
  // Enhanced specifications
  specifications?: {
    processor?: string
    memory?: string
    storage?: string
    display?: string
    graphics?: string
    connectivity?: string
    ports?: string
    dimensions?: string
    weight?: string
    power?: string
    os?: string
    [key: string]: any
  }
  // Additional optional fields
  manufacturer?: string
  part_number?: string
  sku?: string
  warranty_months?: number
  warranty_info?: string
  purchase_date?: Date
  purchase_price?: number
  vendor?: string
  location?: string
  notes?: string
  // Asset management
  asset_tag?: string
  condition?: "new" | "good" | "fair" | "poor" | "damaged"
  status: "active" | "inactive" | "maintenance" | "retired"
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
    // Additional optional fields
    manufacturer: {
      type: String,
      trim: true,
    },
    part_number: {
      type: String,
      trim: true,
    },
    sku: {
      type: String,
      trim: true,
    },
    warranty_months: {
      type: Number,
      min: 0,
    },
    warranty_info: {
      type: String,
      trim: true,
    },
    purchase_date: {
      type: Date,
    },
    purchase_price: {
      type: Number,
      min: 0,
    },
    vendor: {
      type: String,
      trim: true,
    },
    location: {
      type: String,
      trim: true,
    },
    notes: {
      type: String,
      trim: true,
    },
    asset_tag: {
      type: String,
      trim: true,
    },
    condition: {
      type: String,
      enum: ["new", "good", "fair", "poor", "damaged"],
      default: "new",
    },
    status: {
      type: String,
      enum: ["active", "inactive", "maintenance", "retired"],
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
ProductSchema.index({ brand: 1 })
ProductSchema.index({ condition: 1 })
ProductSchema.index({ created_at: -1 })

const Product: Model<IProduct> = mongoose.models.Product || mongoose.model<IProduct>("Product", ProductSchema)

export default Product
