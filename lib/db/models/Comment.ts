import mongoose, { Schema, model, models } from 'mongoose'

export interface IComment {
  _id: mongoose.Types.ObjectId
  postId: mongoose.Types.ObjectId
  userId: mongoose.Types.ObjectId
  text: string
  likes: mongoose.Types.ObjectId[]
  likesCount: number
  isDeleted: boolean
  createdAt: Date
  updatedAt: Date
}

const CommentSchema = new Schema<IComment>(
  {
    postId:    { type: Schema.Types.ObjectId, ref: 'Post', required: true },
    userId:    { type: Schema.Types.ObjectId, ref: 'User', required: true },
    text:      { type: String, required: true, maxlength: 300, trim: true },
    likes:     [{ type: Schema.Types.ObjectId, ref: 'User' }],
    likesCount: { type: Number, default: 0 },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true },
)

CommentSchema.index({ postId: 1, createdAt: -1 })
CommentSchema.index({ userId: 1 })

export default (models.Comment as mongoose.Model<IComment>) ?? model<IComment>('Comment', CommentSchema)
