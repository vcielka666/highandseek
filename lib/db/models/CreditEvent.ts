import mongoose, { type InferSchemaType } from 'mongoose'

const CreditEventSchema = new mongoose.Schema({
  userId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  type:     { type: String, enum: ['earned', 'spent'], required: true },
  amount:   { type: Number, required: true },
  reason:   { type: String, required: true },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
}, { timestamps: true })

export type ICreditEvent = InferSchemaType<typeof CreditEventSchema> & { _id: mongoose.Types.ObjectId }

const CreditEvent = (mongoose.models.CreditEvent as mongoose.Model<ICreditEvent>) ||
  mongoose.model<ICreditEvent>('CreditEvent', CreditEventSchema)

export default CreditEvent
