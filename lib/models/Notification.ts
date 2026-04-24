import mongoose, { Schema, Document } from 'mongoose'

export interface INotification extends Document {
  email: string
  wineId: string
  wineName: string
  wineUrl: string
  previousPrice: number | null
  currentPrice: number
  targetPrice: number
  isRead: boolean
  createdAt: Date
  updatedAt: Date
}

const NotificationSchema = new Schema<INotification>(
  {
    email: { type: String, required: true, index: true },
    wineId: { type: String, required: true },
    wineName: { type: String, required: true },
    wineUrl: { type: String, required: true },
    previousPrice: { type: Number, default: null },
    currentPrice: { type: Number, required: true },
    targetPrice: { type: Number, required: true },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
)

export const Notification =
  mongoose.models.Notification ?? mongoose.model<INotification>('Notification', NotificationSchema)
