import mongoose, { type InferSchemaType } from 'mongoose'

const MessageSchema = new mongoose.Schema({
  role:      { type: String, enum: ['user', 'assistant'], required: true },
  content:   { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
}, { _id: false })

const StrainChatSchema = new mongoose.Schema({
  userId:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  strainSlug: { type: String, required: true, index: true },
  messages:   { type: [MessageSchema], default: [] },
  xpEarned:   { type: Number, default: 0 },
}, { timestamps: true })

export type IStrainChat = InferSchemaType<typeof StrainChatSchema> & { _id: mongoose.Types.ObjectId }

const StrainChat = (mongoose.models.StrainChat as mongoose.Model<IStrainChat>) ||
  mongoose.model<IStrainChat>('StrainChat', StrainChatSchema)

export default StrainChat
