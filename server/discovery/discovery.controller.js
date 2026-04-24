const DiscoveryService = require('./discovery.service')
const repository = require('./discovery.repository')

const service = new DiscoveryService()

// Main discovery endpoint: merge query params with the authenticated user
// and delegate all recommendation decisions to the service layer.
async function discoverWines(req, res, next) {
  try {
    const userId = req.auth.userId
    if (!userId) return res.status(401).json({ message: 'Unauthorized' })

    const result = await service.recommend({
      ...req.query,
      userId,
    })

    return res.status(200).json(result)
  } catch (error) {
    next(error)
  }
}

// Exposes the catalog's available regions so the frontend can populate filters.
async function getRegions(_req, res, next) {
  try {
    const regions = await repository.listRegions()
    return res.status(200).json({ data: regions })
  } catch (error) {
    next(error)
  }
}

module.exports = {
  discoverWines,
  getRegions,
}
