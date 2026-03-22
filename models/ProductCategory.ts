import mongoose, { Schema, Document, Model } from "mongoose"

export interface IProductCategory extends Document {
  _id: mongoose.Types.ObjectId
  name: string
  slug: string
  description?: string
  is_custom: boolean
  created_by?: mongoose.Types.ObjectId
  created_at: Date
  updated_at: Date
}

const ProductCategorySchema = new Schema<IProductCategory>(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    is_custom: {
      type: Boolean,
      default: false,
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

ProductCategorySchema.index({ name: 1 })
ProductCategorySchema.index({ slug: 1 })

// Pre-save hook to generate slug from name
ProductCategorySchema.pre("save", function (next) {
  if (this.isModified("name") || !this.slug) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/(^_|_$)/g, "")
  }
  next()
})

const ProductCategory: Model<IProductCategory> =
  mongoose.models.ProductCategory || mongoose.model<IProductCategory>("ProductCategory", ProductCategorySchema)

export default ProductCategory
