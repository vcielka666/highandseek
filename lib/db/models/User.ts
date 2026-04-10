import mongoose, { type InferSchemaType } from 'mongoose'

const UserSchema = new mongoose.Schema({
  email:        { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  username:     { type: String, required: true, unique: true, trim: true },
  role:         { type: String, enum: ['user', 'admin'], default: 'user' },
  xp:           { type: Number, default: 0 },
  level:        { type: Number, default: 1 },
  credits:      { type: Number, default: 0 },
  avatar:       { type: String, default: '' },
  displayName:  { type: String, default: '' },
  bio:          { type: String, default: '', maxlength: 160 },
  location:     { type: String, default: '' },
  dateOfBirth:  { type: Date, default: null },
  experience:   { type: String, enum: ['beginner', 'intermediate', 'expert', 'master', ''], default: '' },
  preferredSetup: { type: String, enum: ['indoor', 'outdoor', 'both', ''], default: '' },
  favouriteType:  { type: String, enum: ['indica', 'sativa', 'hybrid', ''], default: '' },
  showLocation:        { type: Boolean, default: true },
  showAge:             { type: Boolean, default: true },
  emailNotifications:  { type: Boolean, default: true },
  links: {
    website:   { type: String, default: '' },
    instagram: { type: String, default: '' },
    telegram:  { type: String, default: '' },
    signal:    { type: String, default: '' },
    threema:   { type: String, default: '' },
  },
  favouriteStrains: [{ strainSlug: String, strainName: String }],
  badges:          [{ badgeId: String, earnedAt: Date }],
  followers:       [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  following:       [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  growsCompleted:  { type: Number, default: 0 },
  totalXpEarned:   { type: Number, default: 0 },
  showcaseBadges:  [{ type: String }],
  academy: {
    completedTopics: [{
      topicSlug:   { type: String },
      bestScore:   { type: Number, default: 0 },
      bestXp:      { type: Number, default: 0 },
      attempts:    { type: Number, default: 0 },
      completedAt: { type: Date },
    }],
  },
  walletAddress: { type: String, default: '' },
}, { timestamps: true })

export type IUser = InferSchemaType<typeof UserSchema> & { _id: mongoose.Types.ObjectId }

const User = (mongoose.models.User as mongoose.Model<IUser>) ||
  mongoose.model<IUser>('User', UserSchema)

export default User
