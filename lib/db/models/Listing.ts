import mongoose, { Schema, model, models } from 'mongoose'

export type ListingCategory = 'equipment' | 'clones' | 'seeds' | 'nutrients' | 'art' | 'other'
export type ListingStatus = 'active' | 'sold' | 'removed' | 'expired'

export interface IListing {
  _id: mongoose.Types.ObjectId
  userId: mongoose.Types.ObjectId
  title: string
  description: string
  category: ListingCategory
  price: number
  location?: string
  contact: {
    telegram?: string
    signal?: string
    threema?: string
  }
  images: string[]
  status: ListingStatus
  creditsCost: number
  expiresAt: Date
  createdAt: Date
  updatedAt: Date
}

const ListingSchema = new Schema<IListing>(
  {
    userId:      { type: Schema.Types.ObjectId, ref: 'User', required: true },
    title:       { type: String, required: true, maxlength: 80, trim: true },
    description: { type: String, required: true, maxlength: 500, trim: true },
    category: {
      type: String,
      enum: ['equipment', 'clones', 'seeds', 'nutrients', 'art', 'other'],
      required: true,
    },
    price:    { type: Number, required: true, min: 0, default: 0 },
    location: { type: String, maxlength: 80, trim: true },
    contact: {
      telegram: { type: String, trim: true },
      signal:   { type: String, trim: true },
      threema:  { type: String, trim: true },
    },
    images: {
      type: [String],
      default: [],
      validate: [(v: string[]) => v.length <= 3, 'Max 3 images'],
    },
    status: {
      type: String,
      enum: ['active', 'sold', 'removed', 'expired'],
      default: 'active',
    },
    creditsCost: { type: Number, required: true },
    expiresAt:   { type: Date, required: true },
  },
  { timestamps: true },
)

ListingSchema.index({ status: 1, category: 1, expiresAt: -1 })
ListingSchema.index({ userId: 1, status: 1 })

export default models.Listing ?? model<IListing>('Listing', ListingSchema)
