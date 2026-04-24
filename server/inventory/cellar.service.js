const {
  findAllByUserId,
  findEntryById,
  createEntry,
  updateEntry,
  deleteEntry,
  findOrCreateWine,
  searchWines,
} = require('./cellar.repository')
const CellarEntryBuilder = require('./builder/CellarEntryBuilder')
const Director = require('./builder/Director')

const director = new Director()

async function getCellar(userId) {
  return findAllByUserId(userId)
}

async function addFromCatalog(userId, wineId, fields) {
  const wine = await findEntryById(wineId).catch(() => null)
  const builder = new CellarEntryBuilder()
  const entryData = director.makeFromInventory(
    builder,
    userId,
    wineId,
    fields.wineName,
    fields.winery,
    fields.type,
    fields.region,
    fields
  )
  return createEntry(entryData)
}

async function addManualEntry(userId, fields) {
  if (!fields.wineName) throw new Error('wineName is required.')
  if (!fields.quantity && fields.quantity !== 0) throw new Error('quantity is required.')

  const wine = await findOrCreateWine({
    wineName: fields.wineName,
    winery: fields.winery,
    type: fields.type,
    region: fields.region,
    grapes: fields.grapes,
    vintage: fields.vintage,
  })

  const builder = new CellarEntryBuilder()
  const entryData = director.makeManualEntry(builder, userId, wine._id, fields.wineName, fields)
  return createEntry(entryData)
}

async function editEntry(userId, entryId, changedFields) {
  const existing = await findEntryById(entryId)
  if (!existing) throw new Error('Cellar entry not found.')
  if (existing.userId !== userId) throw new Error('Unauthorized.')

  const builder = new CellarEntryBuilder()
  const updatedData = await director.editExistingEntry(builder, entryId, changedFields)
  return updateEntry(entryId, userId, updatedData)
}

async function removeEntry(userId, entryId) {
  const existing = await findEntryById(entryId)
  if (!existing) throw new Error('Cellar entry not found.')
  if (existing.userId !== userId) throw new Error('Unauthorized.')
  return deleteEntry(entryId, userId)
}

async function searchWinesCatalog(query) {
  if (!query || query.trim().length === 0) return []
  return searchWines(query.trim())
}

module.exports = {
  getCellar,
  addFromCatalog,
  addManualEntry,
  editEntry,
  removeEntry,
  searchWinesCatalog,
}
