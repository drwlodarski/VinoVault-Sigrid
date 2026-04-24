const AbstractReviewHandler = require('./abstractReviewHandler')
const dbConnector = require('../connectors/databaseConnector')
const { ALLOWED_NOTES } = require('../review.model')

const EDITABLE_FIELDS = ['rating', 'notes', 'reviewText', 'photoUrl']

class EditReviewHandler extends AbstractReviewHandler {
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

    const updates = {}
    for (const key of EDITABLE_FIELDS) {
      if (req.body && key in req.body) updates[key] = req.body[key]
    }

    if ('rating' in updates) {
      const r = Number(updates.rating)
      if (Number.isNaN(r) || r < 0 || r > 5) {
        const err = new Error('rating must be a number between 0 and 5')
        err.status = 400
        throw err
      }
      updates.rating = r
    }
    if ('notes' in updates) {
      if (!Array.isArray(updates.notes) || updates.notes.length > 3) {
        const err = new Error('notes must be an array of at most 3 items')
        err.status = 400
        throw err
      }
      const invalid = updates.notes.find((n) => !ALLOWED_NOTES.includes(n))
      if (invalid) {
        const err = new Error(`Invalid tasting note: ${invalid}`)
        err.status = 400
        throw err
      }
    }

    return { userId, reviewId, updates }
  }

  async executeDbOperation(data) {
    return dbConnector.updateReview(data.reviewId, data.userId, data.updates)
  }

  assembleResponse(review, wineMeta) {
    return {
      message: 'Review updated',
      data: { review, wine: wineMeta },
    }
  }
}

module.exports = EditReviewHandler
