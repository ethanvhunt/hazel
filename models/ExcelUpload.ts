import mongoose, { Schema, Document, Model } from "mongoose"

export interface IExcelUpload extends Document {
  _id: mongoose.Types.ObjectId
  customerId: mongoose.Types.ObjectId
  uploadedBy: mongoose.Types.ObjectId
  fileName: string
  fileSize: number
  filePath: string
  fileType: string
  description?: string
  sheets: {
    sheetName: string
    data: any[][]
  }[]
  createdAt: Date
  updatedAt: Date
}

const ExcelUploadSchema = new Schema<IExcelUpload>(
  {
    customerId: { type: Schema.Types.ObjectId, ref: "Customer", required: true },
    uploadedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    fileName: { type: String, required: true },
    fileSize: { type: Number, required: true },
    filePath: { type: String, required: true },
    fileType: { type: String, required: true },
    description: { type: String },
    sheets: [
      {
        sheetName: { type: String, required: true },
        data: { type: [[Schema.Types.Mixed]], default: [] },
      },
    ],
  },
  {
    timestamps: true,
  }
)

ExcelUploadSchema.index({ customerId: 1, createdAt: -1 })
ExcelUploadSchema.index({ uploadedBy: 1 })

const ExcelUpload: Model<IExcelUpload> =
  mongoose.models.ExcelUpload || mongoose.model<IExcelUpload>("ExcelUpload", ExcelUploadSchema)

export default ExcelUpload
