/**
 * TESTS: Inventory API Routes (cellar.controller.js + inventory.routes.js)
 *
 * What this file tests:
 *  - GET  /api/inventory        — returns 200 with user's cellar entries;
 *                                 returns 401 when not authenticated
 *  - POST /api/inventory        — returns 201 when valid body provided;
 *                                 returns 400 when wineName is missing;
 *                                 returns 400 when quantity is missing;
 *                                 returns 401 when not authenticated
 *  - PUT  /api/inventory/:id    — returns 200 with updated entry;
 *                                 returns 401 when not authenticated
 *  - DELETE /api/inventory/:id  — returns 200 with success message;
 *                                 returns 401 when not authenticated
 *  - GET  /api/inventory/wines/search?q= — returns 200 with search results;
 *                                          returns empty array for blank query
 *
 * Auth middleware is mocked so tests control the authenticated user.
 * The service layer is mocked to isolate HTTP/controller logic from business logic.
 */

const request = require('supertest')
const express = require('express')

// ── Mock auth middleware ──────────────────
// We test two scenarios: authenticated and unauthenticated
let mockUserId = 'user_test_1'

jest.mock('../../server/src/common/middleware/auth.middleware', () => ({
  authMiddleware: (req, res, next) => {
    if (!mockUserId) {
      return res.status(401).json({ message: 'Unauthorized' })
    }
    req.auth = { userId: mockUserId }
    next()
  },
}))

// ── Mock service layer ────────────────────
jest.mock('../../server/src/modules/inventory/cellar.service')
const service = require('../../server/src/modules/inventory/cellar.service')

const MOCK_ENTRY = {
  _id: 'entry_1',
  userId: 'user_test_1',
  wineName: 'Margaux',
  quantity: 3,
  status: 'storing',
}

// Build a minimal Express app with just the inventory routes
const inventoryRoutes = require('../../server/src/modules/inventory/inventory.routes')
const app = express()
app.use(express.json())
app.use('/api/inventory', inventoryRoutes)
app.use((err, req, res, next) => {
  res.status(err.status || 500).json({ message: err.message })
})

beforeEach(() => {
  jest.clearAllMocks()
  mockUserId = 'user_test_1'

  service.getCellar.mockResolvedValue([MOCK_ENTRY])
  service.addManualEntry.mockResolvedValue(MOCK_ENTRY)
  service.editEntry.mockResolvedValue({ ...MOCK_ENTRY, quantity: 1 })
  service.removeEntry.mockResolvedValue(MOCK_ENTRY)
  service.searchWinesCatalog.mockResolvedValue([{ _id: 'w1', wineName: 'Margaux' }])
})

// ─────────────────────────────────────────
// GET /api/inventory
// ─────────────────────────────────────────
describe('GET /api/inventory', () => {
  test('returns 200 with list of cellar entries', async () => {
    const res = await request(app).get('/api/inventory/')
    expect(res.status).toBe(200)
    expect(res.body.data).toHaveLength(1)
    expect(res.body.data[0].wineName).toBe('Margaux')
  })

  test('returns 401 when not authenticated', async () => {
    mockUserId = null
    const res = await request(app).get('/api/inventory/')
    expect(res.status).toBe(401)
  })

  test('calls getCellar with the authenticated userId', async () => {
    await request(app).get('/api/inventory/')
    expect(service.getCellar).toHaveBeenCalledWith('user_test_1')
  })
})

// ─────────────────────────────────────────
// POST /api/inventory
// ─────────────────────────────────────────
describe('POST /api/inventory', () => {
  const validBody = { wineName: 'Barolo', quantity: 6, type: 'red' }

  test('returns 201 and the created entry for valid body', async () => {
    const res = await request(app).post('/api/inventory/').send(validBody)
    expect(res.status).toBe(201)
    expect(res.body.data.wineName).toBe('Margaux')
    expect(res.body.message).toBe('Wine added to cellar.')
  })

  test('returns 400 when wineName is missing', async () => {
    const res = await request(app).post('/api/inventory/').send({ quantity: 2 })
    expect(res.status).toBe(400)
    expect(res.body.message).toMatch(/wineName/i)
  })

  test('returns 400 when quantity is missing', async () => {
    const res = await request(app).post('/api/inventory/').send({ wineName: 'Barolo' })
    expect(res.status).toBe(400)
    expect(res.body.message).toMatch(/quantity/i)
  })

  test('returns 401 when not authenticated', async () => {
    mockUserId = null
    const res = await request(app).post('/api/inventory/').send(validBody)
    expect(res.status).toBe(401)
  })

  test('calls addManualEntry with userId and body', async () => {
    await request(app).post('/api/inventory/').send(validBody)
    expect(service.addManualEntry).toHaveBeenCalledWith(
      'user_test_1',
      expect.objectContaining({ wineName: 'Barolo' })
    )
  })
})

// ─────────────────────────────────────────
// PUT /api/inventory/:entryId
// ─────────────────────────────────────────
describe('PUT /api/inventory/:entryId', () => {
  test('returns 200 with updated entry', async () => {
    const res = await request(app)
      .put('/api/inventory/entry_1')
      .send({ quantity: 1, status: 'ready' })
    expect(res.status).toBe(200)
    expect(res.body.message).toBe('Cellar entry updated.')
    expect(res.body.data.quantity).toBe(1)
  })

  test('returns 401 when not authenticated', async () => {
    mockUserId = null
    const res = await request(app).put('/api/inventory/entry_1').send({ quantity: 1 })
    expect(res.status).toBe(401)
  })

  test('calls editEntry with correct userId and entryId', async () => {
    await request(app).put('/api/inventory/entry_1').send({ quantity: 1 })
    expect(service.editEntry).toHaveBeenCalledWith('user_test_1', 'entry_1', expect.any(Object))
  })

  test('returns 500 when service throws (e.g. unauthorized ownership)', async () => {
    service.editEntry.mockRejectedValue(new Error('Unauthorized'))
    const res = await request(app).put('/api/inventory/entry_1').send({ quantity: 1 })
    expect(res.status).toBe(500)
  })
})

// ─────────────────────────────────────────
// DELETE /api/inventory/:entryId
// ─────────────────────────────────────────
describe('DELETE /api/inventory/:entryId', () => {
  test('returns 200 with success message', async () => {
    const res = await request(app).delete('/api/inventory/entry_1')
    expect(res.status).toBe(200)
    expect(res.body.message).toBe('Cellar entry deleted.')
  })

  test('returns 401 when not authenticated', async () => {
    mockUserId = null
    const res = await request(app).delete('/api/inventory/entry_1')
    expect(res.status).toBe(401)
  })

  test('calls removeEntry with correct userId and entryId', async () => {
    await request(app).delete('/api/inventory/entry_1')
    expect(service.removeEntry).toHaveBeenCalledWith('user_test_1', 'entry_1')
  })

  test('returns 500 when service throws (e.g. entry not found)', async () => {
    service.removeEntry.mockRejectedValue(new Error('Cellar entry not found.'))
    const res = await request(app).delete('/api/inventory/entry_1')
    expect(res.status).toBe(500)
  })
})

// ─────────────────────────────────────────
// GET /api/inventory/wines/search
// ─────────────────────────────────────────
describe('GET /api/inventory/wines/search', () => {
  test('returns 200 with matching wines for a valid query', async () => {
    const res = await request(app).get('/api/inventory/wines/search?q=Margaux')
    expect(res.status).toBe(200)
    expect(res.body.data).toHaveLength(1)
    expect(res.body.data[0].wineName).toBe('Margaux')
  })

  test('returns 200 with empty array for blank query', async () => {
    service.searchWinesCatalog.mockResolvedValue([])
    const res = await request(app).get('/api/inventory/wines/search?q=')
    expect(res.status).toBe(200)
    expect(res.body.data).toEqual([])
  })

  test('returns 401 when not authenticated', async () => {
    mockUserId = null
    const res = await request(app).get('/api/inventory/wines/search?q=test')
    expect(res.status).toBe(401)
  })

  test('passes the query string to searchWinesCatalog', async () => {
    await request(app).get('/api/inventory/wines/search?q=Barolo')
    expect(service.searchWinesCatalog).toHaveBeenCalledWith('Barolo')
  })
})
