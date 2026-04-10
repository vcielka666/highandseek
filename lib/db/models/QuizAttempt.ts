import mongoose, { type InferSchemaType } from 'mongoose'

const QuizAttemptSchema = new mongoose.Schema({
  userId:          { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  topicSlug:       { type: String, required: true },
  attemptNumber:   { type: Number, required: true },
  creditsCost:     { type: Number, default: 0 },
  answers: [{
    questionId:    { type: mongoose.Schema.Types.ObjectId, ref: 'AcademyQuestion' },
    selectedIndex: { type: Number, required: true },
    isCorrect:     { type: Boolean, required: true },
    timeSpent:     { type: Number, default: 0 },
    xpEarned:      { type: Number, default: 0 },
  }],
  totalXp:         { type: Number, default: 0 },
  score:           { type: Number, default: 0 },
  totalQuestions:  { type: Number, default: 15 },
  completedAt:     { type: Date, default: Date.now },
  isPerfect:       { type: Boolean, default: false },
  newBadges:       [{ type: String }],
}, { timestamps: true })

export type IQuizAttempt = InferSchemaType<typeof QuizAttemptSchema> & { _id: mongoose.Types.ObjectId }

const QuizAttempt = (mongoose.models.QuizAttempt as mongoose.Model<IQuizAttempt>) ||
  mongoose.model<IQuizAttempt>('QuizAttempt', QuizAttemptSchema)

export default QuizAttempt
