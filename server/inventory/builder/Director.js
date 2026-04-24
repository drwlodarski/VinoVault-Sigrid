class Director {
  /**
   * Build a CellarEntry from an existing wine in the catalog.
   * All wine info comes from the catalog record.
   */
  makeFromInventory(builder, userId, wineId, wineName, winery, type, region, fields = {}) {
    builder.reset()
    builder.setUser(userId)
    builder.setWineInfo(wineId, wineName, winery, type, region)
    if (fields.vintage !== undefined) builder.setVintage(fields.vintage)
    if (fields.quantity !== undefined) builder.setQuantity(fields.quantity)
    if (fields.purchaseDate !== undefined) builder.setPurchaseDate(fields.purchaseDate)
    if (fields.storageLocation !== undefined) builder.setStorageLocation(fields.storageLocation)
    if (fields.status !== undefined) builder.setStatus(fields.status)
    if (fields.notes !== undefined) builder.setNotes(fields.notes)
    if (fields.noteImages !== undefined) builder.setNoteImages(fields.noteImages)
    return builder.getResult()
  }

  /**
   * Build a CellarEntry from manually entered wine info (wine not in catalog yet).
   */
  makeManualEntry(builder, userId, wineId, wineName, fields = {}) {
    builder.reset()
    builder.setUser(userId)
    builder.setWineInfo(wineId, wineName, fields.winery, fields.type, fields.region)
    if (fields.vintage !== undefined) builder.setVintage(fields.vintage)
    if (fields.quantity !== undefined) builder.setQuantity(fields.quantity)
    if (fields.purchaseDate !== undefined) builder.setPurchaseDate(fields.purchaseDate)
    if (fields.storageLocation !== undefined) builder.setStorageLocation(fields.storageLocation)
    if (fields.status !== undefined) builder.setStatus(fields.status)
    if (fields.notes !== undefined) builder.setNotes(fields.notes)
    if (fields.noteImages !== undefined) builder.setNoteImages(fields.noteImages)
    return builder.getResult()
  }

  /**
   * Edit an existing CellarEntry — loads existing state then applies only changed fields.
   */
  async editExistingEntry(builder, entryId, changedFields) {
    await builder.loadExistingEntry(entryId)
    if (changedFields.wineId !== undefined || changedFields.wineName !== undefined) {
      builder.setWineInfo(
        changedFields.wineId, // may be undefined — setWineInfo only overwrites wineId if defined
        changedFields.wineName,
        changedFields.winery,
        changedFields.type,
        changedFields.region
      )
    }
    if (changedFields.vintage !== undefined) builder.setVintage(changedFields.vintage)
    if (changedFields.quantity !== undefined) builder.setQuantity(changedFields.quantity)
    if (changedFields.purchaseDate !== undefined)
      builder.setPurchaseDate(changedFields.purchaseDate)
    if (changedFields.storageLocation !== undefined)
      builder.setStorageLocation(changedFields.storageLocation)
    if (changedFields.status !== undefined) builder.setStatus(changedFields.status)
    if (changedFields.notes !== undefined) builder.setNotes(changedFields.notes)
    if (changedFields.noteImages !== undefined) builder.setNoteImages(changedFields.noteImages)
    return builder.getResult()
  }
}

module.exports = Director
