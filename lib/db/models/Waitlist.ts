import mongoose, { Schema, model, models } from 'mongoose'

export interface IWaitlist {
  email: string
  source: string
  createdAt: Date
}

const WaitlistSchema = new Schema<IWaitlist>({
  email:     { type: String, required: true, lowercase: true, trim: true },
  source:    { type: String, required: true, default: 'tours' },
  createdAt: { type: Date,   default: Date.now },
})

WaitlistSchema.index({ email: 1, source: 1 }, { unique: true })

export default models.Waitlist ?? model<IWaitlist>('Waitlist', WaitlistSchema)
