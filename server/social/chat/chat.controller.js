const { getConversationMessages } = require('./chat.service')

async function getChatHistory(req, res, next) {
  try {
    const currentUserId = req.auth.userId
    const friendId = req.params.friendId

    if (!currentUserId) {
      return res.status(401).json({ message: 'Unauthorized' })
    }

    if (!friendId) {
      return res.status(400).json({ message: 'friendId is required' })
    }

    const result = await getConversationMessages(currentUserId, friendId)

    return res.status(200).json({
      data: result,
    })
  } catch (error) {
    next(error)
  }
}

module.exports = {
  getChatHistory,
}
