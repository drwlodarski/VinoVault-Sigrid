const { buildConversationId } = require('./chat.repository')
const { saveMessage } = require('./chat.service')
const { findOrCreateByUsers } = require('../friendship/friendship.repository')

function registerChatSocket(io) {
  io.on('connection', (socket) => {
    socket.on('join_chat', async ({ currentUserId, friendId }) => {
      try {
        const friendship = await findOrCreateByUsers(currentUserId, friendId)

        if (friendship.status !== 'ACCEPTED') {
          socket.emit('chat_error', {
            message: 'Private chat is only allowed for accepted friendship.',
          })
          return
        }

        const conversationId = buildConversationId(currentUserId, friendId)
        socket.join(conversationId)
      } catch (error) {
        socket.emit('chat_error', { message: error.message })
      }
    })

    socket.on('send_message', async ({ currentUserId, friendId, content }) => {
      try {
        if (!content || !content.trim()) {
          socket.emit('chat_error', { message: 'Message content is required.' })
          return
        }

        const result = await saveMessage(currentUserId, friendId, content.trim())

        io.to(result.conversationId).emit('receive_message', result.message)
      } catch (error) {
        socket.emit('chat_error', { message: error.message })
      }
    })
  })
}

module.exports = {
  registerChatSocket,
}
