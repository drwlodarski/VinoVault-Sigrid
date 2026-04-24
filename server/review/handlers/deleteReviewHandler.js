const AbstractReviewHandler = require('./abstractReviewHandler')
const dbConnector = require('../connectors/databaseConnector')

class DeleteReviewHandler extends AbstractReviewHandler {
  async parseInput(req) {
    const userId = req.auth && req.auth.userId
    const reviewId = req.params && req.params.reviewId
    if (!userId) {
      const err = new Error('Unauthorized')
      err.status = 401
      throw err
    }
    if (!reviewId) {
      const err = new Error('reviewId is required')
      err.status = 400
      throw err
    }
    return { userId, reviewId }
  }

  async executeDbOperation(data) {
    return dbConnector.deleteReview(data.reviewId, data.userId)
  }

  assembleResponse(dbResult, wineMeta) {
    return {
      message: 'Review deleted',
      data: { reviewId: dbResult.reviewId, wine: wineMeta },
    }
  }
}

module.exports = DeleteReviewHandler
