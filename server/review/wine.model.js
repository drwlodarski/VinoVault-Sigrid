const mongoose = require('mongoose')

const wineSchema = new mongoose.Schema(
  {
    wineId: { type: String, required: true, unique: true, index: true, sparse: true },
    name: { type: String, required: true },
    region: { type: String, default: '' },
    vintage: { type: String, default: '' },
    varietal: { type: String, default: '' },
    regularPrice: { type: Number, default: null },
    salePrice: { type: Number, default: null },
    stock: { type: Number, default: null },
    rating: { type: String, default: '0.0' },
    wineUrl: { type: String, default: '' },
  },
  { timestamps: true }
)

wineSchema.index({ name: 'text' })

const ReviewWineModel =
  mongoose.models.ReviewWine || mongoose.model('ReviewWine', wineSchema, 'wines')

module.exports = ReviewWineModel
