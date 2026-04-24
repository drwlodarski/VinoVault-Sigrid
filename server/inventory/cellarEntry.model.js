const mongoose = require('mongoose')

const cellarEntrySchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    wineId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Wine',
      required: true,
    },
    wineName: {
      type: String,
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
    vintage: {
      type: Number,
    },
    quantity: {
      type: Number,
      required: true,
      default: 1,
      min: 0,
    },
    purchaseDate: {
      type: String,
    },
    storageLocation: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['storing', 'ready', 'consumed'],
      default: 'storing',
    },
    notes: {
      type: String,
      trim: true,
    },
    noteImages: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true }
)

const CellarEntryModel = mongoose.model('CellarEntry', cellarEntrySchema)

module.exports = CellarEntryModel
