/**
 * TESTS: Builder Pattern — CellarEntryBuilder & Director
 *
 * What this file tests:
 *  - CellarEntryBuilder: each setter step correctly sets the field on the internal entry
 *  - CellarEntryBuilder.reset(): clears all fields back to defaults
 *  - CellarEntryBuilder.getResult(): validates required fields (userId, wineId, quantity)
 *    and throws descriptive errors when they are missing
 *  - Director.makeFromInventory(): builds a complete entry from catalog wine data,
 *    only applying fields that were passed
 *  - Director.makeManualEntry(): builds an entry from user-typed wine data,
 *    correctly creating required and optional fields
 *  - Director.editExistingEntry(): loads an existing entry and only overwrites
 *    the changed fields, leaving others intact
 *  - Builder interface: throws "not implemented" for every method when used directly
 */

const CellarEntryBuilder = require('../../server/src/modules/inventory/builder/CellarEntryBuilder')
const Director = require('../../server/src/modules/inventory/builder/Director')
const Builder = require('../../server/src/modules/inventory/builder/Builder')

// Mock CellarEntryModel.findById used by loadExistingEntry
jest.mock('../../server/src/modules/inventory/cellarEntry.model', () => ({
  findById: jest.fn(),
}))
const CellarEntryModel = require('../../server/src/modules/inventory/cellarEntry.model')

// ─────────────────────────────────────────
// Builder interface
// ─────────────────────────────────────────
describe('Builder (interface)', () => {
  const b = new Builder()
  const methods = [
    ['reset', []],
    ['setUser', ['uid']],
    ['setWineInfo', ['wid', 'name', 'winery', 'type', 'region']],
    ['setVintage', [2018]],
    ['setQuantity', [3]],
    ['setPurchaseDate', ['2024-01-01']],
    ['setStorageLocation', ['Rack A']],
    ['setStatus', ['storing']],
    ['setNotes', ['Nice wine']],
    ['getResult', []],
  ]

  test.each(methods)('%s() throws not implemented', (method, args) => {
    expect(() => b[method](...args)).toThrow('not implemented')
  })
})

// ─────────────────────────────────────────
// CellarEntryBuilder — setters
// ─────────────────────────────────────────
describe('CellarEntryBuilder — setters', () => {
  let builder
  beforeEach(() => {
    builder = new CellarEntryBuilder()
  })

  test('setUser sets userId', () => {
    builder.setUser('user_123')
    expect(builder.entry.userId).toBe('user_123')
  })

  test('setWineInfo sets wineId, name, winery, type, region', () => {
    builder.setWineInfo('wine_abc', 'Margaux', 'Château Margaux', 'red', 'Bordeaux')
    expect(builder.entry.wineId).toBe('wine_abc')
    expect(builder.entry.wineName).toBe('Margaux')
    expect(builder.entry.winery).toBe('Château Margaux')
    expect(builder.entry.type).toBe('red')
    expect(builder.entry.region).toBe('Bordeaux')
  })

  test('setWineInfo skips undefined optional fields', () => {
    builder.setWineInfo('wine_abc', 'Margaux', undefined, undefined, undefined)
    expect(builder.entry.winery).toBeNull()
    expect(builder.entry.type).toBeNull()
    expect(builder.entry.region).toBeNull()
  })

  test('setVintage sets vintage', () => {
    builder.setVintage(2019)
    expect(builder.entry.vintage).toBe(2019)
  })

  test('setQuantity sets quantity', () => {
    builder.setQuantity(6)
    expect(builder.entry.quantity).toBe(6)
  })

  test('setPurchaseDate sets purchaseDate', () => {
    builder.setPurchaseDate('2023-06-15')
    expect(builder.entry.purchaseDate).toBe('2023-06-15')
  })

  test('setStorageLocation sets storageLocation', () => {
    builder.setStorageLocation('Cellar Rack B')
    expect(builder.entry.storageLocation).toBe('Cellar Rack B')
  })

  test('setStatus sets status', () => {
    builder.setStatus('ready')
    expect(builder.entry.status).toBe('ready')
  })

  test('setNotes sets notes', () => {
    builder.setNotes('Earthy and complex')
    expect(builder.entry.notes).toBe('Earthy and complex')
  })

  test('setters are chainable', () => {
    const result = builder
      .setUser('u1')
      .setWineInfo('w1', 'Test Wine', 'Winery', 'red', 'France')
      .setQuantity(2)
    expect(result).toBe(builder)
  })
})

// ─────────────────────────────────────────
// CellarEntryBuilder — reset
// ─────────────────────────────────────────
describe('CellarEntryBuilder — reset', () => {
  test('reset clears all fields to defaults', () => {
    const builder = new CellarEntryBuilder()
    builder.setUser('u1').setWineInfo('w1', 'Wine', 'Winery', 'red', 'France').setQuantity(5)
    builder.reset()
    expect(builder.entry.userId).toBeNull()
    expect(builder.entry.wineId).toBeNull()
    expect(builder.entry.quantity).toBe(1)
    expect(builder.entry.status).toBe('storing')
    expect(builder.entry.notes).toBeNull()
  })
})

// ─────────────────────────────────────────
// CellarEntryBuilder — getResult validation
// ─────────────────────────────────────────
describe('CellarEntryBuilder — getResult', () => {
  test('throws if userId is missing', () => {
    const builder = new CellarEntryBuilder()
    builder.setWineInfo('w1', 'Wine', null, null, null).setQuantity(1)
    expect(() => builder.getResult()).toThrow('userId is required')
  })

  test('throws if wineId is missing', () => {
    const builder = new CellarEntryBuilder()
    builder.setUser('u1').setQuantity(1)
    expect(() => builder.getResult()).toThrow('wineId is required')
  })

  test('returns a plain object with all fields when valid', () => {
    const builder = new CellarEntryBuilder()
    builder
      .setUser('u1')
      .setWineInfo('w1', 'Margaux', 'Ch. Margaux', 'red', 'Bordeaux')
      .setVintage(2018)
      .setQuantity(3)
      .setStatus('storing')
    const result = builder.getResult()
    expect(result.userId).toBe('u1')
    expect(result.wineId).toBe('w1')
    expect(result.wineName).toBe('Margaux')
    expect(result.quantity).toBe(3)
    expect(result.vintage).toBe(2018)
    expect(result.status).toBe('storing')
  })
})

// ─────────────────────────────────────────
// Director — makeFromInventory
// ─────────────────────────────────────────
describe('Director.makeFromInventory', () => {
  test('builds full entry from catalog wine with all optional fields', () => {
    const builder = new CellarEntryBuilder()
    const director = new Director()
    const result = director.makeFromInventory(
      builder,
      'user_1',
      'wine_1',
      'Barolo',
      'Conterno',
      'red',
      'Piedmont',
      {
        vintage: 2016,
        quantity: 12,
        purchaseDate: '2022-03-01',
        storageLocation: 'Rack C',
        status: 'storing',
        notes: 'Gift',
      }
    )
    expect(result.userId).toBe('user_1')
    expect(result.wineId).toBe('wine_1')
    expect(result.wineName).toBe('Barolo')
    expect(result.vintage).toBe(2016)
    expect(result.quantity).toBe(12)
    expect(result.purchaseDate).toBe('2022-03-01')
    expect(result.storageLocation).toBe('Rack C')
    expect(result.notes).toBe('Gift')
  })

  test('builds entry with only required fields when no optional fields passed', () => {
    const builder = new CellarEntryBuilder()
    const director = new Director()
    const result = director.makeFromInventory(
      builder,
      'user_1',
      'wine_1',
      'Barolo',
      'Conterno',
      'red',
      'Piedmont',
      {}
    )
    expect(result.userId).toBe('user_1')
    expect(result.wineId).toBe('wine_1')
    expect(result.vintage).toBeNull()
    expect(result.storageLocation).toBeNull()
  })
})

// ─────────────────────────────────────────
// Director — makeManualEntry
// ─────────────────────────────────────────
describe('Director.makeManualEntry', () => {
  test('builds entry from manually typed wine info', () => {
    const builder = new CellarEntryBuilder()
    const director = new Director()
    const result = director.makeManualEntry(builder, 'user_2', 'wine_manual', 'My House Wine', {
      winery: 'Local Winery',
      type: 'white',
      region: 'Napa',
      vintage: 2021,
      quantity: 2,
    })
    expect(result.userId).toBe('user_2')
    expect(result.wineName).toBe('My House Wine')
    expect(result.winery).toBe('Local Winery')
    expect(result.type).toBe('white')
    expect(result.quantity).toBe(2)
  })

  test('builds entry with only wine name and default quantity', () => {
    const builder = new CellarEntryBuilder()
    const director = new Director()
    const result = director.makeManualEntry(builder, 'user_2', 'wine_manual', 'Unknown Wine', {
      quantity: 1,
    })
    expect(result.wineName).toBe('Unknown Wine')
    expect(result.quantity).toBe(1)
    expect(result.status).toBe('storing')
  })
})

// ─────────────────────────────────────────
// Director — editExistingEntry
// ─────────────────────────────────────────
describe('Director.editExistingEntry', () => {
  test('loads existing entry and applies only changed fields', async () => {
    const mockEntry = {
      _id: 'entry_1',
      userId: 'user_1',
      wineId: 'wine_1',
      wineName: 'Margaux',
      winery: 'Ch. Margaux',
      type: 'red',
      region: 'Bordeaux',
      vintage: 2018,
      quantity: 6,
      purchaseDate: '2020-01-01',
      storageLocation: 'Rack A',
      status: 'storing',
      notes: 'Original note',
      toObject: function () {
        return { ...this }
      },
    }
    CellarEntryModel.findById.mockResolvedValue(mockEntry)

    const builder = new CellarEntryBuilder()
    const director = new Director()
    const result = await director.editExistingEntry(builder, 'entry_1', {
      quantity: 4,
      status: 'ready',
      notes: 'Updated note',
    })

    expect(result.quantity).toBe(4)
    expect(result.status).toBe('ready')
    expect(result.notes).toBe('Updated note')
    // Unchanged fields preserved
    expect(result.wineName).toBe('Margaux')
    expect(result.winery).toBe('Ch. Margaux')
    expect(result.vintage).toBe(2018)
  })

  test('throws if entry not found', async () => {
    CellarEntryModel.findById.mockResolvedValue(null)
    const builder = new CellarEntryBuilder()
    const director = new Director()
    await expect(director.editExistingEntry(builder, 'nonexistent', {})).rejects.toThrow(
      'Cellar entry not found'
    )
  })
})
