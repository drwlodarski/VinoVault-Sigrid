const mongoose = require('mongoose')

const ALLOWED_NOTES = [
  'Citrus',
  'Apple',
  'Pear',
  'Grapefruit',
  'Herbaceous',
  'Blackcurrant',
  'Blackberry',
  'Cedar',
  'Plum',
  'Cherry',
  'Chocolate',
  'Raspberry',
  'Earthy',
  'Black Pepper',
  'Smoky',
  'Spicy',
  'Tobacco',
  'Strawberry',
  'Tomato',
  'Leather',
  'Rose',
  'Tar',
]

const reviewSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    userName: { type: String, default: 'Anonymous' },
    wineId: { type: String, required: true, index: true },
    wineName: { type: String, required: true },
    rating: { type: Number, min: 0, max: 5, default: 0 },
    notes: {
      type: [String],
      validate: [(arr) => arr.length <= 3, 'At most 3 tasting notes are allowed'],
      default: [],
    },
    reviewText: { type: String, default: '' },
    photoUrl: { type: String, default: '' },
  },
  { timestamps: true }
)

reviewSchema.index({ wineName: 'text' })

const ReviewModel = mongoose.models.Review || mongoose.model('Review', reviewSchema)

module.exports = ReviewModel
module.exports.ALLOWED_NOTES = ALLOWED_NOTES
