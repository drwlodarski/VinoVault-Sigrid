function parseRating(value) {
  const rating = Number(value)
  return Number.isFinite(rating) ? rating : 0
}

// Prefer sale price when available so ranking logic uses what the user would pay now.
function currentPrice(wine) {
  return wine.salePrice ?? wine.regularPrice ?? null
}

// Normalize prices into coarse buckets for filtering and preference matching.
function priceBucket(price) {
  if (price == null) return 'unknown'
  if (price < 30) return 'under-30'
  if (price < 60) return '30-60'
  if (price < 100) return '60-100'
  return '100-plus'
}

// Reward discounted wines, capped so sales help but do not dominate ranking.
function saleBoost(wine) {
  if (wine.salePrice == null || wine.regularPrice == null) return 0
  if (wine.salePrice >= wine.regularPrice) return 0
  return Math.min(10, ((wine.regularPrice - wine.salePrice) / wine.regularPrice) * 20)
}

// Attach review-derived signals to raw wine documents before scoring.
function withReviewStats(wines, statsMap) {
  return wines.map((wine) => {
    const stats = statsMap.get(wine.wineId) || {}
    return {
      ...wine,
      averageRating: stats.averageRating ?? parseRating(wine.rating),
      reviewCount: stats.reviewCount ?? 0,
      topNotes: stats.topNotes ?? [],
    }
  })
}

// Shape the final response object returned to the frontend across all strategies.
function publicWine(wine, reason, score) {
  return {
    wineId: wine.wineId,
    name: wine.name,
    vintage: wine.vintage ?? null,
    region: wine.region ?? null,
    stock: wine.stock ?? null,
    regularPrice: wine.regularPrice ?? null,
    salePrice: wine.salePrice ?? null,
    rating: wine.rating ?? null,
    averageRating: wine.averageRating ?? parseRating(wine.rating),
    reviewCount: wine.reviewCount ?? 0,
    topNotes: wine.topNotes ?? [],
    wineUrl: wine.wineUrl ?? null,
    reason,
    score: Number(score.toFixed(2)),
  }
}

module.exports = {
  currentPrice,
  parseRating,
  priceBucket,
  publicWine,
  saleBoost,
  withReviewStats,
}
