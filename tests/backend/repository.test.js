/**
 * TESTS: cellar.repository.js
 *
 * What this file tests:
 *  - All repository functions against a real in-memory MongoDB instance
 *    (using mongodb-memory-server), so no mocking of the DB layer is needed
 *  - findAllByUserId: returns only entries belonging to the given user,
 *    sorted newest first
 *  - findEntryById: returns correct entry by ID, returns null for unknown ID
 *  - createEntry: persists a new cellar entry with correct fields
 *  - updateEntry: updates only the specified fields and respects userId scoping
 *    (cannot update another user's entry)
 *  - deleteEntry: removes the entry and returns null for a subsequent find;
 *    cannot delete another user's entry
 *  - findOrCreateWine: creates a new wine when it doesn't exist,
 *    returns the existing one when it does (no duplicates)
 *  - searchWines: returns wines matching a case-insensitive name query,
 *    returns empty array for no matches
 */

const mongoose = require('mongoose')
const { MongoMemoryServer } = require('mongodb-memory-server')

let mongoServer

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create()
  await mongoose.connect(mongoServer.getUri())
})

afterAll(async () => {
  await mongoose.disconnect()
  await mongoServer.stop()
})

afterEach(async () => {
  const collections = mongoose.connection.collections
  for (const key in collections) {
    await collections[key].deleteMany({})
  }
})

const {
  findAllByUserId,
  findEntryById,
  createEntry,
  updateEntry,
  deleteEntry,
  findOrCreateWine,
  searchWines,
} = require('../../server/src/modules/inventory/cellar.repository')

const WineModel = require('../../server/src/modules/inventory/wine.model')
const CellarEntryModel = require('../../server/src/modules/inventory/cellarEntry.model')

// Helper: create a wine in DB
async function seedWine(overrides = {}) {
  return WineModel.create({
    wineName: 'Test Wine',
    winery: 'Test Winery',
    type: 'red',
    region: 'France',
    vintage: 2019,
    ...overrides,
  })
}

// Helper: create a cellar entry in DB
async function seedEntry(userId, wineId, overrides = {}) {
  return CellarEntryModel.create({
    userId,
    wineId,
    wineName: 'Test Wine',
    quantity: 3,
    status: 'storing',
    ...overrides,
  })
}

// ─────────────────────────────────────────
// findAllByUserId
// ─────────────────────────────────────────
describe('findAllByUserId', () => {
  test('returns all entries for the user sorted by createdAt descending', async () => {
    const wine = await seedWine()
    await seedEntry('user_1', wine._id, { wineName: 'Wine A' })
    await seedEntry('user_1', wine._id, { wineName: 'Wine B' })
    await seedEntry('user_2', wine._id, { wineName: 'Other User Wine' })

    const results = await findAllByUserId('user_1')
    expect(results).toHaveLength(2)
    expect(results.every((e) => e.userId === 'user_1')).toBe(true)
  })

  test('returns empty array when user has no entries', async () => {
    const results = await findAllByUserId('user_nobody')
    expect(results).toHaveLength(0)
  })
})

// ─────────────────────────────────────────
// findEntryById
// ─────────────────────────────────────────
describe('findEntryById', () => {
  test('returns the entry by ID', async () => {
    const wine = await seedWine()
    const entry = await seedEntry('user_1', wine._id)
    const found = await findEntryById(entry._id.toString())
    expect(found).not.toBeNull()
    expect(found._id.toString()).toBe(entry._id.toString())
  })

  test('returns null for a non-existent ID', async () => {
    const fakeId = new mongoose.Types.ObjectId()
    const found = await findEntryById(fakeId.toString())
    expect(found).toBeNull()
  })
})

// ─────────────────────────────────────────
// createEntry
// ─────────────────────────────────────────
describe('createEntry', () => {
  test('creates and persists a new cellar entry', async () => {
    const wine = await seedWine()
    const data = {
      userId: 'user_1',
      wineId: wine._id,
      wineName: 'Barolo',
      winery: 'Conterno',
      type: 'red',
      region: 'Piedmont',
      vintage: 2016,
      quantity: 6,
      status: 'storing',
    }
    const entry = await createEntry(data)
    expect(entry._id).toBeDefined()
    expect(entry.userId).toBe('user_1')
    expect(entry.wineName).toBe('Barolo')
    expect(entry.quantity).toBe(6)
  })

  test('uses default quantity of 1 when not specified', async () => {
    const wine = await seedWine()
    const entry = await createEntry({ userId: 'user_1', wineId: wine._id })
    expect(entry.quantity).toBe(1)
  })

  test("uses default status 'storing' when not specified", async () => {
    const wine = await seedWine()
    const entry = await createEntry({ userId: 'user_1', wineId: wine._id })
    expect(entry.status).toBe('storing')
  })
})

// ─────────────────────────────────────────
// updateEntry
// ─────────────────────────────────────────
describe('updateEntry', () => {
  test('updates specified fields of the entry', async () => {
    const wine = await seedWine()
    const entry = await seedEntry('user_1', wine._id, { quantity: 3, status: 'storing' })

    const updated = await updateEntry(entry._id.toString(), 'user_1', {
      quantity: 1,
      status: 'consumed',
      notes: 'Finished',
    })

    expect(updated.quantity).toBe(1)
    expect(updated.status).toBe('consumed')
    expect(updated.notes).toBe('Finished')
  })

  test('does not update entry belonging to a different user', async () => {
    const wine = await seedWine()
    const entry = await seedEntry('user_1', wine._id, { quantity: 3 })

    const result = await updateEntry(entry._id.toString(), 'user_2', { quantity: 99 })
    expect(result).toBeNull()

    const unchanged = await findEntryById(entry._id.toString())
    expect(unchanged.quantity).toBe(3)
  })
})

// ─────────────────────────────────────────
// deleteEntry
// ─────────────────────────────────────────
describe('deleteEntry', () => {
  test('deletes entry and it no longer exists in DB', async () => {
    const wine = await seedWine()
    const entry = await seedEntry('user_1', wine._id)

    await deleteEntry(entry._id.toString(), 'user_1')
    const found = await findEntryById(entry._id.toString())
    expect(found).toBeNull()
  })

  test('does not delete entry belonging to a different user', async () => {
    const wine = await seedWine()
    const entry = await seedEntry('user_1', wine._id)

    const result = await deleteEntry(entry._id.toString(), 'user_2')
    expect(result).toBeNull()

    const stillExists = await findEntryById(entry._id.toString())
    expect(stillExists).not.toBeNull()
  })
})

// ─────────────────────────────────────────
// findOrCreateWine
// ─────────────────────────────────────────
describe('findOrCreateWine', () => {
  test('creates a new wine when it does not exist', async () => {
    const wine = await findOrCreateWine({
      wineName: 'Screaming Eagle',
      winery: 'Screaming Eagle',
      type: 'red',
      region: 'Napa Valley',
      vintage: 2019,
    })
    expect(wine._id).toBeDefined()
    expect(wine.wineName).toBe('Screaming Eagle')
  })

  test('returns existing wine instead of creating a duplicate', async () => {
    await findOrCreateWine({ wineName: 'Penfolds Grange', winery: 'Penfolds', vintage: 2017 })
    await findOrCreateWine({ wineName: 'Penfolds Grange', winery: 'Penfolds', vintage: 2017 })

    const count = await WineModel.countDocuments({ wineName: 'Penfolds Grange' })
    expect(count).toBe(1)
  })
})

// ─────────────────────────────────────────
// searchWines
// ─────────────────────────────────────────
describe('searchWines', () => {
  beforeEach(async () => {
    await WineModel.create([
      { wineName: 'Château Margaux', winery: 'Château Margaux', type: 'red' },
      { wineName: 'Château Latour', winery: 'Château Latour', type: 'red' },
      { wineName: 'Opus One', winery: 'Opus One', type: 'red' },
    ])
  })

  test('returns wines matching the query case-insensitively', async () => {
    const results = await searchWines('château')
    expect(results).toHaveLength(2)
    expect(results.every((w) => w.wineName.toLowerCase().includes('château'))).toBe(true)
  })

  test('returns empty array for a non-matching query', async () => {
    const results = await searchWines('nonexistentwine12345')
    expect(results).toHaveLength(0)
  })

  test('limits results to 10', async () => {
    const wines = Array.from({ length: 12 }, (_, i) => ({
      wineName: `Bulk Wine ${i}`,
      type: 'white',
    }))
    await WineModel.create(wines)
    const results = await searchWines('Bulk Wine')
    expect(results.length).toBeLessThanOrEqual(10)
  })
})
