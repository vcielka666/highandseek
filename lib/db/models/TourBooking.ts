import { Schema, model, models } from 'mongoose'

export type BookingStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled'
export type PaymentStatus = 'pending' | 'paid' | 'refunded'
export type PaymentMethod = 'stripe' | 'crypto' | 'credits'

export interface ITourBooking {
  tourId: string
  userId?: string

  guest: {
    name: string
    email: string
    phone?: string
    telegramContact?: string
  }

  date: Date
  guestsCount: number

  payment: {
    method: PaymentMethod
    amount: number
    currency: string
    stripePaymentIntentId?: string
    creditsSpent?: number
    status: PaymentStatus
  }

  status: BookingStatus
  qrCode: string
  notes?: string

  xpAwarded: number
  badgeAwarded?: string

  createdAt: Date
  updatedAt: Date
}

const TourBookingSchema = new Schema<ITourBooking>({
  tourId: { type: String, ref: 'Tour', required: true },
  userId: { type: String, ref: 'User' },

  guest: {
    name:            { type: String, required: true },
    email:           { type: String, required: true, lowercase: true, trim: true },
    phone:           { type: String },
    telegramContact: { type: String },
  },

  date:        { type: Date, required: true },
  guestsCount: { type: Number, default: 1, min: 1, max: 20 },

  payment: {
    method:                 { type: String, enum: ['stripe','crypto','credits'], required: true },
    amount:                 { type: Number, required: true },
    currency:               { type: String, default: 'EUR' },
    stripePaymentIntentId:  { type: String },
    creditsSpent:           { type: Number },
    status:                 { type: String, enum: ['pending','paid','refunded'], default: 'pending' },
  },

  status:       { type: String, enum: ['pending','confirmed','completed','cancelled'], default: 'pending' },
  qrCode:       { type: String, required: true, unique: true },
  notes:        { type: String },

  xpAwarded:    { type: Number, default: 0 },
  badgeAwarded: { type: String },
}, { timestamps: true })

TourBookingSchema.index({ tourId: 1, date: 1 })
TourBookingSchema.index({ qrCode: 1 })
TourBookingSchema.index({ userId: 1 })

export default models.TourBooking ?? model<ITourBooking>('TourBooking', TourBookingSchema)
