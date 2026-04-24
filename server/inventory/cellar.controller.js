const {
  getCellar,
  addManualEntry,
  editEntry,
  removeEntry,
  searchWinesCatalog,
} = require('./cellar.service')

async function getCellarHandler(req, res, next) {
  try {
    const userId = req.auth.userId
    if (!userId) return res.status(401).json({ message: 'Unauthorized' })

    const entries = await getCellar(userId)
    return res.status(200).json({ data: entries })
  } catch (error) {
    next(error)
  }
}

async function addEntryHandler(req, res, next) {
  try {
    const userId = req.auth.userId
    if (!userId) return res.status(401).json({ message: 'Unauthorized' })

    const { wineName, quantity } = req.body
    if (!wineName) return res.status(400).json({ message: 'wineName is required.' })
    if (quantity === undefined || quantity === null)
      return res.status(400).json({ message: 'quantity is required.' })

    const entry = await addManualEntry(userId, req.body)
    return res.status(201).json({ message: 'Wine added to cellar.', data: entry })
  } catch (error) {
    next(error)
  }
}

async function updateEntryHandler(req, res, next) {
  try {
    const userId = req.auth.userId
    if (!userId) return res.status(401).json({ message: 'Unauthorized' })

    const { entryId } = req.params
    const entry = await editEntry(userId, entryId, req.body)
    return res.status(200).json({ message: 'Cellar entry updated.', data: entry })
  } catch (error) {
    next(error)
  }
}

async function deleteEntryHandler(req, res, next) {
  try {
    const userId = req.auth.userId
    if (!userId) return res.status(401).json({ message: 'Unauthorized' })

    const { entryId } = req.params
    await removeEntry(userId, entryId)
    return res.status(200).json({ message: 'Cellar entry deleted.' })
  } catch (error) {
    next(error)
  }
}

async function searchWinesHandler(req, res, next) {
  try {
    const userId = req.auth.userId
    if (!userId) return res.status(401).json({ message: 'Unauthorized' })

    const { q } = req.query
    const results = await searchWinesCatalog(q || '')
    return res.status(200).json({ data: results })
  } catch (error) {
    next(error)
  }
}

module.exports = {
  getCellarHandler,
  addEntryHandler,
  updateEntryHandler,
  deleteEntryHandler,
  searchWinesHandler,
}
