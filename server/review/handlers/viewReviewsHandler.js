const AbstractReviewHandler = require('./abstractReviewHandler')
const dbConnector = require('../connectors/databaseConnector')

const ALLOWED_SORTS = ['newest', 'oldest', 'highest', 'lowest']

class ViewReviewsHandler extends AbstractReviewHandler {
  async parseInput(req) {
    const wineId = req.params && req.params.wineId
    if (!wineId) {
      const err = new Error('wineId is required')
      err.status = 400
      throw err
    }

    const sortOrder = ALLOWED_SORTS.includes(req.query.sort) ? req.query.sort : 'newest'

    const limit = Math.min(Number(req.query.limit) || 50, 100)
    const skip = Math.max(Number(req.query.skip) || 0, 0)

    return { wineId, sortOrder, pagination: { limit, skip } }
  }

  async executeDbOperation(data) {
    const [reviews, aggregates] = await Promise.all([
      dbConnector.findReviewsByWine(data.wineId, data.sortOrder, data.pagination),
      dbConnector.computeWineAggregates(data.wineId),
    ])
    return { reviews, aggregates }
  }

  assembleResponse(dbResult, wineMeta, parsed) {
    return {
      data: {
        wine: wineMeta,
        aggregates: dbResult.aggregates,
        reviews: dbResult.reviews,
        sortOrder: parsed.sortOrder,
        pagination: parsed.pagination,
      },
    }
  }
}

module.exports = ViewReviewsHandler
