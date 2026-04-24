const express = require('express')
const {
  getNotificationPreference,
  updateNotificationPreference,
} = require('./notification-preference/notificationPreference.controller')
const {
  getRelationship,
  sendRequest,
  cancelRequest,
  acceptRequest,
  blockFriendship,
  unblockFriendship,
  getFriends,
} = require('./friendship/friendship.controller')
const { authMiddleware } = require('../../common/middleware/auth.middleware')
const { getChatHistory } = require('./chat/chat.controller')
const { searchUser } = require('./user/user.controller')
const {
  createEvent,
  getEvents,
  getEventDetails,
  joinEvent,
  leaveEvent,
  deleteEvent,
} = require('./event/socialEvent.controller')

const router = express.Router()

router.get('/notification-preference', authMiddleware, getNotificationPreference)
router.patch('/notification-preference', authMiddleware, updateNotificationPreference)

router.get('/users/search', authMiddleware, searchUser)
router.get('/friends', authMiddleware, getFriends)
router.get('/relationships/:friendId', authMiddleware, getRelationship)
router.post('/relationships/:friendId/send-request', authMiddleware, sendRequest)
router.post('/relationships/:friendId/cancel-request', authMiddleware, cancelRequest)
router.post('/relationships/:friendId/accept-request', authMiddleware, acceptRequest)
router.post('/relationships/:friendId/block', authMiddleware, blockFriendship)
router.post('/relationships/:friendId/unblock', authMiddleware, unblockFriendship)

router.get('/chats/:friendId/messages', authMiddleware, getChatHistory)

router.post('/events', authMiddleware, createEvent)
router.get('/events', authMiddleware, getEvents)
router.get('/events/:eventId', authMiddleware, getEventDetails)
router.post('/events/:eventId/join', authMiddleware, joinEvent)
router.post('/events/:eventId/leave', authMiddleware, leaveEvent)
router.delete('/events/:eventId', authMiddleware, deleteEvent)

module.exports = router
