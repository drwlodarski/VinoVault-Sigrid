const RecommendationStrategy = require('./recommendationStrategy')
const { currentPrice, parseRating, publicWine, saleBoost, withReviewStats } = require('./scoring')

class FilterRankingStrategy extends RecommendationStrategy {
  constructor(repository) {
    super()
    this.repository = repository
  }

  // Heuristic browse score that balances quality, confidence, availability,
  // and value for open-ended discovery.
  scoreWine(wine) {
    let score = 0
    const rating = wine.averageRating || parseRating(wine.rating)
    const reviewConfidence = Math.min(wine.reviewCount || 0, 20) / 20
    const price = currentPrice(wine)

    score += rating * 14
    score += reviewConfidence * 18
    score += saleBoost(wine) * 1.4

    if (wine.stock == null || wine.stock > 0) score += 4
    if (price != null && price < 60) score += 4
    if (!wine.reviewCount || wine.reviewCount < 3) score += 3

    return score
  }

  // Explain why a wine surfaced near the top of the browse results.
  reasonFor(wine) {
    if (wine.salePrice != null && wine.regularPrice != null && wine.salePrice < wine.regularPrice) {
      return 'Strong value pick from the catalog'
    }
    if ((wine.reviewCount || 0) >= 5 && (wine.averageRating || 0) >= 4) {
      return 'Community favorite worth browsing'
    }
    if ((wine.reviewCount || 0) < 3) {
      return 'Underrated bottle to explore'
    }
    return 'Balanced pick for open-ended discovery'
  }

  // Default discovery mode: rank filtered candidates and paginate the results.
  async recommend(input) {
    const page = Math.max(1, Number(input.page || 1) || 1)
    const limit = Math.min(60, Math.max(1, Number(input.limit || 24) || 24))
    const candidates = await this.repository.findCandidateWines(input)
    const statsMap = await this.repository.getReviewStats(candidates.map((wine) => wine.wineId))

    const ranked = withReviewStats(candidates, statsMap)
      .map((wine) => ({ wine, score: this.scoreWine(wine) }))
      .sort((a, b) => b.score - a.score)

    const start = (page - 1) * limit
    const paged = ranked
      .slice(start, start + limit)
      .map(({ wine, score }) => publicWine(wine, this.reasonFor(wine), score))
    const hasMore = page * limit < ranked.length

    return {
      strategy: 'filter-ranking',
      data: paged,
      meta: {
        page,
        limit,
        total: ranked.length,
        hasMore,
        nextPage: hasMore ? page + 1 : null,
      },
    }
  }
}

module.exports = FilterRankingStrategy
