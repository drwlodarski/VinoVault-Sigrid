const WineModel = require('../wine.model')

const USE_EXTERNAL_API = false
const GOPUFF_API_BASE = process.env.GOPUFF_API_BASE || ''

async function fetchFromExternalApi(wineId) {
  const res = await fetch(`${GOPUFF_API_BASE}/wines/${wineId}`)
  if (!res.ok) return null
  const raw = await res.json()
  return {
    wineId: raw.wineId,
    name: raw.name,
    region: raw.region,
    vintage: raw.vintage,
    varietal: raw.varietal,
    regularPrice: raw.regularPrice,
    salePrice: raw.salePrice,
    stock: raw.stock,
    wineUrl: raw.wineUrl,
  }
}

async function fetchFromDatabase(wineId) {
  return WineModel.findOne({ wineId }).lean()
}

async function getWineDetails(wineId) {
  if (!wineId) return null
  if (USE_EXTERNAL_API && GOPUFF_API_BASE) {
    try {
      const external = await fetchFromExternalApi(wineId)
      if (external) return external
    } catch (err) {
      console.warn('[wineMetadataConnector] external fetch failed', err.message)
    }
  }
  return fetchFromDatabase(wineId)
}

module.exports = { getWineDetails }
