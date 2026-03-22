import mongoose, { Schema, Document, Model } from "mongoose"

export interface ICustomerUser extends Document {
  _id: mongoose.Types.ObjectId
  customer_id: mongoose.Types.ObjectId
  email: string
  password_hash: string
  full_name: string
  mobile_number: string
  role: "customer_admin" | "customer_agent"
  is_active: boolean
  created_at: Date
  updated_at: Date
}

const CustomerUserSchema = new Schema<ICustomerUser>(
  {
    customer_id: {
      type: Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    password_hash: {
      type: String,
      required: true,
    },
    full_name: {
      type: String,
      required: true,
      trim: true,
    },
    mobile_number: {
      type: String,
      required: true,
      trim: true,
    },
    role: {
      type: String,
      enum: ["customer_admin", "customer_agent"],
      required: true,
    },
    is_active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
)

// Compound index for unique email per customer
CustomerUserSchema.index({ customer_id: 1, email: 1 }, { unique: true })
CustomerUserSchema.index({ customer_id: 1 })
CustomerUserSchema.index({ role: 1 })
CustomerUserSchema.index({ is_active: 1 })

const CustomerUser: Model<ICustomerUser> =
  mongoose.models.CustomerUser || mongoose.model<ICustomerUser>("CustomerUser", CustomerUserSchema)

export default CustomerUser
