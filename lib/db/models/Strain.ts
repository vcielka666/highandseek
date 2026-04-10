import mongoose, { type InferSchemaType } from 'mongoose'

const AvatarLevelSchema = new mongoose.Schema({
  level:          { type: Number, required: true },
  imageUrl:       { type: String, default: '' },
  animationClass: { type: String, default: 'idle-float' },
}, { _id: false })

const BackgroundSchema = new mongoose.Schema({
  url:      { type: String, default: '' },
  moodHint: { type: String, default: '' },  // injected into AI system prompt when this bg is active
}, { _id: false })

const StrainSchema = new mongoose.Schema({
  slug:          { type: String, required: true, unique: true, lowercase: true, trim: true },
  name:          { type: String, required: true },
  type:          { type: String, enum: ['indica', 'sativa', 'hybrid'], required: true },
  genetics:      { type: String, default: '' },
  floweringTime: { type: Number, default: 0 },
  difficulty:    { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },

  personality: {
    archetype:          { type: String, default: '' },
    tone:               [{ type: String }],
    catchphrase:        { type: String, default: '' },
    favoriteAction:     { type: String, default: 'water' },
    hatedAction:        { type: String, default: 'flush' },
    topics:             [{ type: String }],
    forbiddenTopics:    [{ type: String }],
    systemPrompt:       { type: String, default: '' },
    customSystemPrompt: { type: String, default: '' },
  },

  visuals: {
    avatarLevels:    { type: [AvatarLevelSchema], default: () => Array.from({ length: 10 }, (_, i) => ({ level: i + 1, imageUrl: '', animationClass: 'idle-float' })) },
    backgrounds:     { type: [BackgroundSchema], default: [] },  // up to 4 admin-curated bg slots
    idleAnimation:   { type: String, default: 'idle-float' },
    happyAnimation:  { type: String, default: 'happy-bounce' },
    sadAnimation:    { type: String, default: 'sad-droop' },
  },

  stats: {
    totalChats:      { type: Number, default: 0 },
    totalMessages:   { type: Number, default: 0 },
    helpfulVotes:    { type: Number, default: 0 },
    unhelpfulVotes:  { type: Number, default: 0 },
  },

  shopProductSlug: { type: String, default: '' },
  isActive:        { type: Boolean, default: true },
  isComingSoon:    { type: Boolean, default: false },
}, { timestamps: true })

export type IStrain = InferSchemaType<typeof StrainSchema> & { _id: mongoose.Types.ObjectId }

const Strain = (mongoose.models.Strain as mongoose.Model<IStrain>) ||
  mongoose.model<IStrain>('Strain', StrainSchema)

export default Strain
