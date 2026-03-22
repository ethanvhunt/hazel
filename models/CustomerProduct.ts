import mongoose, { Schema, Document, Model } from "mongoose"

export interface ICustomerProduct extends Document {
  _id: mongoose.Types.ObjectId
  customer_id: mongoose.Types.ObjectId
  product_id: mongoose.Types.ObjectId
  assigned_by: mongoose.Types.ObjectId
  assigned_at: Date
  notes?: string
  created_at: Date
  updated_at: Date
}

const CustomerProductSchema = new Schema<ICustomerProduct>(
  {
    customer_id: {
      type: Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },
    product_id: {
      type: Schema.Types.ObjectId,
      ref: "Product",
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
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
)

// Unique constraint for customer-product pair
CustomerProductSchema.index({ customer_id: 1, product_id: 1 }, { unique: true })
CustomerProductSchema.index({ customer_id: 1 })
CustomerProductSchema.index({ product_id: 1 })

const CustomerProduct: Model<ICustomerProduct> =
  mongoose.models.CustomerProduct || mongoose.model<ICustomerProduct>("CustomerProduct", CustomerProductSchema)

export default CustomerProduct
