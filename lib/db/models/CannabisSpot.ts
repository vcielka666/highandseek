import { Schema, model, models } from 'mongoose'

export type SpotType = 'cbd_shop' | 'smoke_friendly' | 'cannabis_club' | 'grow_shop' | 'cafe' | 'event_space'

export interface ICannabisSpot {
  name: string
  city: string
  country: string

  type: SpotType
  description: string
  address: string
  lat: number
  lng: number

  hours: string
  website?: string
  instagram?: string

  photos: string[]
  coverPhoto: string

  verified: boolean
  featured: boolean
  isActive: boolean

  rating: number
  reviewsCount: number

  addedBy?: string

  createdAt: Date
  updatedAt: Date
}

const CannabisSpotSchema = new Schema<ICannabisSpot>({
  name:    { type: String, required: true },
  city:    { type: String, required: true },
  country: { type: String, required: true },

  type:        { type: String, enum: ['cbd_shop','smoke_friendly','cannabis_club','grow_shop','cafe','event_space'], required: true },
  description: { type: String, maxlength: 500, default: '' },
  address:     { type: String, required: true },
  lat:         { type: Number, required: true },
  lng:         { type: Number, required: true },

  hours:    { type: String, default: '' },
  website:  { type: String },
  instagram: { type: String },

  photos:     [{ type: String }],
  coverPhoto: { type: String, default: '' },

  verified:     { type: Boolean, default: false },
  featured:     { type: Boolean, default: false },
  isActive:     { type: Boolean, default: true },

  rating:       { type: Number, default: 0 },
  reviewsCount: { type: Number, default: 0 },

  addedBy: { type: Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true })

CannabisSpotSchema.index({ city: 1, type: 1, isActive: 1 })

export default models.CannabisSpot ?? model<ICannabisSpot>('CannabisSpot', CannabisSpotSchema)
