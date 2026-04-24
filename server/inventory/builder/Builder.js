/**
 * Builder interface for CellarEntry construction.
 * All concrete builders must implement these methods.
 */
class Builder {
  reset() {
    throw new Error('reset() not implemented')
  }
  setUser(_userId) {
    throw new Error('setUser() not implemented')
  }
  setWineInfo(_wineId, _name, _winery, _type, _region) {
    throw new Error('setWineInfo() not implemented')
  }
  setVintage(_vintage) {
    throw new Error('setVintage() not implemented')
  }
  setQuantity(_quantity) {
    throw new Error('setQuantity() not implemented')
  }
  setPurchaseDate(_date) {
    throw new Error('setPurchaseDate() not implemented')
  }
  setStorageLocation(_location) {
    throw new Error('setStorageLocation() not implemented')
  }
  setStatus(_status) {
    throw new Error('setStatus() not implemented')
  }
  setNotes(_notes) {
    throw new Error('setNotes() not implemented')
  }
  setNoteImages(_images) {
    throw new Error('setNoteImages() not implemented')
  }
  getResult() {
    throw new Error('getResult() not implemented')
  }
}

module.exports = Builder
