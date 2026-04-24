const Builder = require('./Builder')
const CellarEntryModel = require('../cellarEntry.model')

class CellarEntryBuilder extends Builder {
  constructor() {
    super()
    this.reset()
  }

  reset() {
    this.entry = {
      userId: null,
      wineId: null,
      wineName: null,
      winery: null,
      type: null,
      region: null,
      vintage: null,
      quantity: 1,
      purchaseDate: null,
      storageLocation: null,
      status: 'storing',
      notes: null,
      noteImages: [],
    }
    return this
  }

  async loadExistingEntry(entryId) {
    const existing = await CellarEntryModel.findById(entryId)
    if (!existing) throw new Error('Cellar entry not found.')
    this.entry = existing.toObject()
    return this
  }

  setUser(userId) {
    this.entry.userId = userId
    return this
  }

  setWineInfo(wineId, name, winery, type, region) {
    if (wineId !== undefined) this.entry.wineId = wineId
    if (name !== undefined) this.entry.wineName = name
    if (winery !== undefined) this.entry.winery = winery
    if (type !== undefined) this.entry.type = type
    if (region !== undefined) this.entry.region = region
    return this
  }

  setVintage(vintage) {
    this.entry.vintage = vintage
    return this
  }

  setQuantity(quantity) {
    this.entry.quantity = quantity
    return this
  }

  setPurchaseDate(date) {
    this.entry.purchaseDate = date
    return this
  }

  setStorageLocation(location) {
    this.entry.storageLocation = location
    return this
  }

  setStatus(status) {
    this.entry.status = status
    return this
  }

  setNotes(notes) {
    this.entry.notes = notes
    return this
  }

  setNoteImages(images) {
    this.entry.noteImages = Array.isArray(images) ? images : []
    return this
  }

  getResult() {
    if (!this.entry.userId) throw new Error('userId is required.')
    if (!this.entry.wineId) throw new Error('wineId is required.')
    if (!this.entry.quantity && this.entry.quantity !== 0) throw new Error('quantity is required.')
    return { ...this.entry }
  }
}

module.exports = CellarEntryBuilder
