import mongoose, { type InferSchemaType } from 'mongoose'

const XPEventSchema = new mongoose.Schema({
  userId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  event:    { type: String, required: true },
  amount:   { type: Number, required: true },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
}, { timestamps: true })

export type IXPEvent = InferSchemaType<typeof XPEventSchema> & { _id: mongoose.Types.ObjectId }

const XPEvent = (mongoose.models.XPEvent as mongoose.Model<IXPEvent>) ||
  mongoose.model<IXPEvent>('XPEvent', XPEventSchema)

export default XPEvent
