const mongoose = require('mongoose')

const wishlistSchema = new mongoose.Schema(
  {
    email: { type: String, required: true },
    wineId: { type: String, required: true },
    targetPrice: { type: Number, required: true },
    isNotified: { type: Boolean, default: false },
  },
  { timestamps: true }
)

wishlistSchema.index({ email: 1, wineId: 1 }, { unique: true })

const DiscoveryWishlistModel =
  mongoose.models.DiscoveryWishlist ||
  mongoose.model('DiscoveryWishlist', wishlistSchema, 'wishlists')

module.exports = DiscoveryWishlistModel
