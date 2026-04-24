const CreateReviewHandler = require('./handlers/createReviewHandler')
const ViewReviewsHandler = require('./handlers/viewReviewsHandler')
const EditReviewHandler = require('./handlers/editReviewHandler')
const DeleteReviewHandler = require('./handlers/deleteReviewHandler')
const dbConnector = require('./connectors/databaseConnector')
const { ALLOWED_NOTES } = require('./review.model')

function toHttp(handler) {
  return async (req, res, next) => {
    try {
      const result = await handler.handleRequest(req)
      return res.status(200).json(result)
    } catch (err) {
      next(err)
    }
  }
}

const createReview = toHttp(new CreateReviewHandler())
const viewReviewsForWine = toHttp(new ViewReviewsHandler())
const editReview = toHttp(new EditReviewHandler())
const deleteReview = toHttp(new DeleteReviewHandler())

async function searchWines(req, res, next) {
  try {
    const q = req.query.q || ''
    const limit = Math.min(Number(req.query.limit) || 20, 50)
    const wines = await dbConnector.findWinesByName(q, limit)
    return res.status(200).json({ data: wines })
  } catch (err) {
    next(err)
  }
}

async function listReviewedWines(req, res, next) {
  try {
    const q = req.query.q || ''
    const limit = Math.min(Number(req.query.limit) || 30, 100)
    const wines = await dbConnector.findWinesWithReviews(q, limit)
    return res.status(200).json({ data: wines })
  } catch (err) {
    next(err)
  }
}

function getAllowedNotes(_req, res) {
  return res.status(200).json({ data: ALLOWED_NOTES })
}

module.exports = {
  createReview,
  viewReviewsForWine,
  editReview,
  deleteReview,
  searchWines,
  listReviewedWines,
  getAllowedNotes,
}
