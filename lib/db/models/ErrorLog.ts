import mongoose, { type InferSchemaType } from 'mongoose'

const ErrorLogSchema = new mongoose.Schema({
  message:  { type: String, required: true },
  stack:    { type: String, default: '' },
  route:    { type: String, default: '' },
  userId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  severity: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  action:   { type: String, default: '' },  // for audit: 'order.status_change', 'user.suspend', etc.
}, { timestamps: true })

ErrorLogSchema.index({ createdAt: 1 })
ErrorLogSchema.index({ severity: 1 })

export type IErrorLog = InferSchemaType<typeof ErrorLogSchema> & { _id: mongoose.Types.ObjectId }

const ErrorLog = (mongoose.models.ErrorLog as mongoose.Model<IErrorLog>) ||
  mongoose.model<IErrorLog>('ErrorLog', ErrorLogSchema)

export default ErrorLog
