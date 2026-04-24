const mongoose = require('mongoose')

const wineSchema = new mongoose.Schema(
  {
    wineId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    vintage: { type: mongoose.Schema.Types.Mixed, default: null },
    region: { type: String, default: null },
    stock: { type: Number, default: null },
    regularPrice: { type: Number, default: null },
    salePrice: { type: Number, default: null },
    rating: { type: String, default: null },
    wineUrl: { type: String, default: null },
  },
  { timestamps: true }
)

wineSchema.index({ name: 'text' })

const DiscoveryWineModel =
  mongoose.models.DiscoveryWine || mongoose.model('DiscoveryWine', wineSchema, 'wines')

module.exports = DiscoveryWineModel
