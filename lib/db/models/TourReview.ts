import { Schema, model, models } from 'mongoose'

export interface ITourReview {
  tourId: string
  bookingId: string
  userId?: string

  rating: number
  text: string
  photos: string[]

  guestName: string
  verified: boolean

  createdAt: Date
  updatedAt: Date
}

const TourReviewSchema = new Schema<ITourReview>({
  tourId:    { type: String, ref: 'Tour', required: true },
  bookingId: { type: String, ref: 'TourBooking', required: true },
  userId:    { type: String, ref: 'User' },

  rating:   { type: Number, required: true, min: 1, max: 5 },
  text:     { type: String, maxlength: 500, default: '' },
  photos:   [{ type: String }],

  guestName: { type: String, required: true },
  verified:  { type: Boolean, default: true },
}, { timestamps: true })

TourReviewSchema.index({ tourId: 1, createdAt: -1 })

export default models.TourReview ?? model<ITourReview>('TourReview', TourReviewSchema)
