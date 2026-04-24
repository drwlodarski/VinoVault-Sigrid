const mongoose = require('mongoose')

const chatMessageSchema = new mongoose.Schema(
  {
    conversationId: {
      type: String,
      required: true,
      index: true,
    },
    senderId: {
      type: String,
      required: true,
    },
    receiverId: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { timestamps: true }
)

const ChatMessageModel = mongoose.model('ChatMessage', chatMessageSchema)

module.exports = ChatMessageModel
