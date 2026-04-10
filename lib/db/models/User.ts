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
  bio:          { type: String, default: '', maxlength: 160 },
  location:     { type: String, default: '' },
  links: {
    website:   { type: String, default: '' },
    instagram: { type: String, default: '' },
  },
  favouriteStrains: [{ strainSlug: String, strainName: String }],
  badges:          [{ badgeId: String, earnedAt: Date }],
  followers:       [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  following:       [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  growsCompleted:  { type: Number, default: 0 },
  totalXpEarned:   { type: Number, default: 0 },
  showcaseBadges:  [{ type: String }],
}, { timestamps: true })

export type IUser = InferSchemaType<typeof UserSchema> & { _id: mongoose.Types.ObjectId }

const User = (mongoose.models.User as mongoose.Model<IUser>) ||
  mongoose.model<IUser>('User', UserSchema)

export default User
