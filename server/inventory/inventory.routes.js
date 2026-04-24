const express = require('express')
const { authMiddleware } = require('../../common/middleware/auth.middleware')
const {
  getCellarHandler,
  addEntryHandler,
  updateEntryHandler,
  deleteEntryHandler,
  searchWinesHandler,
} = require('./cellar.controller')

const router = express.Router()

router.get('/wines/search', authMiddleware, searchWinesHandler)
router.get('/', authMiddleware, getCellarHandler)
router.post('/', authMiddleware, addEntryHandler)
router.put('/:entryId', authMiddleware, updateEntryHandler)
router.delete('/:entryId', authMiddleware, deleteEntryHandler)

module.exports = router
