const ChatMessageModel = require('./chat.model')

function buildConversationId(user1Id, user2Id) {
  return [user1Id, user2Id].sort().join('__')
}

async function createMessage({ conversationId, senderId, receiverId, content }) {
  return ChatMessageModel.create({
    conversationId,
    senderId,
    receiverId,
    content,
  })
}

async function getMessagesByConversationId(conversationId) {
  return ChatMessageModel.find({ conversationId }).sort({ createdAt: 1 })
}

module.exports = {
  buildConversationId,
  createMessage,
  getMessagesByConversationId,
}
