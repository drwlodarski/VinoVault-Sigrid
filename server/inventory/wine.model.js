const mongoose = require('mongoose')

const wineSchema = new mongoose.Schema(
  {
    wineId: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },
    wineName: {
      type: String,
      required: true,
      trim: true,
    },
    winery: {
      type: String,
      trim: true,
    },
    type: {
      type: String,
      enum: ['red', 'white', 'rosé', 'sparkling', 'dessert', 'other'],
    },
    region: {
      type: String,
      trim: true,
    },
    grapes: {
      type: String,
      trim: true,
    },
    vintage: {
      type: Number,
    },
  },
  { timestamps: true }
)

const WineModel = mongoose.models.Wine || mongoose.model('Wine', wineSchema)

module.exports = WineModel
