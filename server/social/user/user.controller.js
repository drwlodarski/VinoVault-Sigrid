const { createClerkClient } = require('@clerk/backend')
const { findByUsers } = require('../friendship/friendship.repository')

const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY,
})

async function searchUser(req, res, next) {
  try {
    const currentUserId = req.auth.userId
    const username = req.query.username?.trim()

    if (!username) {
      return res.status(400).json({ message: 'username query param is required' })
    }

    const { data: users } = await clerkClient.users.getUserList({
      username: [username],
    })

    if (!users || users.length === 0) {
      return res.status(404).json({ message: 'User not found' })
    }

    const targetUser = users[0]
    const targetUserId = targetUser.id

    if (targetUserId === currentUserId) {
      return res.status(400).json({ message: 'Cannot search yourself' })
    }

    const friendship = await findByUsers(currentUserId, targetUserId)

    const status = friendship?.status || 'NONE'
    const requestedBy = friendship?.requestedBy || null
    const blockedBy = friendship?.blockedBy || null

    return res.status(200).json({
      data: {
        user: {
          clerkId: targetUserId,
          username: targetUser.username,
          status,
          requestedBy,
          blockedBy,
          blockedYou: blockedBy === targetUserId,
        },
      },
    })
  } catch (error) {
    next(error)
  }
}

module.exports = { searchUser }
