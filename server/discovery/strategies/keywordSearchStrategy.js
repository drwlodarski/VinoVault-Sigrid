const RecommendationStrategy = require('./recommendationStrategy')
const { parseRating, publicWine, withReviewStats } = require('./scoring')

function normalize(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
}

class KeywordSearchStrategy extends RecommendationStrategy {
  constructor(repository) {
    super()
    this.repository = repository
  }

  // Score how strongly the query matches the wine name.
  matchScore(wine, query) {
    const name = normalize(wine.name)
    const q = normalize(query)
    if (!q) return 0
    if (name === q) return 100
    if (name.startsWith(q)) return 85
    if (name.includes(q)) return 65

    const terms = q.split(/\s+/).filter(Boolean)
    const matchedTerms = terms.filter((term) => name.includes(term)).length
    return matchedTerms ? 35 + (matchedTerms / terms.length) * 25 : 0
  }

  // Convert a numeric match strength into a user-facing explanation.
  reasonFor(score) {
    if (score >= 95) return 'Exact name match'
    if (score >= 80) return 'Strong name match'
    if (score >= 60) return 'Close keyword match'
    return 'Related keyword match'
  }

  // Search-oriented ranking: filter by text match, then break ties with quality.
  async recommend(input) {
    const query = String(input.search || input.q || '').trim()
    const page = Math.max(1, Number(input.page || 1) || 1)
    const limit = Math.min(60, Math.max(1, Number(input.limit || 24) || 24))
    if (query.length < 2) {
      return {
        strategy: 'keyword',
        data: [],
        meta: { page, limit, total: 0, hasMore: false, nextPage: null },
      }
    }

    const candidates = await this.repository.findCandidateWines({
      ...input,
      search: query,
      candidateLimit: 1000,
    })
    const statsMap = await this.repository.getReviewStats(candidates.map((wine) => wine.wineId))
    const ranked = withReviewStats(candidates, statsMap)
      .map((wine) => {
        const match = this.matchScore(wine, query)
        const quality = (wine.averageRating || parseRating(wine.rating)) * 3
        return { wine, match, score: match + quality }
      })
      .filter((item) => item.match > 0)
      .sort((a, b) => b.score - a.score)

    const start = (page - 1) * limit
    const paged = ranked.slice(start, start + limit)
    const wines = paged.map(({ wine, match, score }) =>
      publicWine(wine, this.reasonFor(match), score)
    )
    const hasMore = page * limit < ranked.length

    return {
      strategy: 'keyword',
      data: wines,
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

module.exports = KeywordSearchStrategy
