import mongoose, { Schema, Document, Model } from "mongoose"

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId
  email: string
  password_hash: string
  full_name: string
  mobile_number?: string
  gmail_address?: string
  role: "super_admin" | "admin" | "manager" | "agent"
  is_active: boolean
  created_at: Date
  updated_at: Date
}

const UserSchema = new Schema<IUser>(
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
    full_name: {
      type: String,
      required: true,
      trim: true,
    },
    mobile_number: {
      type: String,
      trim: true,
    },
    gmail_address: {
      type: String,
      trim: true,
    },
    role: {
      type: String,
      enum: ["super_admin", "admin", "manager", "agent"],
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

UserSchema.index({ email: 1 })
UserSchema.index({ role: 1 })
UserSchema.index({ is_active: 1 })

const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>("User", UserSchema)

export default User
