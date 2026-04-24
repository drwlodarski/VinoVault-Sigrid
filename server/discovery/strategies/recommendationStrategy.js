class RecommendationStrategy {
  // Concrete strategies must return a normalized discovery payload.
  async recommend(_input) {
    throw new Error('recommend() must be implemented by a concrete strategy')
  }
}

module.exports = RecommendationStrategy
