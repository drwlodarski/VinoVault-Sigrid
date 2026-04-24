const express = require('express')
const { getMe, updateUsername } = require('./user.controller')
const { authMiddleware } = require('../../common/middleware/auth.middleware')

const router = express.Router()

router.get('/', authMiddleware, getMe)
router.patch('/username', authMiddleware, updateUsername)

module.exports = router
