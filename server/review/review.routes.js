const express = require('express')
const {
  createReview,
  viewReviewsForWine,
  editReview,
  deleteReview,
  searchWines,
  listReviewedWines,
  getAllowedNotes,
} = require('./review.controller')
const { authMiddleware } = require('../../common/middleware/auth.middleware')

const router = express.Router()

router.get('/notes', authMiddleware, getAllowedNotes)
router.get('/wines/search', authMiddleware, searchWines)
router.get('/wines', authMiddleware, listReviewedWines)
router.get('/wines/:wineId/reviews', authMiddleware, viewReviewsForWine)
router.post('/', authMiddleware, createReview)
router.patch('/:reviewId', authMiddleware, editReview)
router.delete('/:reviewId', authMiddleware, deleteReview)

module.exports = router
