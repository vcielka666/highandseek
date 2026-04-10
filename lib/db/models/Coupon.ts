import mongoose, { type InferSchemaType } from 'mongoose'

const CouponSchema = new mongoose.Schema({
  code:       { type: String, required: true, unique: true, uppercase: true, trim: true },
  discount:   { type: Number, required: true, min: 1, max: 100 },  // percentage
  isActive:   { type: Boolean, default: true },
  maxUsage:   { type: Number, default: 0 },   // 0 = unlimited
  usageCount: { type: Number, default: 0 },
  expiresAt:  { type: Date, default: null },
  note:       { type: String, default: '' },  // internal admin note
}, { timestamps: true })

export type ICoupon = InferSchemaType<typeof CouponSchema> & { _id: mongoose.Types.ObjectId }

const Coupon = (mongoose.models.Coupon as mongoose.Model<ICoupon>) ||
  mongoose.model<ICoupon>('Coupon', CouponSchema)

export default Coupon
