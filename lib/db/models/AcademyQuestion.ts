import mongoose, { type InferSchemaType } from 'mongoose'

const AcademyQuestionSchema = new mongoose.Schema({
  topicSlug:    { type: String, required: true, index: true },
  phase:        { type: Number, enum: [1, 2, 3], required: true },
  question:     { type: String, required: true },
  options:      [{ type: String }],
  correctIndex: { type: Number, required: true },
  explanation:  { type: String, required: true },
  isTimed:      { type: Boolean, default: false },
  timeLimit:    { type: Number, default: 20 },
  difficulty:   { type: String, enum: ['easy', 'medium', 'hard'], required: true },
  language:     { type: String, enum: ['cs', 'en'], default: 'cs', index: true },
  isActive:     { type: Boolean, default: true },
}, { timestamps: true })

export type IAcademyQuestion = InferSchemaType<typeof AcademyQuestionSchema> & { _id: mongoose.Types.ObjectId }

const AcademyQuestion = (mongoose.models.AcademyQuestion as mongoose.Model<IAcademyQuestion>) ||
  mongoose.model<IAcademyQuestion>('AcademyQuestion', AcademyQuestionSchema)

export default AcademyQuestion
