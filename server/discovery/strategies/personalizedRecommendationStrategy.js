const FilterRankingStrategy = require('./filterRankingStrategy')
const { currentPrice, priceBucket, publicWine, withReviewStats } = require('./scoring')

class PersonalizedRecommendationStrategy extends FilterRankingStrategy {
  constructor(repository) {
    super(repository)
  }

  // Turn the user's reviews, cellar entries, and wishlist activity into
  // lightweight preference signals that can bias ranking.
  buildPreferences(signals) {
    const regions = new Map()
    const buckets = new Map()
    const notes = new Map()
    const likedWineIds = new Set()
    const wishlistWineIds = new Set()

    for (const entry of signals.cellarEntries || []) {
      if (entry.region) regions.set(entry.region, (regions.get(entry.region) || 0) + 2)
    }

    for (const review of signals.reviews || []) {
      if (review.rating >= 4) {
        likedWineIds.add(review.wineId)
        for (const note of review.notes || []) {
          notes.set(note, (notes.get(note) || 0) + 2)
        }
      }
    }

    for (const item of signals.wishlist || []) {
      wishlistWineIds.add(item.wineId)
      buckets.set(
        priceBucket(item.targetPrice),
        (buckets.get(priceBucket(item.targetPrice)) || 0) + 2
      )
    }

    for (const wine of signals.signalWines || []) {
      if (wine.region && (likedWineIds.has(wine.wineId) || wishlistWineIds.has(wine.wineId))) {
        regions.set(wine.region, (regions.get(wine.region) || 0) + 1)
      }
      const price = currentPrice(wine)
      if (price != null && (likedWineIds.has(wine.wineId) || wishlistWineIds.has(wine.wineId))) {
        buckets.set(priceBucket(price), (buckets.get(priceBucket(price)) || 0) + 1)
      }
    }

    return { regions, buckets, notes, likedWineIds, wishlistWineIds }
  }

  // Start from the generic browse score, then adjust it with user-specific signals.
  scoreWine(wine, input, preferences) {
    let score = super.scoreWine(wine)
    const price = currentPrice(wine)

    if (wine.region && preferences.regions.has(wine.region)) {
      score += preferences.regions.get(wine.region) * 8
    }

    const bucket = priceBucket(price)
    if (preferences.buckets.has(bucket)) {
      score += preferences.buckets.get(bucket) * 7
    }

    for (const note of wine.topNotes || []) {
      if (preferences.notes.has(note)) {
        score += preferences.notes.get(note) * 5
      }
    }

    if (preferences.likedWineIds.has(wine.wineId)) {
      score -= 30
    }

    if (preferences.wishlistWineIds.has(wine.wineId)) {
      score -= 18
    }

    return score
  }

  // Generate a recommendation explanation tied to the strongest personal signal.
  reasonFor(wine, preferences) {
    if (wine.region && preferences.regions.has(wine.region)) {
      return `Similar to wines from ${wine.region} you've saved or reviewed`
    }
    if (preferences.buckets.has(priceBucket(currentPrice(wine)))) {
      return 'Fits the price range you tend to watch'
    }
    for (const note of wine.topNotes || []) {
      if (preferences.notes.has(note)) {
        return `Matches tasting notes you rated highly`
      }
    }
    if ((wine.averageRating || 0) >= 4) {
      return 'Well rated by the community'
    }
    return 'Recommended from your wine activity'
  }

  // Personalized discovery: combine catalog quality with inferred user taste.
  async recommend(input) {
    const page = Math.max(1, Number(input.page || 1) || 1)
    const limit = Math.min(60, Math.max(1, Number(input.limit || 24) || 24))
    const [signals, candidates] = await Promise.all([
      this.repository.getUserSignals(input.userId),
      this.repository.findCandidateWines(input),
    ])
    const statsMap = await this.repository.getReviewStats(candidates.map((wine) => wine.wineId))
    const preferences = this.buildPreferences(signals)
    const hasPersonalSignals =
      preferences.regions.size > 0 ||
      preferences.buckets.size > 0 ||
      preferences.notes.size > 0 ||
      preferences.likedWineIds.size > 0 ||
      preferences.wishlistWineIds.size > 0

    const ranked = withReviewStats(candidates, statsMap)
      .map((wine) => ({ wine, score: this.scoreWine(wine, input, preferences) }))
      .sort((a, b) => b.score - a.score)

    const start = (page - 1) * limit
    const paged = ranked
      .slice(start, start + limit)
      .map(({ wine, score }) =>
        publicWine(
          wine,
          hasPersonalSignals
            ? this.reasonFor(wine, preferences)
            : 'Popular starting point for your cellar',
          score
        )
      )

    return {
      strategy: 'personalized',
      data: paged,
      meta: {
        page,
        limit,
        total: ranked.length,
        hasMore: page * limit < ranked.length,
        nextPage: page * limit < ranked.length ? page + 1 : null,
        personalized: hasPersonalSignals,
      },
    }
  }
}

module.exports = PersonalizedRecommendationStrategy
