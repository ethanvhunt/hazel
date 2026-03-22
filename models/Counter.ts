import mongoose, { Schema, Document, Model } from "mongoose"

export interface ICounter extends Document {
  _id: string
  sequence_value: number
}

const CounterSchema = new Schema<ICounter>({
  _id: {
    type: String,
    required: true,
  },
  sequence_value: {
    type: Number,
    default: 0,
  },
})

const Counter: Model<ICounter> = mongoose.models.Counter || mongoose.model<ICounter>("Counter", CounterSchema)

// Helper function to get next sequence value
export async function getNextSequence(name: string): Promise<number> {
  const counter = await Counter.findByIdAndUpdate(
    name,
    { $inc: { sequence_value: 1 } },
    { new: true, upsert: true }
  )
  return counter.sequence_value
}

export default Counter
