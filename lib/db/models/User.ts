import mongoose, { type InferSchemaType } from 'mongoose'

const UserSchema = new mongoose.Schema({
  email:        { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  username:     { type: String, required: true, unique: true, trim: true },
  role:         { type: String, enum: ['user', 'admin'], default: 'user' },
  xp:           { type: Number, default: 0 },
  level:        { type: Number, default: 1 },
  avatar:       { type: String, default: '' },
}, { timestamps: true })

export type IUser = InferSchemaType<typeof UserSchema> & { _id: mongoose.Types.ObjectId }

const User = (mongoose.models.User as mongoose.Model<IUser>) ||
  mongoose.model<IUser>('User', UserSchema)

export default User
