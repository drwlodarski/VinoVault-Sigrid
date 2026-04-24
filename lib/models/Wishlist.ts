import mongoose, { Schema, Document } from 'mongoose'

export interface IWishlist extends Document {
  email: string
  wineId: string
  targetPrice: number
  isNotified: boolean
  createdAt: Date
  updatedAt: Date
}

const WishlistSchema = new Schema<IWishlist>(
  {
    email: { type: String, required: true },
    wineId: { type: String, required: true },
    targetPrice: { type: Number, required: true },
    isNotified: { type: Boolean, default: false },
  },
  { timestamps: true }
)

// Compound unique index: one wishlist entry per user per wine
WishlistSchema.index({ email: 1, wineId: 1 }, { unique: true })

// Prevent model recompilation errors in serverless hot-reload environments
export const Wishlist =
  mongoose.models.Wishlist ?? mongoose.model<IWishlist>('Wishlist', WishlistSchema)
