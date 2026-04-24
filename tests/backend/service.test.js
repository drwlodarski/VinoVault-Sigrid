/**
 * TESTS: cellar.service.js
 *
 * What this file tests:
 *  - getCellar: delegates to repository and returns the user's entries
 *  - addManualEntry: validates required fields (wineName, quantity),
 *    calls findOrCreateWine to upsert the wine catalog, then uses
 *    Director.makeManualEntry + createEntry to persist the cellar entry
 *  - editEntry: validates ownership (throws if entry belongs to another user),
 *    throws if entry not found, delegates update to Director.editExistingEntry
 *    and repository.updateEntry
 *  - removeEntry: validates ownership before deleting,
 *    throws if entry not found or not owned by the requesting user
 *  - searchWinesCatalog: returns empty array for blank/short query,
 *    delegates to repository.searchWines for valid queries
 *
 * All repository and builder calls are mocked so the service logic is
 * tested in isolation from the database.
 */

jest.mock('../../server/src/modules/inventory/cellar.repository', () => ({
  findAllByUserId: jest.fn(),
  findEntryById: jest.fn(),
  createEntry: jest.fn(),
  updateEntry: jest.fn(),
  deleteEntry: jest.fn(),
  findOrCreateWine: jest.fn(),
  searchWines: jest.fn(),
}))
jest.mock('../../server/src/modules/inventory/builder/CellarEntryBuilder')
jest.mock('../../server/src/modules/inventory/builder/Director')
jest.mock('../../server/src/modules/inventory/cellarEntry.model', () => ({
  findById: jest.fn(),
}))

const repository = require('../../server/src/modules/inventory/cellar.repository')
const CellarEntryBuilder = require('../../server/src/modules/inventory/builder/CellarEntryBuilder')
const Director = require('../../server/src/modules/inventory/builder/Director')

const CellarEntryModel = require('../../server/src/modules/inventory/cellarEntry.model')

const {
  getCellar,
  addManualEntry,
  editEntry,
  removeEntry,
  searchWinesCatalog,
} = require('../../server/src/modules/inventory/cellar.service')

const MOCK_ENTRY = {
  _id: 'entry_1',
  userId: 'user_1',
  wineId: 'wine_1',
  wineName: 'Margaux',
  quantity: 3,
  status: 'storing',
  noteImages: [],
}

const MOCK_WINE = { _id: 'wine_1', wineName: 'Margaux' }

beforeEach(() => {
  jest.clearAllMocks()

  // Default mock implementations
  CellarEntryModel.findById.mockResolvedValue({
    ...MOCK_ENTRY,
    toObject: () => ({ ...MOCK_ENTRY }),
  })
  repository.findAllByUserId.mockResolvedValue([MOCK_ENTRY])
  repository.findEntryById.mockResolvedValue(MOCK_ENTRY)
  repository.createEntry.mockResolvedValue(MOCK_ENTRY)
  repository.updateEntry.mockResolvedValue({ ...MOCK_ENTRY, quantity: 1 })
  repository.deleteEntry.mockResolvedValue(MOCK_ENTRY)
  repository.findOrCreateWine.mockResolvedValue(MOCK_WINE)
  repository.searchWines.mockResolvedValue([MOCK_WINE])
  // Builder mock: reset returns this, getResult returns entry data
  const builderInstance = {
    reset: jest.fn().mockReturnThis(),
    setUser: jest.fn().mockReturnThis(),
    setWineInfo: jest.fn().mockReturnThis(),
    setVintage: jest.fn().mockReturnThis(),
    setQuantity: jest.fn().mockReturnThis(),
    setPurchaseDate: jest.fn().mockReturnThis(),
    setStorageLocation: jest.fn().mockReturnThis(),
    setStatus: jest.fn().mockReturnThis(),
    setNotes: jest.fn().mockReturnThis(),
    loadExistingEntry: jest.fn().mockResolvedValue(undefined),
    getResult: jest.fn().mockReturnValue(MOCK_ENTRY),
  }
  CellarEntryBuilder.mockImplementation(() => builderInstance)

  // Director mock — covers both new Director() calls and the module-level singleton
  const directorInstance = {
    makeFromInventory: jest.fn().mockReturnValue(MOCK_ENTRY),
    makeManualEntry: jest.fn().mockReturnValue(MOCK_ENTRY),
    editExistingEntry: jest.fn().mockResolvedValue({ ...MOCK_ENTRY, quantity: 1 }),
  }
  Director.mockImplementation(() => directorInstance)
  // Patch prototype so the module-level singleton also uses the mocked methods
  Director.prototype.makeFromInventory = directorInstance.makeFromInventory
  Director.prototype.makeManualEntry = directorInstance.makeManualEntry
  Director.prototype.editExistingEntry = directorInstance.editExistingEntry
})

// ─────────────────────────────────────────
// getCellar
// ─────────────────────────────────────────
describe('getCellar', () => {
  test('returns all entries for the user', async () => {
    const result = await getCellar('user_1')
    expect(repository.findAllByUserId).toHaveBeenCalledWith('user_1')
    expect(result).toEqual([MOCK_ENTRY])
  })
})

// ─────────────────────────────────────────
// addManualEntry
// ─────────────────────────────────────────
describe('addManualEntry', () => {
  test('throws if wineName is missing', async () => {
    await expect(addManualEntry('user_1', { quantity: 2 })).rejects.toThrow('wineName is required')
  })

  test('throws if quantity is missing', async () => {
    await expect(addManualEntry('user_1', { wineName: 'Margaux' })).rejects.toThrow(
      'quantity is required'
    )
  })

  test('calls findOrCreateWine with wine data', async () => {
    await addManualEntry('user_1', { wineName: 'Margaux', quantity: 2, type: 'red' })
    expect(repository.findOrCreateWine).toHaveBeenCalledWith(
      expect.objectContaining({ wineName: 'Margaux' })
    )
  })

  test('calls createEntry and returns the new entry', async () => {
    const result = await addManualEntry('user_1', { wineName: 'Margaux', quantity: 2 })
    expect(repository.createEntry).toHaveBeenCalled()
    expect(result).toEqual(MOCK_ENTRY)
  })
})

// ─────────────────────────────────────────
// editEntry
// ─────────────────────────────────────────
describe('editEntry', () => {
  test('throws if entry is not found', async () => {
    repository.findEntryById.mockResolvedValue(null)
    await expect(editEntry('user_1', 'entry_1', { quantity: 1 })).rejects.toThrow(
      'Cellar entry not found'
    )
  })

  test('throws if entry belongs to a different user', async () => {
    repository.findEntryById.mockResolvedValue({ ...MOCK_ENTRY, userId: 'user_other' })
    await expect(editEntry('user_1', 'entry_1', { quantity: 1 })).rejects.toThrow('Unauthorized')
  })

  test('calls updateEntry and returns updated entry', async () => {
    const result = await editEntry('user_1', 'entry_1', { quantity: 1 })
    expect(repository.updateEntry).toHaveBeenCalled()
    expect(result).toEqual({ ...MOCK_ENTRY, quantity: 1 })
  })
})

// ─────────────────────────────────────────
// removeEntry
// ─────────────────────────────────────────
describe('removeEntry', () => {
  test('throws if entry is not found', async () => {
    repository.findEntryById.mockResolvedValue(null)
    await expect(removeEntry('user_1', 'entry_1')).rejects.toThrow('Cellar entry not found')
  })

  test('throws if entry belongs to a different user', async () => {
    repository.findEntryById.mockResolvedValue({ ...MOCK_ENTRY, userId: 'user_other' })
    await expect(removeEntry('user_1', 'entry_1')).rejects.toThrow('Unauthorized')
  })

  test('calls deleteEntry for the correct entry', async () => {
    await removeEntry('user_1', 'entry_1')
    expect(repository.deleteEntry).toHaveBeenCalledWith('entry_1', 'user_1')
  })
})

// ─────────────────────────────────────────
// searchWinesCatalog
// ─────────────────────────────────────────
describe('searchWinesCatalog', () => {
  test('returns empty array for an empty query', async () => {
    const result = await searchWinesCatalog('')
    expect(result).toEqual([])
    expect(repository.searchWines).not.toHaveBeenCalled()
  })

  test('returns empty array for a whitespace-only query', async () => {
    const result = await searchWinesCatalog('   ')
    expect(result).toEqual([])
  })

  test('calls repository.searchWines for valid query and returns results', async () => {
    const result = await searchWinesCatalog('Margaux')
    expect(repository.searchWines).toHaveBeenCalledWith('Margaux')
    expect(result).toEqual([MOCK_WINE])
  })

  test('trims whitespace from query before searching', async () => {
    await searchWinesCatalog('  Barolo  ')
    expect(repository.searchWines).toHaveBeenCalledWith('Barolo')
  })
})
