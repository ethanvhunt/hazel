import mongoose, { Schema, Document, Model } from "mongoose"

export interface ICustomer extends Document {
  _id: mongoose.Types.ObjectId
  email: string
  password_hash: string
  company_name: string
  contact_person: string
  phone?: string
  address?: string
  is_active: boolean
  created_at: Date
  updated_at: Date
}

const CustomerSchema = new Schema<ICustomer>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password_hash: {
      type: String,
      required: true,
    },
    company_name: {
      type: String,
      required: true,
      trim: true,
    },
    contact_person: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    address: {
      type: String,
      trim: true,
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

CustomerSchema.index({ email: 1 })
CustomerSchema.index({ company_name: 1 })
CustomerSchema.index({ is_active: 1 })

const Customer: Model<ICustomer> = mongoose.models.Customer || mongoose.model<ICustomer>("Customer", CustomerSchema)

export default Customer
