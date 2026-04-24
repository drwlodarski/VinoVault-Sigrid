const AbstractReviewHandler = require('./abstractReviewHandler')
const dbConnector = require('../connectors/databaseConnector')
const { ALLOWED_NOTES } = require('../review.model')

class CreateReviewHandler extends AbstractReviewHandler {
  async parseInput(req) {
    const userId = req.auth && req.auth.userId
    if (!userId) {
      const err = new Error('Unauthorized')
      err.status = 401
      throw err
    }

    const { wineName, rating, notes, reviewText, photoUrl, userName } = req.body || {}

    if (!wineName || !String(wineName).trim()) {
      const err = new Error('wineName is required')
      err.status = 400
      throw err
    }

    const parsedRating = rating == null ? 0 : Number(rating)
    if (Number.isNaN(parsedRating) || parsedRating < 0 || parsedRating > 5) {
      const err = new Error('rating must be a number between 0 and 5')
      err.status = 400
      throw err
    }

    const parsedNotes = Array.isArray(notes) ? notes : []
    const invalidNote = parsedNotes.find((n) => !ALLOWED_NOTES.includes(n))
    if (invalidNote) {
      const err = new Error(`Invalid tasting note: ${invalidNote}`)
      err.status = 400
      throw err
    }
    if (parsedNotes.length > 3) {
      const err = new Error('You may select at most 3 tasting notes')
      err.status = 400
      throw err
    }

    const wine = await dbConnector.findOrCreateWineByName(wineName)

    return {
      userId,
      userName: (userName || '').trim() || 'Anonymous',
      wineId: wine.wineId,
      wineName: wine.name,
      rating: parsedRating,
      notes: parsedNotes,
      reviewText: (reviewText || '').trim(),
      photoUrl: (photoUrl || '').trim(),
    }
  }

  async executeDbOperation(data) {
    return dbConnector.insertReview(data)
  }

  assembleResponse(review, wineMeta) {
    return {
      message: 'Review created',
      data: {
        review,
        wine: wineMeta,
      },
    }
  }
}

module.exports = CreateReviewHandler
