import mongoose, { type InferSchemaType } from 'mongoose'

const SolanaPaymentSchema = new mongoose.Schema({
  signature: { type: String, required: true, unique: true, index: true },
  userId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  credits:   { type: Number, required: true },
}, { timestamps: true })

export type ISolanaPayment = InferSchemaType<typeof SolanaPaymentSchema> & { _id: mongoose.Types.ObjectId }

const SolanaPayment = (mongoose.models.SolanaPayment as mongoose.Model<ISolanaPayment>) ||
  mongoose.model<ISolanaPayment>('SolanaPayment', SolanaPaymentSchema)

export default SolanaPayment
