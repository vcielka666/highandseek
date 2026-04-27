import mongoose, { Schema, model, models } from 'mongoose'

export type PostType = 'photo' | 'video' | 'text' | 'grow_update'

export interface IPost {
  _id: mongoose.Types.ObjectId
  userId: mongoose.Types.ObjectId
  type: PostType
  content: {
    text?: string
    mediaUrl?: string
    mediaThumbnail?: string
    mediaType: 'image' | 'video' | null
    mediaWidth?: number
    mediaHeight?: number
    duration?: number
  }
  growUpdate?: {
    growId?: mongoose.Types.ObjectId
    day: number
    stage: string
    health: number
    strainName: string
    metrics: {
      temperature?: number
      humidity?: number
      ph?: number
    }
  }
  tags: string[]
  likes: mongoose.Types.ObjectId[]
  dislikes: mongoose.Types.ObjectId[]
  likesCount: number
  dislikesCount: number
  commentsCount: number
  isPublic: boolean
  isDeleted: boolean
  xpAwarded: number
  createdAt: Date
  updatedAt: Date
}

const PostSchema = new Schema<IPost>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: {
      type: String,
      enum: ['photo', 'video', 'text', 'grow_update'],
      required: true,
    },
    content: {
      text:           { type: String, maxlength: 500 },
      mediaUrl:       { type: String },
      mediaThumbnail: { type: String },
      mediaType:      { type: String, enum: ['image', 'video', null], default: null },
      mediaWidth:     { type: Number },
      mediaHeight:    { type: Number },
      duration:       { type: Number },
    },
    growUpdate: {
      growId:     { type: Schema.Types.ObjectId, ref: 'VirtualGrow' },
      day:        { type: Number },
      stage:      { type: String },
      health:     { type: Number },
      strainName: { type: String },
      metrics: {
        temperature: { type: Number },
        humidity:    { type: Number },
        ph:          { type: Number },
      },
    },
    tags:          { type: [String], default: [] },
    likes:         [{ type: Schema.Types.ObjectId, ref: 'User' }],
    dislikes:      [{ type: Schema.Types.ObjectId, ref: 'User' }],
    likesCount:    { type: Number, default: 0 },
    dislikesCount: { type: Number, default: 0 },
    commentsCount: { type: Number, default: 0 },
    isPublic:      { type: Boolean, default: true },
    isDeleted:     { type: Boolean, default: false },
    xpAwarded:     { type: Number, default: 0 },
  },
  { timestamps: true },
)

PostSchema.index({ userId: 1, createdAt: -1 })
PostSchema.index({ likesCount: -1, createdAt: -1 })
PostSchema.index({ isDeleted: 1, isPublic: 1, createdAt: -1 })

export default (models.Post as mongoose.Model<IPost>) ?? model<IPost>('Post', PostSchema)
