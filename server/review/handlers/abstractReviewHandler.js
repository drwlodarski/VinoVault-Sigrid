const wineMetadataConnector = require('../connectors/wineMetadataConnector')

class AbstractReviewHandler {
  async handleRequest(req) {
    const parsed = await this.parseInput(req)
    const dbResult = await this.executeDbOperation(parsed)
    const wineId = this.resolveWineId(parsed, dbResult)
    const wineMeta = await this.fetchWineMetadata(wineId)
    return this.assembleResponse(dbResult, wineMeta, parsed)
  }

  async parseInput(_req) {
    throw new Error('parseInput must be overridden')
  }

  async executeDbOperation(_data) {
    throw new Error('executeDbOperation must be overridden')
  }

  assembleResponse(_dbResult, _wineMeta, _parsed) {
    throw new Error('assembleResponse must be overridden')
  }

  async fetchWineMetadata(wineId) {
    if (!wineId) return null
    return wineMetadataConnector.getWineDetails(wineId)
  }

  resolveWineId(parsed, dbResult) {
    if (parsed && parsed.wineId) return parsed.wineId
    if (dbResult && dbResult.wineId) return dbResult.wineId
    return null
  }
}

module.exports = AbstractReviewHandler
