import mongoose, { type InferSchemaType } from 'mongoose'

const AcademyTopicSchema = new mongoose.Schema({
  slug:           { type: String, required: true, unique: true },
  title:          { type: String, required: true },  // Czech
  description:    { type: String, required: true },  // Czech
  titleEn:        { type: String, default: '' },
  descriptionEn:  { type: String, default: '' },
  icon:           { type: String, required: true },
  difficulty:     { type: String, enum: ['beginner', 'intermediate', 'advanced'], required: true },
  totalQuestions: { type: Number, default: 0 },
  xpAvailable:    { type: Number, default: 450 },
  order:          { type: Number, required: true },
  isActive:       { type: Boolean, default: true },
}, { timestamps: true })

export type IAcademyTopic = InferSchemaType<typeof AcademyTopicSchema> & { _id: mongoose.Types.ObjectId }

const AcademyTopic = (mongoose.models.AcademyTopic as mongoose.Model<IAcademyTopic>) ||
  mongoose.model<IAcademyTopic>('AcademyTopic', AcademyTopicSchema)

export default AcademyTopic
