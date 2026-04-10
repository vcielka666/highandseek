import mongoose, { type InferSchemaType } from 'mongoose'

const ForumQuestionSchema = new mongoose.Schema({
  userId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  question: { type: String, required: true },
  answer:   { type: String, default: '' },
  sources:  [{ site: String, title: String, url: String }],
  helpful:  { type: Boolean, default: null },
}, { timestamps: true })

export type IForumQuestion = InferSchemaType<typeof ForumQuestionSchema> & { _id: mongoose.Types.ObjectId }

const ForumQuestion = (mongoose.models.ForumQuestion as mongoose.Model<IForumQuestion>) ||
  mongoose.model<IForumQuestion>('ForumQuestion', ForumQuestionSchema)

export default ForumQuestion
