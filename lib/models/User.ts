import mongoose, { Schema, Document } from 'mongoose'

export interface IUser extends Document {
  clerkId: string
  email: string
  username: string
  profile: Record<string, unknown>
  createdAt: Date
  updatedAt: Date
}

const UserSchema = new Schema<IUser>(
  {
    clerkId: { type: String, required: true, unique: true, index: true },
    email: { type: String, required: true },
    username: { type: String, default: '' },
    profile: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
)

// Prevent model recompilation errors in serverless hot-reload environments
export const User = mongoose.models.User ?? mongoose.model<IUser>('User', UserSchema)
