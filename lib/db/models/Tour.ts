import { Schema, model, models } from 'mongoose'

export interface IStop {
  order: number
  title: string
  description: string
  lat: number
  lng: number
  duration: number
  photoUrl?: string
  type: 'club' | 'shop' | 'viewpoint' | 'cafe' | 'culture' | 'other'
}

export interface ITour {
  title: string
  slug: string
  city: string
  country: string

  host: {
    userId?: string
    name: string
    avatar: string
    bio: string
    verified: boolean
  }

  description: string
  shortDescription: string

  duration: number
  maxGuests: number
  languages: string[]

  price: {
    eur: number
    czk: number
    credits: number
  }

  meetingPoint: {
    address: string
    lat: number
    lng: number
    description: string
  }

  stops: IStop[]
  images: string[]
  coverImage: string

  included: string[]
  notIncluded: string[]
  requirements: string[]

  category: 'walking' | 'cycling' | 'private' | 'group' | 'event'

  rating: number
  reviewsCount: number
  totalBookings: number

  isActive: boolean
  isFeatured: boolean
  isComingSoon: boolean

  availableSpots: number

  createdAt: Date
  updatedAt: Date
}

const StopSchema = new Schema<IStop>({
  order:       { type: Number, required: true },
  title:       { type: String, required: true },
  description: { type: String, maxlength: 300 },
  lat:         { type: Number, required: true },
  lng:         { type: Number, required: true },
  duration:    { type: Number, required: true },
  photoUrl:    { type: String },
  type:        { type: String, enum: ['club','shop','viewpoint','cafe','culture','other'], default: 'other' },
}, { _id: false })

const TourSchema = new Schema<ITour>({
  title:            { type: String, required: true },
  slug:             { type: String, required: true, unique: true },
  city:             { type: String, required: true },
  country:          { type: String, required: true },

  host: {
    userId:   { type: Schema.Types.ObjectId, ref: 'User' },
    name:     { type: String, default: '' },
    avatar:   { type: String, default: '' },
    bio:      { type: String, maxlength: 300, default: '' },
    verified: { type: Boolean, default: false },
  },

  description:      { type: String, maxlength: 2000, default: '' },
  shortDescription: { type: String, maxlength: 150, default: '' },

  duration:  { type: Number, default: 120 },
  maxGuests: { type: Number, default: 8 },
  languages: [{ type: String }],

  price: {
    eur:     { type: Number, default: 0 },
    czk:     { type: Number, default: 0 },
    credits: { type: Number, default: 0 },
  },

  meetingPoint: {
    address:     { type: String, default: '' },
    lat:         { type: Number, default: 0 },
    lng:         { type: Number, default: 0 },
    description: { type: String, default: '' },
  },

  stops:     [StopSchema],
  images:    [{ type: String }],
  coverImage: { type: String, default: '' },

  included:     [{ type: String }],
  notIncluded:  [{ type: String }],
  requirements: [{ type: String }],

  category: { type: String, enum: ['walking','cycling','private','group','event'], default: 'walking' },

  rating:        { type: Number, default: 0 },
  reviewsCount:  { type: Number, default: 0 },
  totalBookings: { type: Number, default: 0 },

  isActive:     { type: Boolean, default: false },
  isFeatured:   { type: Boolean, default: false },
  isComingSoon: { type: Boolean, default: true },

  availableSpots: { type: Number, default: 8 },
}, { timestamps: true })

TourSchema.index({ city: 1, isActive: 1 })
TourSchema.index({ slug: 1 })

export default models.Tour ?? model<ITour>('Tour', TourSchema)
