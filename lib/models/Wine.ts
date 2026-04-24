import mongoose, { Schema, Document } from 'mongoose'

export interface IWine extends Document {
  wineId: string
  name: string
  vintage: string | number | null
  region: string | null
  stock: number | null
  regularPrice: number | null
  salePrice: number | null
  rating: string | null
  wineUrl: string | null
}

const WineSchema = new Schema<IWine>(
  {
    wineId: { type: String, required: true, unique: true, index: true, sparse: true },
    name: { type: String, required: true },
    vintage: { type: Schema.Types.Mixed, default: null },
    region: { type: String, default: null },
    stock: { type: Number, default: null },
    regularPrice: { type: Number, default: null },
    salePrice: { type: Number, default: null },
    rating: { type: String, default: null },
    wineUrl: { type: String, default: null },
  },
  { timestamps: true }
)

// Mirrors server/src/modules/wines/wine.model.js — both share the same MongoDB collection
export const Wine = mongoose.models.Wine ?? mongoose.model<IWine>('Wine', WineSchema)
