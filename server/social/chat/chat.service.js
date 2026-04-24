const {
  buildConversationId,
  createMessage,
  getMessagesByConversationId,
} = require('./chat.repository')
const { findOrCreateByUsers } = require('../friendship/friendship.repository')

function ensureAcceptedFriendship(friendship) {
  if (friendship.status !== 'ACCEPTED') {
    throw new Error('Private chat is only allowed for accepted friendship.')
  }
}

async function getConversationMessages(currentUserId, friendId) {
  const friendship = await findOrCreateByUsers(currentUserId, friendId)
  ensureAcceptedFriendship(friendship)

  const conversationId = buildConversationId(currentUserId, friendId)
  const messages = await getMessagesByConversationId(conversationId)

  return {
    conversationId,
    messages,
  }
}

async function saveMessage(currentUserId, friendId, content) {
  const friendship = await findOrCreateByUsers(currentUserId, friendId)
  ensureAcceptedFriendship(friendship)

  const conversationId = buildConversationId(currentUserId, friendId)

  const message = await createMessage({
    conversationId,
    senderId: currentUserId,
    receiverId: friendId,
    content,
  })

  return {
    conversationId,
    message,
  }
}

module.exports = {
  getConversationMessages,
  saveMessage,
}
