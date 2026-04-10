import mongoose, { type InferSchemaType } from 'mongoose'

const CareHistorySchema = new mongoose.Schema({
  action:    { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  xpEarned:  { type: Number, default: 0 },
}, { _id: false })

const AvatarStateSchema = new mongoose.Schema({
  userId:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  strainSlug: { type: String, required: true, index: true },

  level:        { type: Number, default: 1, min: 1, max: 10 },
  xp:           { type: Number, default: 0 },
  xpToNextLevel:{ type: Number, default: 50 },

  needs: {
    hydration:   { type: Number, default: 80, min: 0, max: 100 },
    nutrients:   { type: Number, default: 80, min: 0, max: 100 },
    energy:      { type: Number, default: 80, min: 0, max: 100 },
    happiness:   { type: Number, default: 80, min: 0, max: 100 },
    lastUpdated: { type: Date, default: Date.now },
  },

  status: {
    type: String,
    enum: ['thriving', 'happy', 'neutral', 'sad', 'wilting'],
    default: 'happy',
  },

  cooldowns: {
    water: { type: Date, default: null },
    feed:  { type: Date, default: null },
    light: { type: Date, default: null },
    flush: { type: Date, default: null },
  },

  careHistory: { type: [CareHistorySchema], default: [] },

  customBackground:    { type: String, default: '' },   // URL of user's active bg ('' = strain default)
  customMoodHint:      { type: String, default: '' },   // mood hint for user-uploaded custom bgs
  unlockedBackgrounds: { type: [String], default: [] }, // URLs the user has already paid for

  chatCount:   { type: Number, default: 0 },
  lastChatAt:  { type: Date, default: null },
  lastCareAt:  { type: Date, default: null },
}, { timestamps: true })

AvatarStateSchema.index({ userId: 1, strainSlug: 1 }, { unique: true })

export type IAvatarState = InferSchemaType<typeof AvatarStateSchema> & { _id: mongoose.Types.ObjectId }

const AvatarState = (mongoose.models.AvatarState as mongoose.Model<IAvatarState>) ||
  mongoose.model<IAvatarState>('AvatarState', AvatarStateSchema)

export default AvatarState
