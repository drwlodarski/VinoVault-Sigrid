// friendship/friendship.controller.js
const {
  getFriendshipState,
  sendFriendRequest,
  cancelFriendRequest,
  acceptFriendRequest,
  blockUser,
  unblockUser,
  listFriendships,
} = require('./friendship.service')

async function getRelationship(req, res, next) {
  try {
    const currentUserId = req.auth.userId
    const targetUserId = req.params.friendId

    if (!currentUserId) {
      return res.status(401).json({ message: 'Unauthorized' })
    }

    if (!targetUserId) {
      return res.status(400).json({ message: 'friendId is required' })
    }

    const result = await getFriendshipState(currentUserId, targetUserId)

    return res.status(200).json({
      data: result,
    })
  } catch (error) {
    next(error)
  }
}

async function sendRequest(req, res, next) {
  try {
    const currentUserId = req.auth.userId
    const targetUserId = req.params.friendId

    if (!currentUserId) {
      return res.status(401).json({ message: 'Unauthorized' })
    }

    if (!targetUserId) {
      return res.status(400).json({ message: 'friendId is required' })
    }

    const result = await sendFriendRequest(currentUserId, targetUserId)

    return res.status(200).json({
      message: 'Friend request sent successfully',
      data: result,
    })
  } catch (error) {
    next(error)
  }
}

async function cancelRequest(req, res, next) {
  try {
    const currentUserId = req.auth.userId
    const targetUserId = req.params.friendId

    if (!currentUserId) {
      return res.status(401).json({ message: 'Unauthorized' })
    }

    if (!targetUserId) {
      return res.status(400).json({ message: 'friendId is required' })
    }

    const result = await cancelFriendRequest(currentUserId, targetUserId)

    return res.status(200).json({
      message: 'Friend request canceled successfully',
      data: result,
    })
  } catch (error) {
    next(error)
  }
}

async function acceptRequest(req, res, next) {
  try {
    const currentUserId = req.auth.userId
    const targetUserId = req.params.friendId

    if (!currentUserId) {
      return res.status(401).json({ message: 'Unauthorized' })
    }

    if (!targetUserId) {
      return res.status(400).json({ message: 'friendId is required' })
    }

    const result = await acceptFriendRequest(currentUserId, targetUserId)

    return res.status(200).json({
      message: 'Friend request accepted successfully',
      data: result,
    })
  } catch (error) {
    next(error)
  }
}

async function blockFriendship(req, res, next) {
  try {
    const currentUserId = req.auth.userId
    const targetUserId = req.params.friendId

    if (!currentUserId) {
      return res.status(401).json({ message: 'Unauthorized' })
    }

    if (!targetUserId) {
      return res.status(400).json({ message: 'friendId is required' })
    }

    const result = await blockUser(currentUserId, targetUserId)

    return res.status(200).json({
      message: 'User blocked successfully',
      data: result,
    })
  } catch (error) {
    next(error)
  }
}

async function unblockFriendship(req, res, next) {
  try {
    const currentUserId = req.auth.userId
    const targetUserId = req.params.friendId

    if (!currentUserId) {
      return res.status(401).json({ message: 'Unauthorized' })
    }

    if (!targetUserId) {
      return res.status(400).json({ message: 'friendId is required' })
    }

    const result = await unblockUser(currentUserId, targetUserId)

    return res.status(200).json({
      message: 'User unblocked successfully',
      data: result,
    })
  } catch (error) {
    next(error)
  }
}

async function getFriends(req, res, next) {
  try {
    const currentUserId = req.auth.userId
    if (!currentUserId) {
      return res.status(401).json({ message: 'Unauthorized' })
    }

    const data = await listFriendships(currentUserId)
    return res.status(200).json({ data })
  } catch (error) {
    next(error)
  }
}

module.exports = {
  getRelationship,
  sendRequest,
  cancelRequest,
  acceptRequest,
  blockFriendship,
  unblockFriendship,
  getFriends,
}
