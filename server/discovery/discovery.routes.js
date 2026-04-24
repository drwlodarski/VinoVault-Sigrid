const express = require('express')
const { authMiddleware } = require('../../common/middleware/auth.middleware')
const { discoverWines, getRegions } = require('./discovery.controller')

const router = express.Router()

router.get('/', authMiddleware, discoverWines)
router.get('/regions', authMiddleware, getRegions)

module.exports = router
