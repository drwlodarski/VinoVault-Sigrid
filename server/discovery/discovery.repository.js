const mongoose = require('mongoose')
const WineModel = require('./wine.model')
const WishlistModel = require('./wishlist.model')
const ReviewModel = require('../review/review.model')
const CellarEntryModel = require('../inventory/cellarEntry.model')

const PRICE_RANGES = {
  'under-30': { $lt: 30 },
  '30-60': { $gte: 30, $lt: 60 },
  '60-100': { $gte: 60, $lt: 100 },
  '100-plus': { $gte: 100 },
}

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

// Translate query params into a Mongo filter shared by browse, search,
// and personalized discovery flows.
function buildWineFilter(input = {}) {
  const filter = { name: { $exists: true, $nin: [null, ''] } }
  const search = String(input.search || input.q || '').trim()
  const region = String(input.region || '').trim()
  const priceRange = String(input.priceRange || '').trim()

  if (search.length >= 2) {
    filter.name = {
      $exists: true,
      $nin: [null, ''],
      $regex: escapeRegex(search),
      $options: 'i',
    }
  }

  if (region) {
    filter.region = region
  }

  if (PRICE_RANGES[priceRange]) {
    filter.salePrice = PRICE_RANGES[priceRange]
  }

  return filter
}

// Basic paginated wine lookup used when a caller wants raw filtered results.
async function findWines(input = {}) {
  const page = Math.max(1, Number(input.page || 1) || 1)
  const limit = Math.min(60, Math.max(1, Number(input.limit || 24) || 24))
  const filter = buildWineFilter(input)

  const [wines, total] = await Promise.all([
    WineModel.find(filter)
      .select('wineId name vintage region stock regularPrice salePrice rating wineUrl')
      .sort({ name: 1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    WineModel.countDocuments(filter),
  ])

  return {
    wines,
    meta: {
      page,
      limit,
      total,
      hasMore: page * limit < total,
      nextPage: page * limit < total ? page + 1 : null,
    },
  }
}

// Fetch a bounded candidate set that strategies can score in memory.
async function findCandidateWines(input = {}) {
  const limit = Math.min(1000, Math.max(24, Number(input.candidateLimit || 160) || 160))
  return WineModel.find(buildWineFilter(input))
    .select('wineId name vintage region stock regularPrice salePrice rating wineUrl')
    .limit(limit)
    .lean()
}

// Return all distinct non-empty regions so the UI can offer region filters.
async function listRegions() {
  const regions = await WineModel.distinct('region', {
    region: { $nin: [null, ''] },
  })
  return regions
    .filter((value) => typeof value === 'string' && value.trim())
    .sort((a, b) => a.localeCompare(b))
}

// Aggregate review-derived signals per wine so strategies can rank by
// community sentiment instead of relying only on catalog metadata.
async function getReviewStats(wineIds) {
  if (!wineIds.length) return new Map()

  const stats = await ReviewModel.aggregate([
    { $match: { wineId: { $in: wineIds } } },
    {
      $group: {
        _id: '$wineId',
        averageRating: { $avg: '$rating' },
        reviewCount: { $sum: 1 },
        notes: { $push: '$notes' },
      },
    },
  ])

  return new Map(
    stats.map((item) => {
      const noteCounts = {}
      for (const noteGroup of item.notes || []) {
        for (const note of noteGroup || []) {
          noteCounts[note] = (noteCounts[note] || 0) + 1
        }
      }
      const topNotes = Object.entries(noteCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([note]) => note)

      return [
        item._id,
        {
          averageRating: Number((item.averageRating || 0).toFixed(2)),
          reviewCount: item.reviewCount || 0,
          topNotes,
        },
      ]
    })
  )
}

// Resolve the app user document that corresponds to the authenticated Clerk user.
async function getUserProfile(userId) {
  const User =
    mongoose.models.User ||
    mongoose.model(
      'User',
      new mongoose.Schema({ clerkId: String, email: String }, { strict: false })
    )
  return User.findOne({ clerkId: userId }).lean()
}

// Collect cross-feature behavior signals that power personalized recommendations.
async function getUserSignals(userId) {
  const [reviews, cellarEntries, user] = await Promise.all([
    ReviewModel.find({ userId }).select('wineId wineName rating notes').lean(),
    CellarEntryModel.find({ userId }).select('wineName region type quantity').lean(),
    getUserProfile(userId),
  ])

  let wishlist = []
  if (user && user.email) {
    wishlist = await WishlistModel.find({ email: user.email }).select('wineId targetPrice').lean()
  }

  const signalWineIds = [
    ...new Set([...reviews.map((review) => review.wineId), ...wishlist.map((item) => item.wineId)]),
  ]
  const signalWines = signalWineIds.length
    ? await WineModel.find({ wineId: { $in: signalWineIds } })
        .select('wineId name region salePrice regularPrice rating')
        .lean()
    : []

  return { reviews, cellarEntries, wishlist, signalWines }
}

module.exports = {
  findWines,
  findCandidateWines,
  listRegions,
  getReviewStats,
  getUserSignals,
}
