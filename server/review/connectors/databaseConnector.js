const ReviewModel = require('../review.model')
const WineModel = require('../wine.model')

async function insertReview(reviewData) {
  const doc = await ReviewModel.create(reviewData)
  return doc.toObject()
}

async function findReviewById(reviewId) {
  return ReviewModel.findById(reviewId).lean()
}

async function findReviewsByWine(wineId, sortOrder = 'newest', pagination = {}) {
  const { limit = 50, skip = 0 } = pagination
  const sortMap = {
    newest: { createdAt: -1 },
    oldest: { createdAt: 1 },
    highest: { rating: -1, createdAt: -1 },
    lowest: { rating: 1, createdAt: -1 },
  }
  const sort = sortMap[sortOrder] || sortMap.newest
  return ReviewModel.find({ wineId }).sort(sort).skip(skip).limit(limit).lean()
}

async function updateReview(reviewId, userId, updates) {
  const review = await ReviewModel.findById(reviewId)
  if (!review) {
    const err = new Error('Review not found')
    err.status = 404
    throw err
  }
  if (review.userId !== userId) {
    const err = new Error('You can only edit your own reviews')
    err.status = 403
    throw err
  }
  Object.assign(review, updates)
  await review.save()
  return review.toObject()
}

async function deleteReview(reviewId, userId) {
  const review = await ReviewModel.findById(reviewId)
  if (!review) {
    const err = new Error('Review not found')
    err.status = 404
    throw err
  }
  if (review.userId !== userId) {
    const err = new Error('You can only delete your own reviews')
    err.status = 403
    throw err
  }
  await review.deleteOne()
  return { wineId: review.wineId, reviewId }
}

async function computeWineAggregates(wineId) {
  const [agg] = await ReviewModel.aggregate([
    { $match: { wineId } },
    {
      $group: {
        _id: '$wineId',
        averageRating: { $avg: '$rating' },
        reviewCount: { $sum: 1 },
        notes: { $push: '$notes' },
      },
    },
  ])
  if (!agg) return { averageRating: 0, reviewCount: 0, topNotes: [] }

  const noteCounts = {}
  for (const noteArr of agg.notes) {
    for (const note of noteArr) {
      noteCounts[note] = (noteCounts[note] || 0) + 1
    }
  }
  const topNotes = Object.entries(noteCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([note, count]) => ({ note, count }))

  return {
    averageRating: Number(agg.averageRating.toFixed(2)),
    reviewCount: agg.reviewCount,
    topNotes,
  }
}

async function findWinesByName(query, limit = 20) {
  if (!query || !query.trim()) {
    return WineModel.find({}).limit(limit).lean()
  }
  const regex = new RegExp(query.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')
  return WineModel.find({ name: regex }).limit(limit).lean()
}

async function findOrCreateWineByName(name) {
  const trimmed = (name || '').trim()
  if (!trimmed) {
    const err = new Error('Wine name is required')
    err.status = 400
    throw err
  }
  const existing = await WineModel.findOne({
    name: new RegExp(`^${trimmed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i'),
  }).lean()
  if (existing) return existing

  const wineId = `USER_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
  const doc = await WineModel.create({ wineId, name: trimmed })
  return doc.toObject()
}

async function findWinesWithReviews(searchQuery = '', limit = 30) {
  const match = {}
  if (searchQuery && searchQuery.trim()) {
    const regex = new RegExp(searchQuery.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')
    match.wineName = regex
  }

  return ReviewModel.aggregate([
    { $match: match },
    {
      $group: {
        _id: '$wineId',
        wineName: { $first: '$wineName' },
        averageRating: { $avg: '$rating' },
        reviewCount: { $sum: 1 },
        lastReviewedAt: { $max: '$createdAt' },
      },
    },
    { $sort: { lastReviewedAt: -1 } },
    { $limit: limit },
  ])
}

module.exports = {
  insertReview,
  findReviewById,
  findReviewsByWine,
  updateReview,
  deleteReview,
  computeWineAggregates,
  findWinesByName,
  findOrCreateWineByName,
  findWinesWithReviews,
}
